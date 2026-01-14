'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Team Data
  const [existingTeam, setExistingTeam] = useState<Golfer[] | null>(null)
  const [myTeamName, setMyTeamName] = useState('')
  
  // Dashboard Stats State
  const [seasonPoints, setSeasonPoints] = useState(0)
  const [seasonRank, setSeasonRank] = useState(0)
  const [rankTrend, setRankTrend] = useState<'up' | 'down' | 'neutral'>('neutral') 

  // Tournament & Timer States
  const [activeTournament, setActiveTournament] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number} | null>(null)
  const [isLive, setIsLive] = useState(false)

  // Draft Data
  const [golfers, setGolfers] = useState<Golfer[]>([])
  const [draftTeam, setDraftTeam] = useState<Golfer[]>([])
  const [draftName, setDraftName] = useState('')
  const [draftManager, setDraftManager] = useState('')
  const [search, setSearch] = useState('')

  const BUDGET = 30.0
  const MAX_PLAYERS = 6
  const supabase = createClient()
  const router = useRouter()

  // --- LOGIC: TOURNAMENT STATUS & TIMER ---
  const calculateStatus = useCallback((tournament: any) => {
    if (!tournament) return
    const now = new Date().getTime()
    const start = new Date(tournament.start_date).getTime()
    if (now >= start && tournament.status !== 'COMPLETED') {
      setIsLive(true)
      setTimeLeft(null)
    } else {
      setIsLive(false)
    }
  }, [])

  const calculateTimeLeft = useCallback(() => {
    if (!activeTournament || isLive) return null
    const now = new Date().getTime()
    const target = new Date(activeTournament.start_date).getTime()
    const difference = target - now
    if (difference <= 0) return null
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60)
    }
  }, [activeTournament, isLive])

  // --- DATA FETCHING ---
  const fetchData = useCallback(async (currentUser: any) => {
    // 1. Get Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('team_name, manager_name')
        .eq('id', currentUser.id)
        .single()
    
    if (profile) {
        setMyTeamName(profile.team_name)
        setDraftName(profile.team_name || '')
        setDraftManager(profile.manager_name || '')
    }

    // 2. Get Stats
    const { data: standings } = await supabase
        .from('season_leaderboard')
        .select('total_season_points')
        .eq('user_id', currentUser.id)
        .maybeSingle()

    if (standings) setSeasonPoints(standings.total_season_points)

    // 3. Get Roster
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
        .eq('user_id', currentUser.id)
        .maybeSingle()

    if (roster) {
        setExistingTeam([
            roster.player_1, roster.player_2, roster.player_3,
            roster.player_4, roster.player_5, roster.player_6
        ] as any)
    }
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      // 1. General Public Data (Golfers/Tournament) - Fetch even if guest
      const { data: tourneyData } = await supabase
        .from('tournaments')
        .select('*')
        .neq('status', 'COMPLETED')
        .order('start_date', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (tourneyData) {
        setActiveTournament(tourneyData)
        calculateStatus(tourneyData)
      }

      const { data: allGolfers } = await supabase
        .from('golfers')
        .select('*')
        .eq('active', true)
        .order('cost', { ascending: false })

      if (allGolfers) setGolfers(allGolfers)

      // 2. User Specific Data
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
         await fetchData(currentUser)
      }
      
      setLoading(false)
    }

    init()

    // 3. Listen for Auth Changes (e.g. Email Confirmation Redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user)
            await fetchData(session.user)
        }
        if (event === 'SIGNED_OUT') {
            setUser(null)
            setExistingTeam(null)
        }
    })

    return () => subscription.unsubscribe()
  }, [supabase, calculateStatus, fetchData])

  useEffect(() => {
    if (!activeTournament || isLive) return
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 60000)
    setTimeLeft(calculateTimeLeft())
    return () => clearInterval(timer)
  }, [activeTournament, isLive, calculateTimeLeft])

  const isTransferWindowOpen = () => {
    const today = new Date()
    return today >= new Date('2026-03-16T18:00:00') && today <= new Date('2026-04-09T07:00:00')
  }

  // --- ACTIONS ---
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
    if (!user) return router.push('/login')
    if (!draftName.trim() || !draftManager.trim()) return alert('Please enter both Team and Manager names!')

    setIsSubmitting(true)

    try {
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ team_name: draftName, manager_name: draftManager })
            .eq('id', user.id)

        if (profileError) throw profileError

        const payload = {
            user_id: user.id,
            player_1_id: draftTeam[0].id, 
            player_2_id: draftTeam[1].id, 
            player_3_id: draftTeam[2].id,
            player_4_id: draftTeam[3].id, 
            player_5_id: draftTeam[4].id, 
            player_6_id: draftTeam[5].id,
        }

        const { error: rosterError } = await supabase
            .from('season_rosters')
            .upsert(payload)

        if (rosterError) throw rosterError
        window.location.reload()

    } catch (error: any) {
        console.error("Submission Error:", error)
        alert(`Failed to save team: ${error.message || error.details}`)
        setIsSubmitting(false)
    }
  }

  const currentSpend = draftTeam.reduce((sum, p) => sum + p.cost, 0)
  const filteredGolfers = golfers.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-green-800 font-display text-2xl animate-pulse">
      Loading Fairways...
    </div>
  )

  // ==========================================
  // VIEW 1: LANDING PAGE (Guest)
  // ==========================================
  if (!user) {
    return (
        <div className="min-h-screen bg-green-950 flex flex-col items-center justify-center relative overflow-hidden text-center px-4">
             {/* Background Decoration */}
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob animation-delay-2000"></div>
             </div>

             <div className="relative z-10 max-w-2xl">
                <p className="text-yellow-500 font-black uppercase tracking-[0.3em] text-sm mb-4 animate-in slide-in-from-bottom-4 fade-in duration-700">Official 2026 Season</p>
                <h1 className="text-6xl md:text-8xl font-display text-white uppercase tracking-tighter leading-none mb-6 animate-in slide-in-from-bottom-6 fade-in duration-700 delay-100">
                    Fantasy <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Fairways</span>
                </h1>
                <p className="text-green-100 text-lg md:text-xl font-light mb-10 max-w-lg mx-auto leading-relaxed animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200">
                    Draft your dream team of 6 golfers. Manage your salary cap. Compete against friends in the ultimate golf fantasy league.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom-10 fade-in duration-700 delay-300">
                    <Link 
                        href="/login" 
                        className="bg-yellow-500 text-green-950 font-black uppercase tracking-widest px-10 py-4 rounded-full hover:bg-white transition-all transform hover:scale-105 shadow-xl"
                    >
                        Draft My Team
                    </Link>
                    <Link 
                        href="/login" 
                        className="border-2 border-white/20 text-white font-bold uppercase tracking-widest px-10 py-4 rounded-full hover:bg-white/10 transition-all"
                    >
                        Log In
                    </Link>
                </div>

                <div className="mt-16 grid grid-cols-3 gap-8 text-center border-t border-white/10 pt-8">
                    <div>
                        <p className="text-3xl font-display text-white mb-1">${BUDGET}m</p>
                        <p className="text-[10px] text-green-400 uppercase tracking-widest">Salary Cap</p>
                    </div>
                    <div>
                        <p className="text-3xl font-display text-white mb-1">{golfers.length}+</p>
                        <p className="text-[10px] text-green-400 uppercase tracking-widest">Tour Pros</p>
                    </div>
                    <div>
                        <p className="text-3xl font-display text-white mb-1">1</p>
                        <p className="text-[10px] text-green-400 uppercase tracking-widest">Champion</p>
                    </div>
                </div>
             </div>
        </div>
    )
  }

  // ==========================================
  // VIEW 2: DASHBOARD (Logged In + Has Team)
  // ==========================================
  if (existingTeam) {
    return (
      <div className="min-h-screen pb-12 bg-gray-50 font-sans">
        <div className="bg-green-900 text-white shadow-xl border-b-4 border-yellow-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="max-w-6xl mx-auto py-10 px-6">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
               <div className="w-full lg:w-auto text-center lg:text-left">
                 <h1 className="text-4xl md:text-5xl font-display uppercase tracking-wider text-white leading-tight">
                    {myTeamName || 'My Team'}
                 </h1>
                 <div className="mt-4">
                    <Link href="/season-summary" className="inline-flex items-center text-sm font-semibold text-yellow-400 hover:text-yellow-300 transition">
                        View Full Season History &rarr;
                    </Link>
                 </div>
               </div>

               {/* Stats Grid */}
               <div className="w-full lg:w-auto flex flex-wrap md:flex-nowrap gap-4 items-stretch">
                 {/* Tournament Status */}
                 {activeTournament && (
                   <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col justify-center min-w-[240px] text-center flex-1">
                     <p className="text-[10px] font-black uppercase text-green-400 tracking-[0.2em] mb-1">Tournament Status</p>
                     <div className="flex items-center justify-center gap-4 mt-1">
                       <p className="font-display text-base text-white truncate max-w-[120px]">{activeTournament.name}</p>
                       <div className="h-6 w-px bg-white/20"></div>
                       {isLive ? (
                         <div className="flex items-center gap-2">
                           <span className="relative flex h-3 w-3">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                           </span>
                           <span className="text-xl font-display font-bold tracking-tighter text-red-500">LIVE</span>
                         </div>
                       ) : timeLeft ? (
                         <div className="flex gap-2 text-center">
                           <div><span className="text-xl font-bold">{timeLeft.days}</span><span className="text-[8px] uppercase opacity-60 ml-0.5">d</span></div>
                           <div><span className="text-xl font-bold">{timeLeft.hours}</span><span className="text-[8px] uppercase opacity-60 ml-0.5">h</span></div>
                         </div>
                       ) : <span className="text-[10px] uppercase font-black opacity-40">Wait</span>}
                     </div>
                   </div>
                 )}
                 {/* Points & Rank */}
                 <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col justify-center min-w-[140px] text-center flex-1">
                   <div className="text-[10px] text-green-200 uppercase tracking-widest font-black mb-1">Total Points</div>
                   <div className="text-3xl font-display text-white mt-1">{seasonPoints.toLocaleString()}</div>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col justify-center min-w-[140px] text-center flex-1">
                     <div className="text-[10px] text-green-200 uppercase tracking-widest font-black mb-1">Rank</div>
                     <div className="flex items-center justify-center text-3xl font-display text-yellow-400 mt-1 gap-1">
                        {seasonRank > 0 ? seasonRank : <span className="text-xl opacity-40 uppercase font-black tracking-tighter">N/A</span>}
                     </div>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Lineup Section */}
        <div className="max-w-6xl mx-auto px-6 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display text-green-800 uppercase tracking-wide">Starting Lineup</h2>
            <span className="bg-green-100 text-green-800 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">6 Players Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {existingTeam.map((player) => (
              <div key={player.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center group-hover:bg-green-50">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Rank #{player.world_rank}</span>
                  <span className="font-display text-xl text-green-700">${player.cost?.toFixed(1)}m</span>
                </div>
                <div className="p-6 flex items-center gap-3">
                  {player.flag && <img src={`https://flagcdn.com/24x18/${player.flag.toLowerCase()}.png`} width="20" height="15" alt="flag" className="rounded shadow-sm opacity-80" />}
                  <h3 className="text-xl font-bold text-gray-800">{player.name}</h3>
                </div>
              </div>
            ))}
          </div>
          
          <div className={`mt-12 rounded-2xl p-10 text-center border-2 transition-all ${isTransferWindowOpen() ? 'bg-green-50 border-green-200 shadow-xl' : 'bg-white border-gray-100'}`}>
              <p className={isTransferWindowOpen() ? 'text-green-800 font-display text-3xl uppercase tracking-widest' : 'text-gray-300 font-display text-2xl uppercase tracking-widest'}>
                {isTransferWindowOpen() ? 'Transfer Window Open' : 'Transfers Locked'}
              </p>
              {isTransferWindowOpen() && (
                <button className="mt-6 bg-green-700 text-white px-10 py-3 rounded-full font-black uppercase tracking-widest hover:bg-green-800 transition shadow-lg">
                  Manage Transfers
                </button>
              )}
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // VIEW 3: DRAFT BOARD (Logged In + NO Team)
  // ==========================================
  return (
    <div className="min-h-screen pb-12 font-sans bg-gray-50">
      <div className="bg-green-900 text-white py-12 px-6 shadow-lg border-b-4 border-yellow-500 mb-8">
          <div className="max-w-6xl mx-auto text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-display uppercase tracking-wider text-white">Season Draft</h1>
            <p className="text-green-200 mt-2 font-medium">Assemble your squad of 6 golfers within the ${BUDGET}m salary cap.</p>
          </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h2 className="font-display text-2xl text-green-800 mb-4 uppercase tracking-wide">Team Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Team Name" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
              <input type="text" placeholder="Manager Name" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition" value={draftManager} onChange={(e) => setDraftManager(e.target.value)} />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <input type="text" placeholder="🔍 Search Golfers..." className="w-full p-3 border border-gray-200 rounded-xl shadow-inner focus:ring-2 focus:ring-green-500 outline-none transition" onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredGolfers.map((p) => {
                const isSelected = draftTeam.some(dt => dt.id === p.id)
                return (
                  <div key={p.id} className={`flex justify-between items-center p-4 rounded-xl border transition-all ${isSelected ? 'bg-green-50 border-green-200 opacity-60' : 'bg-white border-gray-50 hover:border-green-300'}`}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-black text-gray-400">#{p.world_rank}</div>
                      <div className="flex items-center">
                        {p.flag && <img src={`https://flagcdn.com/24x18/${p.flag.toLowerCase()}.png`} width="24" height="18" alt="flag" className="mr-3 rounded shadow-sm" />}
                        <span className="font-bold text-gray-800">{p.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-display text-xl text-green-700">${p.cost.toFixed(1)}m</span>
                      <button onClick={() => addPlayer(p)} disabled={isSelected} className="h-10 w-10 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 shadow-lg">+</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-2xl shadow-2xl border border-green-50 sticky top-24">
            <h2 className="font-display text-2xl text-gray-800 mb-6 border-b pb-4 uppercase tracking-widest">Your Squad</h2>
            <div className="mb-8">
              <div className="flex justify-between text-[10px] mb-2 font-black uppercase tracking-widest text-gray-400">
                <span>Budget Used</span>
                <span className={(BUDGET - draftTeam.reduce((s, p) => s + p.cost, 0)) < 0 ? 'text-red-500' : 'text-green-600'}>
                  ${(BUDGET - draftTeam.reduce((s, p) => s + p.cost, 0)).toFixed(1)}m Left
                </span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden shadow-inner">
                <div className={`h-full transition-all duration-700 ${(BUDGET - draftTeam.reduce((s, p) => s + p.cost, 0)) < 0 ? 'bg-red-500' : 'bg-green-600'}`} style={{ width: `${Math.min((draftTeam.reduce((s, p) => s + p.cost, 0) / BUDGET) * 100, 100)}%` }}></div>
              </div>
            </div>
            <div className="space-y-3 min-h-[250px]">
              {draftTeam.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 group">
                  <span className="font-bold text-gray-700">{p.name}</span>
                  <button onClick={() => removePlayer(p.id)} className="text-gray-300 hover:text-red-500 transition text-xl">×</button>
                </div>
              ))}
            </div>
            
            <button 
                onClick={submitTeam} 
                disabled={draftTeam.length !== 6 || draftTeam.reduce((s, p) => s + p.cost, 0) > BUDGET || isSubmitting} 
                className="w-full mt-8 bg-green-700 text-white py-5 rounded-xl font-display text-xl uppercase tracking-widest hover:bg-green-800 disabled:opacity-30 transition shadow-xl transform hover:-translate-y-1"
            >
                {isSubmitting ? 'Confirming...' : 'Confirm Team'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}