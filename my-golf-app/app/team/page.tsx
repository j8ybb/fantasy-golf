'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// CONSTANTS
const BUDGET_CAP = 30.0

export default function MyTeam() {
  const [roster, setRoster] = useState<any[]>([])
  const [allGolfers, setAllGolfers] = useState<any[]>([])
  const [captainId, setCaptainId] = useState<number | null>(null)
  
  // Wildcard State
  const [wildcardActive, setWildcardActive] = useState(false)
  const [playerOut, setPlayerOut] = useState<number | null>(null)
  const [playerIn, setPlayerIn] = useState<number | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()
  const CURRENT_WEEK = 1 

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      // 1. Fetch Season Roster
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
        setRoster([
          teamData.player_1, teamData.player_2, teamData.player_3,
          teamData.player_4, teamData.player_5, teamData.player_6
        ])
      }

      // 2. Fetch All Golfers
      const { data: golfers } = await supabase.from('golfers').select('*').order('cost', { ascending: false })
      if (golfers) setAllGolfers(golfers)

      // 3. Fetch Choices
      const { data: choices } = await supabase
        .from('weekly_choices')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_number', CURRENT_WEEK)
        .maybeSingle()

      if (choices) {
        setCaptainId(choices.captain_id)
        if (choices.wildcard_in_id) {
          setWildcardActive(true)
          setPlayerOut(choices.wildcard_out_id)
          setPlayerIn(choices.wildcard_in_id)
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  // --- CALCULATIONS ---
  const getCurrentTeamCost = () => {
    return roster.reduce((sum, p) => sum + (p.cost || 0), 0)
  }

  const getProjectedCost = () => {
    let total = getCurrentTeamCost()
    
    if (wildcardActive && playerOut && playerIn) {
      const outGolfer = roster.find(p => p.id === playerOut)
      const inGolfer = allGolfers.find(p => p.id === playerIn)
      
      if (outGolfer && inGolfer) {
        total = total - outGolfer.cost + inGolfer.cost
      }
    }
    return total
  }

  const projectedCost = getProjectedCost()
  const isOverBudget = projectedCost > BUDGET_CAP
  const remainingBudget = (BUDGET_CAP - projectedCost).toFixed(1)

  // --- SAVE ---
  const saveChoices = async () => {
    if (!captainId) return alert('⚠️ Please select a Captain first!')
    if (isOverBudget) return alert('⚠️ You are over budget! Adjust your wildcard selection.')

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      week_number: CURRENT_WEEK,
      captain_id: captainId,
      wildcard_out_id: wildcardActive ? playerOut : null,
      wildcard_in_id: wildcardActive ? playerIn : null
    }

    const { error } = await supabase.from('weekly_choices').upsert(payload, { onConflict: 'user_id, week_number' })

    setSaving(false)
    if (!error) alert('✅ Tactics Saved Successfully!')
    else alert('❌ Error saving tactics')
  }

  if (loading) return <div className="p-10 text-center font-display text-green-800 animate-pulse">Loading Locker Room...</div>

  if (roster.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-gray-800">No Team Found</h1>
        <Link href="/" className="mt-4 bg-green-800 text-white py-2 px-6 rounded">Go to Draft Room</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display text-green-900 uppercase">Week {CURRENT_WEEK} Strategy</h1>
          <p className="text-gray-500">Lock in your adjustments before the first tee time.</p>
        </div>

        {/* SECTION 1: CAPTAIN */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-yellow-500">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
            <span className="flex items-center">
              <span className="bg-yellow-100 text-yellow-700 p-2 rounded-lg mr-3 text-2xl">👑</span> 
              Select Captain
            </span>
            <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">2x POINTS</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {roster.map(player => (
              <button
                key={player.id}
                onClick={() => setCaptainId(player.id)}
                className={`relative flex items-center p-3 rounded-lg border-2 transition-all text-left ${
                  captainId === player.id 
                    ? 'border-yellow-500 bg-yellow-50/50 shadow-md ring-1 ring-yellow-500' 
                    : 'border-gray-100 hover:border-gray-300 bg-white'
                }`}
              >
                {player.flag ? (
                  <img src={`https://flagcdn.com/24x18/${player.flag.toLowerCase()}.png`} className="w-6 h-4 mr-3 rounded shadow-sm" />
                ) : <span className="mr-3 text-xl">⛳</span>}
                
                <div className="flex flex-col">
                  <span className={`font-bold text-sm leading-tight ${captainId === player.id ? 'text-green-900' : 'text-gray-700'}`}>
                    {player.name}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">${player.cost}m</span>
                </div>

                {captainId === player.id && (
                  <div className="absolute top-[-8px] right-[-8px] bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    CAPTAIN
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 2: WILDCARD */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center">
              <span className="bg-gray-100 text-gray-700 p-2 rounded-lg mr-3 text-2xl">🃏</span> 
              <div>
                <h2 className="text-xl font-bold text-gray-800">One-Week Wildcard</h2>
                <p className="text-xs text-gray-500">Swap a player for one week only.</p>
              </div>
            </div>

            <button 
              onClick={() => setWildcardActive(!wildcardActive)}
              className={`px-6 py-2 rounded-full font-bold transition-all shadow-sm ${
                wildcardActive 
                  ? 'bg-green-700 text-white ring-2 ring-green-300' 
                  : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
              }`}
            >
              {wildcardActive ? 'WILDCARD ACTIVE' : 'ACTIVATE WILDCARD'}
            </button>
          </div>

          {wildcardActive && (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-4 duration-300">
              
              {/* BUDGET CALCULATOR */}
              <div className={`mb-6 p-4 rounded-lg flex justify-between items-center ${isOverBudget ? 'bg-red-100 text-red-900 border border-red-300' : 'bg-green-100 text-green-900 border border-green-300'}`}>
                <div className="flex flex-col">
                   <span className="text-xs font-bold uppercase tracking-wider opacity-70">Projected Team Cost</span>
                   <span className="text-2xl font-display font-bold">
                     ${projectedCost.toFixed(1)}m <span className="text-sm font-sans opacity-60">/ ${BUDGET_CAP}m</span>
                   </span>
                </div>
                <div className="text-right">
                  {isOverBudget ? (
                     <div className="flex items-center text-red-700 font-bold">
                       <span>⚠️ OVER BUDGET</span>
                     </div>
                  ) : (
                     <div className="text-green-700 font-bold text-sm">
                       ✅ ${remainingBudget}m Remaining
                     </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 items-center">
                {/* OUT */}
                <div>
                  <label className="block text-xs font-bold text-red-600 uppercase mb-2 tracking-wider">Bench Player (Out)</label>
                  <select 
                    className="w-full p-3 border border-red-200 rounded-lg bg-white focus:ring-2 focus:ring-red-200 outline-none font-mono text-sm"
                    value={playerOut || ''}
                    onChange={(e) => setPlayerOut(Number(e.target.value))}
                  >
                    <option value="">Select player to drop...</option>
                    {roster.map(p => <option key={p.id} value={p.id}>{p.name} (${p.cost}m)</option>)}
                  </select>
                </div>

                <div className="flex justify-center">
                   <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm text-gray-400">
                     ⇄
                   </div>
                </div>

                {/* IN */}
                <div>
                  <label className="block text-xs font-bold text-green-600 uppercase mb-2 tracking-wider">Play Golfer (In)</label>
                  <select 
                    className="w-full p-3 border border-green-200 rounded-lg bg-white focus:ring-2 focus:ring-green-200 outline-none font-mono text-sm"
                    value={playerIn || ''}
                    onChange={(e) => setPlayerIn(Number(e.target.value))}
                  >
                    <option value="">Select player to add...</option>
                    {allGolfers
                      .filter(g => !roster.find(r => r.id === g.id)) 
                      .map(g => (
                      <option key={g.id} value={g.id}>{g.name} (${g.cost}m)</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SAVE BUTTON */}
        <button
          onClick={saveChoices}
          disabled={saving || isOverBudget}
          className={`w-full font-display uppercase tracking-widest text-xl py-5 rounded-xl shadow-xl transition-all transform hover:scale-[1.01] hover:shadow-2xl 
            ${isOverBudget 
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
              : 'bg-green-900 hover:bg-green-800 text-white'
            }`}
        >
          {saving ? 'Saving...' : isOverBudget ? 'Budget Exceeded' : 'Confirm & Save Strategy'}
        </button>

      </div>
    </div>
  )
}