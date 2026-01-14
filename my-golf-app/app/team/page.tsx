'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const BUDGET_CAP = 30.0

export default function MyTeam() {
  const [roster, setRoster] = useState<any[]>([])
  const [allGolfers, setAllGolfers] = useState<any[]>([])
  const [captainId, setCaptainId] = useState<number | null>(null)
  
  // Tournament & Lock State
  const [activeTournament, setActiveTournament] = useState<any>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null)
  
  // Wildcard State
  const [wildcardActive, setWildcardActive] = useState(false)
  const [playerOut, setPlayerOut] = useState<number | null>(null)
  const [playerIn, setPlayerIn] = useState<number | null>(null)
  
  // Data & Status State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  // History & Trends State
  const [history, setHistory] = useState<any[]>([])
  const [rankHistory, setRankHistory] = useState<number[]>([])

  const supabase = createClient()
  const router = useRouter()

  const calculateTimeLeft = useCallback(() => {
    if (!activeTournament) return null
    const now = new Date().getTime()
    const target = new Date(activeTournament.start_date).getTime()
    const difference = target - now
    if (difference <= 0) {
      setIsLocked(true)
      return null
    }
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    }
  }, [activeTournament])

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data: tourneyData } = await supabase
        .from('tournaments')
        .select('*')
        .neq('status', 'COMPLETED')
        .order('start_date', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (tourneyData) {
        setActiveTournament(tourneyData)
        if (new Date() >= new Date(tourneyData.start_date)) setIsLocked(true)
      }

      const { data: teamData } = await supabase
        .from('season_rosters')
        .select(`
          player_1:golfers!season_rosters_player_1_id_fkey(*),
          player_2:golfers!season_rosters_player_2_id_fkey(*),
          player_3:golfers!season_rosters_player_3_id_fkey(*),
          player_4:golfers!season_rosters_player_4_id_fkey(*),
          player_5:golfers!season_rosters_player_5_id_fkey(*),
          player_6:golfers!season_rosters_player_6_id_fkey(*)
        `)
        .eq('user_id', user.id)
        .maybeSingle()

      if (teamData) {
        setRoster([teamData.player_1, teamData.player_2, teamData.player_3, teamData.player_4, teamData.player_5, teamData.player_6])
      }

      const { data: golfers } = await supabase.from('golfers').select('*').order('cost', { ascending: false })
      if (golfers) setAllGolfers(golfers)

      if (tourneyData) {
        const { data: choices } = await supabase
          .from('weekly_choices')
          .select('*')
          .eq('user_id', user.id)
          .eq('tournament_id', tourneyData.id)
          .maybeSingle()

        if (choices) {
          setCaptainId(choices.captain_id)
          if (choices.wildcard_in_id) {
            setWildcardActive(true)
            setPlayerOut(choices.wildcard_out_id)
            setPlayerIn(choices.wildcard_in_id)
          }
        }
      }

      const { data: historyData } = await supabase
        .from('user_scores')
        .select(`
          points,
          tournament:tournaments(name, start_date),
          choices:weekly_choices(
            captain:golfers!weekly_choices_captain_id_fkey(name),
            wildcard_in:golfers!weekly_choices_wildcard_in_id_fkey(name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (historyData) {
        setHistory(historyData)
        // Mocking rank progression until DB scoring events are triggered
        setRankHistory(historyData.map((_, i) => Math.floor(Math.random() * 15) + 1))
      }

      setLoading(false)
    }
    fetchData()
  }, [router, supabase])

  useEffect(() => {
    if (!activeTournament || isLocked) return
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000)
    return () => clearInterval(timer)
  }, [activeTournament, isLocked, calculateTimeLeft])

  const getProjectedCost = () => {
    let total = roster.reduce((sum, p) => sum + (p.cost || 0), 0)
    if (wildcardActive && playerOut && playerIn) {
      const outGolfer = roster.find(p => p.id === playerOut)
      const inGolfer = allGolfers.find(p => p.id === playerIn)
      if (outGolfer && inGolfer) total = total - outGolfer.cost + inGolfer.cost
    }
    return total
  }

  const projectedCost = getProjectedCost()
  const isOverBudget = projectedCost > BUDGET_CAP

  const saveChoices = async () => {
    if (isLocked) return
    setSaving(true)
    setSaveStatus('idle')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !activeTournament) return

    const wcOut = wildcardActive ? playerOut : null
    const wcIn = wildcardActive ? playerIn : null
    
    if (wildcardActive && (!wcOut || !wcIn)) {
        setSaving(false)
        return alert('Please select both a player to bench and a player to bring in!')
    }

    const { error } = await supabase.from('weekly_choices').upsert({
      user_id: user.id,
      tournament_id: activeTournament.id,
      captain_id: captainId,
      wildcard_out_id: wcOut,
      wildcard_in_id: wcIn
    }, { onConflict: 'user_id, tournament_id' })

    setSaving(false)
    if (error) {
        setSaveStatus('error')
    } else {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  if (loading) return <div className="p-10 text-center font-display text-green-800 animate-pulse">Entering the Clubhouse...</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        
        {/* HEADER & TIMER WITH SUBTLE BG TEXT */}
        <div className="bg-green-950 text-white rounded-2xl p-8 shadow-2xl border-b-4 border-yellow-500 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-display uppercase tracking-widest text-yellow-500">
              {activeTournament?.name || "No Active Tournament"}
            </h1>
            {isLocked ? (
              <div className="mt-4 inline-block bg-red-600 px-6 py-2 rounded-full text-sm font-black uppercase tracking-tighter shadow-lg">
                🔒 Selection Locked
              </div>
            ) : timeLeft && (
              <div className="mt-4 flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-green-400 mb-2">Deadline in</span>
                <div className="flex gap-4 text-center">
                   <div className="flex flex-col"><span className="text-3xl font-display font-bold leading-none">{timeLeft.days}</span><span className="text-[10px] uppercase opacity-60">Days</span></div>
                   <span className="text-3xl font-display opacity-30">:</span>
                   <div className="flex flex-col"><span className="text-3xl font-display font-bold leading-none">{timeLeft.hours}</span><span className="text-[10px] uppercase opacity-60">Hrs</span></div>
                   <span className="text-3xl font-display opacity-30">:</span>
                   <div className="flex flex-col"><span className="text-3xl font-display font-bold leading-none">{timeLeft.minutes}</span><span className="text-[10px] uppercase opacity-60">Mins</span></div>
                </div>
              </div>
            )}
          </div>
          {/* Subtle Background Pattern Restored */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none text-[120px] font-black leading-none -rotate-12 translate-y-10 whitespace-nowrap">
            PGA TOUR
          </div>
        </div>

        {/* CAPTAIN SELECTION */}
        <div className={`bg-white p-6 rounded-xl shadow-lg border-t-4 border-yellow-500 ${isLocked ? 'opacity-70 pointer-events-none' : ''}`}>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
            <span className="flex items-center"><span className="bg-yellow-100 text-yellow-700 p-2 rounded-lg mr-3 text-2xl">👑</span> Select Captain</span>
            <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">2x POINTS</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {roster.map(player => (
              <button
                key={player.id}
                onClick={() => setCaptainId(player.id)}
                disabled={isLocked}
                className={`relative flex items-center p-3 rounded-lg border-2 transition-all text-left ${captainId === player.id ? 'border-yellow-500 bg-yellow-50 shadow-md' : 'border-gray-100 bg-white hover:border-gray-300'}`}
              >
                <div className="flex flex-col">
                  <span className={`font-bold text-sm ${captainId === player.id ? 'text-green-900' : 'text-gray-700'}`}>{player.name}</span>
                  <span className="text-xs text-gray-500">${player.cost?.toFixed(1)}m</span>
                </div>
                {captainId === player.id && <div className="absolute top-[-8px] right-[-8px] bg-yellow-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-md uppercase">Captain</div>}
              </button>
            ))}
          </div>
        </div>

        {/* WILDCARD MANAGEMENT */}
        <div className={`bg-white p-6 rounded-xl shadow-lg border-t-4 border-gray-800 ${isLocked ? 'opacity-70 pointer-events-none' : ''}`}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center"><span className="bg-gray-100 p-2 rounded-lg mr-3 text-2xl">🃏</span><h2 className="text-xl font-bold text-gray-800">Weekly Wildcard</h2></div>
            <button onClick={() => setWildcardActive(!wildcardActive)} disabled={isLocked} className={`px-6 py-2 rounded-full font-black text-xs uppercase transition-all tracking-widest ${wildcardActive ? 'bg-green-700 text-white shadow-lg' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>{wildcardActive ? 'ACTIVE' : 'ACTIVATE'}</button>
          </div>
          {wildcardActive && (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
              <div className={`p-4 rounded-lg flex justify-between items-center ${isOverBudget ? 'bg-red-100 text-red-900 border border-red-200' : 'bg-green-100 text-green-900 border border-green-200'}`}>
                <span className="font-bold">Projected Cost: ${projectedCost.toFixed(1)}m</span>
                <span className="font-bold text-xs">LIMIT: ${BUDGET_CAP}m</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <select className="w-full p-3 border rounded-lg bg-white shadow-sm outline-none" value={playerOut || ''} onChange={(e) => setPlayerOut(Number(e.target.value))} disabled={isLocked}>
                  <option value="">Bench Player (Out)...</option>
                  {roster.map(p => <option key={p.id} value={p.id}>{p.name} (${p.cost?.toFixed(1)}m)</option>)}
                </select>
                <select className="w-full p-3 border rounded-lg bg-white shadow-sm outline-none" value={playerIn || ''} onChange={(e) => setPlayerIn(Number(e.target.value))} disabled={isLocked}>
                  <option value="">Draft Player (In)...</option>
                  {allGolfers.filter(g => !roster.find(r => r.id === g.id)).map(g => <option key={g.id} value={g.id}>{g.name} (${g.cost?.toFixed(1)}m)</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* SAVE BUTTON */}
        {!isLocked && (
          <button
            onClick={saveChoices}
            disabled={saving || isOverBudget || !captainId}
            className={`w-full font-display uppercase tracking-widest text-xl py-5 rounded-xl shadow-xl transition-all transform hover:scale-[1.01] ${isOverBudget || !captainId ? 'bg-gray-400 text-gray-200' : saveStatus === 'success' ? 'bg-green-600 text-white' : 'bg-green-900 hover:bg-green-800 text-white'}`}
          >
            {saving ? 'Saving...' : saveStatus === 'success' ? '✅ SAVED SUCCESSFULLY' : 'Confirm & Save Strategy'}
          </button>
        )}

        {/* PERFORMANCE HISTORY */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-8 py-5 border-b border-gray-200">
             <h2 className="text-xl font-display text-green-900 uppercase tracking-widest">Tournament Results</h2>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                   <tr className="text-[10px] uppercase font-black text-gray-400 tracking-widest bg-white border-b">
                      <th className="px-8 py-4">Event</th>
                      <th className="px-8 py-4">Captain Choice</th>
                      <th className="px-8 py-4">Wildcard Player</th>
                      <th className="px-8 py-4 text-right">Points Earned</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {history.map((row, idx) => (
                      <tr key={idx} className="hover:bg-green-50 transition">
                         <td className="px-8 py-5 font-bold text-gray-700">{row.tournament?.name}</td>
                         <td className="px-8 py-5 text-sm text-gray-600">👑 {row.choices?.captain?.name}</td>
                         <td className="px-8 py-5 text-sm text-gray-500">{row.choices?.wildcard_in?.name || "None Used"}</td>
                         <td className="px-8 py-5 text-right font-display text-2xl text-green-700 font-light">{row.points?.toLocaleString()}</td>
                      </tr>
                   ))}
                   {history.length === 0 && (
                      <tr><td colSpan={4} className="p-10 text-center italic text-gray-400">No results recorded yet for the 2026 season.</td></tr>
                   )}
                </tbody>
             </table>
          </div>
        </div>

        {/* RANK HISTORY BOX (MOVED TO BOTTOM) */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Season Progress</p>
              <h2 className="text-2xl font-display text-green-900 uppercase">Rank History</h2>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-400">Current Rank: </span>
              <span className="text-2xl font-display text-yellow-600 font-bold">
                {rankHistory.length > 0 ? rankHistory[rankHistory.length - 1] : 'N/A'}
              </span>
            </div>
          </div>

          <div className="h-32 flex items-end gap-2 px-2 border-b border-gray-100">
            {rankHistory.map((rank, i) => {
              const maxRank = 30; 
              const height = ((maxRank - rank) / maxRank) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  <div 
                    className="w-full bg-green-100 rounded-t-sm group-hover:bg-green-600 transition-all duration-500"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  ></div>
                  <div className="absolute -top-8 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                    Rank: {rank}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
            <span>Season Start</span>
            <span>Latest Standings</span>
          </div>
        </div>

      </div>
    </div>
  )
}