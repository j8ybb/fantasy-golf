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
  
  // Status State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  // History & Trends State
  const [history, setHistory] = useState<any[]>([])
  const [rankHistory, setRankHistory] = useState<number[]>([])

  const supabase = createClient()
  const router = useRouter()

  // --- HELPER: FORCE 10AM UTC DEADLINE ---
  const getDeadline = (dateStr: string) => {
    const datePart = dateStr.split('T')[0]
    return new Date(`${datePart}T10:00:00Z`).getTime()
  }

  const calculateTimeLeft = useCallback(() => {
    if (!activeTournament) return null
    const now = new Date().getTime()
    // Updated to use the consistent 10am Deadline
    const target = getDeadline(activeTournament.start_date)
    
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
        // Check lock status immediately
        const now = new Date().getTime()
        const deadline = getDeadline(tourneyData.start_date)
        if (now >= deadline) setIsLocked(true)
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

    const { error } = await supabase.from('weekly_choices').upsert({
      user_id: user.id,
      tournament_id: activeTournament.id,
      captain_id: captainId,
      wildcard_out_id: wildcardActive ? playerOut : null,
      wildcard_in_id: wildcardActive ? playerIn : null
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
        
        {/* HEADER AREA */}
        <div className="bg-green-950 text-white rounded-2xl p-8 shadow-2xl border-b-4 border-yellow-500 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-display uppercase tracking-widest text-yellow-500">
              {activeTournament?.name || "No Active Tournament"}
            </h1>
          </div>
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none text-[120px] font-black leading-none -rotate-12 translate-y-10 whitespace-nowrap uppercase">
            PGA TOUR
          </div>
        </div>

        {/* --- STATUS / TIMER CARD --- */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
             <p className="text-[10px] font-black uppercase text-green-600 tracking-[0.2em] mb-2">Tournament Status</p>
             
             {isLocked ? (
                 <div className="flex items-center gap-2 bg-red-50 border border-red-100 px-5 py-2 rounded-full animate-pulse">
                   <span className="relative flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                   </span>
                   <span className="text-sm font-bold text-red-600 uppercase tracking-widest">Locked • Live</span>
                 </div>
             ) : timeLeft ? (
                 <div className="flex gap-4 items-center justify-center bg-gray-50 px-6 py-3 rounded-xl border border-gray-100">
                     <div className="text-center">
                         <span className="block text-2xl font-bold text-gray-800 leading-none">{timeLeft.days}</span>
                         <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Days</span>
                     </div>
                     <span className="text-gray-300 font-light text-2xl">:</span>
                     <div className="text-center">
                         <span className="block text-2xl font-bold text-gray-800 leading-none">{timeLeft.hours}</span>
                         <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Hours</span>
                     </div>
                     <span className="text-gray-300 font-light text-2xl">:</span>
                     <div className="text-center">
                         <span className="block text-2xl font-bold text-gray-800 leading-none">{timeLeft.minutes}</span>
                         <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Mins</span>
                     </div>
                     <span className="text-gray-300 font-light text-2xl">:</span>
                     <div className="text-center">
                         <span className="block text-2xl font-bold text-gray-800 leading-none">{timeLeft.seconds}</span>
                         <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Secs</span>
                     </div>
                 </div>
             ) : (
                 <span className="text-xs uppercase font-bold text-gray-400">Loading Timer...</span>
             )}
        </div>

        {/* CAPTAIN SELECTION */}
        <div className={`bg-white p-6 rounded-xl shadow-lg border-t-4 border-yellow-500 transition-opacity ${isLocked ? 'opacity-70 pointer-events-none grayscale-[0.5]' : ''}`}>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
            <span className="flex items-center"><span className="bg-yellow-100 text-yellow-700 p-2 rounded-lg mr-3 text-2xl">👑</span> Select Captain</span>
            {isLocked && <span className="text-xs font-bold text-red-500 uppercase bg-red-50 px-2 py-1 rounded">Locked</span>}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {roster.map(player => (
              <button
                key={player.id}
                onClick={() => setCaptainId(player.id)}
                disabled={isLocked}
                className={`relative flex items-center p-4 rounded-lg border-2 transition-all text-left ${captainId === player.id ? 'border-yellow-500 bg-yellow-50 shadow-md' : 'border-gray-100 hover:border-gray-300'}`}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-gray-800">{player.name}</span>
                  <span className="text-xs text-gray-400">${player.cost?.toFixed(1)}m</span>
                </div>
                {captainId === player.id && <div className="absolute top-[-8px] right-[-8px] bg-yellow-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Captain</div>}
              </button>
            ))}
          </div>
        </div>

        {/* WILDCARD MANAGEMENT */}
        <div className={`bg-white p-6 rounded-xl shadow-lg border-t-4 border-gray-800 transition-opacity ${isLocked ? 'opacity-70 pointer-events-none grayscale-[0.5]' : ''}`}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center"><span className="bg-gray-100 p-2 rounded-lg mr-3 text-2xl">🃏</span><h2 className="text-xl font-bold text-gray-800">Weekly Wildcard</h2></div>
            <button 
                onClick={() => setWildcardActive(!wildcardActive)} 
                disabled={isLocked}
                className={`px-6 py-2 rounded-full font-black text-[10px] tracking-widest uppercase transition-all ${wildcardActive ? 'bg-green-700 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
            >
              {wildcardActive ? 'Active' : 'Activate'}
            </button>
          </div>
          {wildcardActive && (
            <div className="bg-gray-50 p-6 rounded-lg space-y-4 animate-in slide-in-from-top-2">
              <div className={`p-4 rounded-lg flex justify-between items-center ${isOverBudget ? 'bg-red-100 text-red-900 border border-red-200' : 'bg-green-100 text-green-900 border border-green-200'}`}>
                <span className="font-bold">Projected Cost: ${projectedCost.toFixed(1)}m</span>
                <span className="text-xs uppercase font-black">Limit: ${BUDGET_CAP}m</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <select className="w-full p-3 border rounded-lg bg-white outline-none" value={playerOut || ''} onChange={(e) => setPlayerOut(Number(e.target.value))}>
                  <option value="">Bench Player (Out)...</option>
                  {roster.map(p => <option key={p.id} value={p.id}>{p.name} (${p.cost?.toFixed(1)}m)</option>)}
                </select>
                <select className="w-full p-3 border rounded-lg bg-white outline-none" value={playerIn || ''} onChange={(e) => setPlayerIn(Number(e.target.value))}>
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
            className={`w-full font-display uppercase tracking-widest text-xl py-5 rounded-xl shadow-xl transition-all transform hover:scale-[1.01] ${isOverBudget || !captainId ? 'bg-gray-400 text-gray-200' : saveStatus === 'success' ? 'bg-green-600 text-white' : 'bg-green-950 hover:bg-green-900 text-white'}`}
          >
            {saving ? 'Saving...' : saveStatus === 'success' ? '✅ Selection Saved' : 'Confirm & Save Strategy'}
          </button>
        )}

        {/* TOURNAMENT HISTORY */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-8 py-5 border-b border-gray-200"><h2 className="text-xl font-display text-green-900 uppercase tracking-widest">Tournament Results</h2></div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <tbody className="divide-y divide-gray-50">
                   {history.map((row, idx) => (
                      <tr key={idx} className="hover:bg-green-50/50 transition">
                          <td className="px-8 py-5 font-bold text-gray-700">{row.tournament?.name}</td>
                          <td className="px-8 py-5 text-sm text-gray-500">👑 {row.choices?.captain?.name}</td>
                          <td className="px-8 py-5 text-right font-display text-2xl text-green-700 font-light">{row.points}</td>
                      </tr>
                   ))}
                   {history.length === 0 && (<tr><td className="p-10 text-center italic text-gray-400">No results recorded yet.</td></tr>)}
                </tbody>
             </table>
          </div>
        </div>

        {/* RANK PROGRESSION BOX */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
           <h2 className="text-xl font-display text-green-900 uppercase tracking-widest mb-6 text-center">Rank Progression</h2>
           <div className="h-32 flex items-end gap-2 border-b border-gray-100 px-4">
             {rankHistory.map((rank, i) => (
               <div key={i} className="flex-1 bg-green-100 hover:bg-green-600 transition-all rounded-t-sm relative group" style={{ height: `${(30-rank)*100/30}%` }}>
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-20">Rank: {rank}</div>
               </div>
             ))}
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