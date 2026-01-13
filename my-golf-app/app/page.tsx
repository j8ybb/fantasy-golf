'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link' // <--- Added for navigation

type Golfer = {
  id: number
  name: string
  cost: number
  world_rank: number
  flag: string | null
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Team Data
  const [existingTeam, setExistingTeam] = useState<Golfer[] | null>(null)
  const [myTeamName, setMyTeamName] = useState('')
  const [myManagerName, setMyManagerName] = useState('')
  
  // NEW: Dashboard Stats State
  const [seasonPoints, setSeasonPoints] = useState(0)
  const [seasonRank, setSeasonRank] = useState(0)

  // Draft Data
  const [golfers, setGolfers] = useState<Golfer[]>([])
  const [draftTeam, setDraftTeam] = useState<Golfer[]>([])
  const [draftName, setDraftName] = useState('')
  const [draftManager, setDraftManager] = useState('')
  const [search, setSearch] = useState('')

  const BUDGET = 30.0
  const MAX_PLAYERS = 6
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // 1. Get Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('team_name, manager_name')
          .eq('id', user.id)
          .single()
        
        if (profile) {
            setMyTeamName(profile.team_name)
            setMyManagerName(profile.manager_name)
        }

        // 2. Get Roster
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

          // -------------------------------------------------------------
          // NEW: Get Dashboard Stats (Points & Rank)
          // -------------------------------------------------------------
          // TODO: Replace this with real DB fetch once your scores table is ready.
          // For now, we mock it so the UI works.
          setSeasonPoints(1250) 
          setSeasonRank(5)      
        }
      }

      // 3. Get Golfers for Draft
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

  // Helper for "1st", "2nd", "3rd"
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
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
      <div className="min-h-screen pb-12 bg-gray-50">
        {/* HEADER DASHBOARD BANNER */}
        <div className="bg-green-900 text-white shadow-xl border-b-4 border-yellow-500 relative overflow-hidden">
          {/* Background Pattern (Optional) */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="max-w-6xl mx-auto py-8 px-6">
            <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
               
               {/* Left: Team Info */}
               <div className="w-full lg:w-auto">
                 <p className="text-green-300 font-bold uppercase tracking-widest text-xs mb-1">Manager: {myManagerName}</p>
                 <h1 className="text-4xl md:text-5xl font-display uppercase tracking-wider text-white leading-tight">
                    {myTeamName || 'My Team'}
                 </h1>
                 
                 {/* Navigation Link to Season Summary */}
                 <div className="mt-4">
                    <Link href="/season-summary" className="inline-flex items-center text-sm font-semibold text-yellow-400 hover:text-yellow-300 transition">
                        View Full Season History &rarr;
                    </Link>
                 </div>
               </div>

               {/* Right: Stats Grid */}
               <div className="w-full lg:w-auto flex flex-wrap md:flex-nowrap gap-4">
                  
                  {/* Card 1: Total Points */}
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-lg p-4 flex-1 lg:min-w-[140px] text-center">
                    <div className="text-xs text-green-200 uppercase tracking-widest font-semibold">Total Points</div>
                    <div className="text-3xl font-display text-white mt-1">
                      {seasonPoints.toLocaleString()}
                    </div>
                  </div>

                  {/* Card 2: Rank */}
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-lg p-4 flex-1 lg:min-w-[140px] text-center relative">
                     <div className="text-xs text-green-200 uppercase tracking-widest font-semibold">Rank</div>
                     <div className="text-3xl font-display text-yellow-400 mt-1">
                        {seasonRank}<span className="text-base align-top ml-0.5">{getOrdinal(seasonRank)}</span>
                     </div>
                  </div>

                  {/* Card 3: Team Value */}
                  <div className="bg-green-800/50 backdrop-blur-md border border-white/5 rounded-lg p-4 flex-1 lg:min-w-[140px] text-center">
                    <div className="text-xs text-green-200 uppercase tracking-widest font-semibold">Team Value</div>
                    <div className="text-3xl font-display text-white mt-1">
                      ${existingTeam.reduce((acc, p) => acc + p.cost, 0).toFixed(1)}m
                    </div>
                  </div>

               </div>
            </div>
          </div>
        </div>

        {/* ROSTER CARDS */}
        <div className="max-w-6xl mx-auto px-6 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display text-green-800 uppercase tracking-wide">Starting Lineup</h2>
            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
               6 Players Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {existingTeam.map((player) => (
              <div key={player.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center group-hover:bg-green-50 transition">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">World Rank #{player.world_rank}</span>
                  <span className="font-display text-xl text-green-700">${player.cost.toFixed(1)}m</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                     {player.flag && (
                        <img 
                            src={`https://flagcdn.com/24x18/${player.flag.toLowerCase()}.png`}
                            width="20" 
                            height="15" 
                            alt="flag"
                            className="rounded shadow-sm opacity-80"
                        />
                     )}
                     <h3 className="text-xl font-bold text-gray-800">{player.name}</h3>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                     <div className="h-full bg-yellow-400 w-2/3"></div> {/* Mock form bar */}
                  </div>
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
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                        #{player.world_rank}
                      </div>
                      <div>
                        {player.flag ? (
                          <img 
                            src={`https://flagcdn.com/24x18/${player.flag.toLowerCase()}.png`}
                            srcSet={`https://flagcdn.com/48x36/${player.flag.toLowerCase()}.png 2x`}
                            width="24" 
                            height="18" 
                            alt={player.flag}
                            className="mr-3 rounded shadow-sm inline-block"
                          />
                        ) : (
                          <span className="text-xl mr-2">🏳️</span>
                        )}
                        <span className="font-bold text-lg text-gray-800">{player.name}</span>
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