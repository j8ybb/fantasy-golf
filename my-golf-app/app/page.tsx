'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Golfer = {
  id: number
  name: string
  cost: number
  world_rank: number
  flag: string | null // <--- Add this line
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [existingTeam, setExistingTeam] = useState<Golfer[] | null>(null)
  const [myTeamName, setMyTeamName] = useState('')
  const [myManagerName, setMyManagerName] = useState('')

  const [golfers, setGolfers] = useState<Golfer[]>([])
  const [draftTeam, setDraftTeam] = useState<Golfer[]>([])
  const [draftName, setDraftName] = useState('')
  const [draftManager, setDraftManager] = useState('')
  const [search, setSearch] = useState('')

  const BUDGET = 25.0
  const MAX_PLAYERS = 6
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('team_name, manager_name')
          .eq('id', user.id)
          .single()
        
        if (profile) {
            setMyTeamName(profile.team_name)
            setMyManagerName(profile.manager_name)
        }

        const { data: roster } = await supabase
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
          .single()

        if (roster) {
          const team = [
            roster.player_1, roster.player_2, roster.player_3,
            roster.player_4, roster.player_5, roster.player_6
          ]
          setExistingTeam(team as any)
        }
      }

      const { data: allGolfers } = await supabase
        .from('golfers')
        .select('*')
        .eq('active', true)
        .order('cost', { ascending: false })

      if (allGolfers) setGolfers(allGolfers)
      setLoading(false)
    }
    init()
  }, [])

  const addPlayer = (player: Golfer) => {
    if (draftTeam.find((p) => p.id === player.id)) return alert('Already in team!')
    if (draftTeam.length >= MAX_PLAYERS) return alert('Team full (6 players max)')
    if (currentSpend + player.cost > BUDGET) return alert('Over budget!')
    setDraftTeam([...draftTeam, player])
  }

  const removePlayer = (playerId: number) => {
    setDraftTeam(draftTeam.filter((p) => p.id !== playerId))
  }

  const submitTeam = async () => {
    if (!user) return (window.location.href = '/login')
    if (!draftName.trim()) return alert('Please enter a Team Name!')
    if (!draftManager.trim()) return alert('Please enter your Manager Name!')

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ team_name: draftName, manager_name: draftManager })
      .eq('id', user.id)

    if (profileError) return alert('Error saving name: ' + profileError.message)

    const payload = {
      user_id: user.id,
      player_1_id: draftTeam[0].id,
      player_2_id: draftTeam[1].id,
      player_3_id: draftTeam[2].id,
      player_4_id: draftTeam[3].id,
      player_5_id: draftTeam[4].id,
      player_6_id: draftTeam[5].id,
    }

    const { error } = await supabase.from('season_rosters').upsert(payload)
    
    if (error) {
      alert(error.message)
    } else {
      setMyTeamName(draftName)
      setMyManagerName(draftManager)
      setExistingTeam(draftTeam)
      alert('Team Saved Successfully!')
    }
  }

  const currentSpend = draftTeam.reduce((sum, p) => sum + p.cost, 0)
  const remainingBudget = (BUDGET - currentSpend).toFixed(1)
  const filteredGolfers = golfers.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-green-800 font-display text-2xl animate-pulse">
      Loading Fairways...
    </div>
  )

  // --- VIEW 1: ALREADY HAS TEAM (DASHBOARD) ---
  if (existingTeam) {
    return (
      <div className="min-h-screen pb-12">
        {/* HEADER BANNER */}
        <div className="bg-green-900 text-white py-12 px-6 shadow-xl border-b-4 border-yellow-500">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="text-center md:text-left">
               <h1 className="text-4xl md:text-6xl font-display uppercase tracking-wider">{myTeamName || 'My Team'}</h1>
               <p className="text-green-200 font-medium tracking-widest uppercase text-sm mt-2">Manager: {myManagerName}</p>
             </div>
             <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
               <div className="text-xs text-green-200 uppercase tracking-widest">Total Value</div>
               <div className="text-3xl font-display text-yellow-400">
                  ${existingTeam.reduce((acc, p) => acc + p.cost, 0).toFixed(1)}m
               </div>
             </div>
          </div>
        </div>

        {/* ROSTER CARDS */}
        <div className="max-w-5xl mx-auto px-6 -mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {existingTeam.map((player) => (
              <div key={player.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">World Rank #{player.world_rank}</span>
                  <span className="font-display text-xl text-green-700">${player.cost.toFixed(1)}m</span>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">{player.name}</h3>
                  <div className="w-12 h-1 bg-yellow-400 rounded-full mt-2"></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 bg-white rounded-lg p-8 text-center shadow-sm border border-gray-100">
             <p className="text-gray-400 font-display text-xl uppercase tracking-widest">Transfers Locked</p>
             <p className="text-sm text-gray-500 mt-2">The transfer window will open after the next tournament.</p>
          </div>
        </div>
      </div>
    )
  }

  // --- VIEW 2: DRAFT BOARD ---
  return (
    <div className="min-h-screen pb-12">
      <div className="bg-green-900 text-white py-10 px-6 shadow-lg border-b-4 border-yellow-500 mb-8">
         <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-display uppercase tracking-wider">Season Draft</h1>
            <p className="text-green-200 mt-2">Assemble your squad of 6 golfers within the ${BUDGET}m salary cap.</p>
         </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Player List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Inputs */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h2 className="font-display text-2xl text-green-800 mb-4 uppercase">Team Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Team Name</label>
                  <input 
                  type="text" 
                  placeholder="e.g. The Tiger Kings" 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Manager Name</label>
                  <input 
                  type="text" 
                  placeholder="e.g. John Doe" 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                  value={draftManager}
                  onChange={(e) => setDraftManager(e.target.value)}
                  />
              </div>
            </div>
          </div>

          {/* Search & List */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b bg-gray-50">
              <input 
                type="text" 
                placeholder="🔍 Search Player Database..." 
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {filteredGolfers.map((player) => {
                const isSelected = draftTeam.some(p => p.id === player.id)
                return (
                  <div key={player.id} className={`flex justify-between items-center p-4 rounded-lg border transition-all duration-200 ${isSelected ? 'bg-green-50 border-green-200 opacity-50' : 'bg-white border-gray-100 hover:border-green-300 hover:shadow-md'}`}>
                    {/* Inside the map function... */}
<div className="flex items-center gap-4">
  <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
    #{player.world_rank}
  </div>
  <div>
    <span className="text-xl mr-2">{player.flag || '🏳️'}</span> {/* The Flag */}
    <span className="font-bold text-lg text-gray-800">{player.name}</span> {/* The Name */}
  </div>
</div>
                    <div className="flex items-center gap-4">
                      <span className="font-display text-xl text-green-700">${player.cost.toFixed(1)}m</span>
                      <button 
                        onClick={() => addPlayer(player)}
                        disabled={isSelected}
                        className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 disabled:bg-gray-300 transition shadow-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Selection Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-xl border border-green-100 sticky top-24">
            <h2 className="font-display text-2xl text-gray-800 mb-6 border-b pb-4 uppercase">Your Squad</h2>
            
            {/* Budget Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm mb-2 font-bold uppercase tracking-wide">
                <span className="text-gray-500">Budget Used</span>
                <span className={Number(remainingBudget) < 0 ? 'text-red-500' : 'text-green-600'}>
                   ${remainingBudget}m Left
                </span>
              </div>
              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                 <div 
                   className={`h-full transition-all duration-500 ${Number(remainingBudget) < 0 ? 'bg-red-500' : 'bg-green-600'}`} 
                   style={{ width: `${Math.min((currentSpend / BUDGET) * 100, 100)}%` }}
                 ></div>
              </div>
            </div>
            
            {/* Selected Players */}
            <div className="space-y-3 min-h-[200px]">
              {draftTeam.length === 0 && (
                <div className="text-center text-gray-400 py-10 text-sm italic">
                  No players selected yet.
                </div>
              )}
              {draftTeam.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 group">
                  <span className="font-semibold text-gray-700">{p.name}</span>
                  <button onClick={() => removePlayer(p.id)} className="text-gray-400 hover:text-red-500 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Footer Status */}
            <div className="mt-6 pt-6 border-t flex justify-between items-center text-sm text-gray-500 font-bold">
               <span>Players: {draftTeam.length}/6</span>
               <span>Total: ${currentSpend.toFixed(1)}m</span>
            </div>

            <button 
              onClick={submitTeam}
              disabled={draftTeam.length !== 6 || currentSpend > BUDGET}
              className="w-full mt-6 bg-green-700 text-white py-4 rounded-lg font-display text-xl uppercase tracking-wider hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {user ? 'Confirm Team' : 'Login to Save'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}