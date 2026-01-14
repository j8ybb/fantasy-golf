'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function PublicTeamView() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [myData, setMyData] = useState<any>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchTeamDetails = useCallback(async (userId: string, tourneyId: number, golfers: any[]) => {
    try {
      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, team_name, manager_name')
        .eq('id', userId)
        .maybeSingle()

      if (!profile) return null

      // 2. Fetch Roster
      const { data: rosterData } = await supabase
        .from('season_rosters')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      // 3. Fetch Choices
      const { data: choices } = await supabase
        .from('weekly_choices')
        .select('*')
        .eq('user_id', userId)
        .eq('tournament_id', tourneyId)
        .maybeSingle()

      if (rosterData) {
        const rosterIds = [
          rosterData.player_1_id, rosterData.player_2_id, rosterData.player_3_id,
          rosterData.player_4_id, rosterData.player_5_id, rosterData.player_6_id
        ]
        const rosterDetails = golfers.filter(g => rosterIds.includes(g.id))
        return { profile, roster: rosterDetails, choices }
      }
      return null
    } catch (err) {
      console.error("Fetch failed:", err)
      return null
    }
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      
      const { data: tourney } = await supabase
        .from('tournaments')
        .select('*')
        .neq('status', 'COMPLETED')
        .order('start_date', { ascending: true })
        .limit(1)
        .maybeSingle()

      const { data: golfers } = await supabase.from('golfers').select('*')
      
      if (!tourney || !golfers) {
        setLoading(false)
        return
      }

      // Fetch the team being viewed
      const opponentDetails = await fetchTeamDetails(id as string, tourney.id, golfers)
      
      // Fetch the logged-in user's team for comparison
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const myDetails = await fetchTeamDetails(user.id, tourney.id, golfers)
        setMyData(myDetails)
      }

      setData({ ...opponentDetails, tournament: tourney, golfers })
      setLoading(false)
    }
    init()
  }, [id, supabase, fetchTeamDetails])

  const getEffectiveRoster = (teamData: any) => {
    if (!teamData || !Array.isArray(teamData.roster)) return []
    let activeRoster = [...teamData.roster]
    
    if (teamData.choices?.wildcard_out_id) {
      activeRoster = activeRoster.filter((g: any) => g.id !== teamData.choices.wildcard_out_id)
    }
    if (teamData.choices?.wildcard_in_id) {
      const inPlayer = data?.golfers?.find((g: any) => g.id === teamData.choices.wildcard_in_id)
      if (inPlayer) activeRoster.push(inPlayer)
    }
    return activeRoster
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-green-800 font-display text-2xl animate-pulse">
      Scouting Team...
    </div>
  )

  if (!data || !data.profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="text-6xl mb-4">🚫</div>
      <h1 className="text-3xl font-display text-gray-800 uppercase tracking-widest leading-none">Team Not Found</h1>
      <p className="text-gray-500 mt-4 max-w-sm mx-auto text-sm italic">
        The database couldn't find a roster for ID: <span className="font-mono text-red-400 break-all">{id}</span>. 
        This usually means the manager hasn't finished drafting.
      </p>
      <Link href="/leaderboard" className="mt-8 bg-green-900 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-green-800 transition shadow-lg">
        Back to Standings
      </Link>
    </div>
  )

  const oppRoster = getEffectiveRoster(data)
  const myRoster = getEffectiveRoster(myData)

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <div className="bg-green-950 text-white py-12 px-6 border-b-4 border-yellow-500 shadow-xl relative">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="text-center md:text-left">
            <p className="text-yellow-500 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Scouting Report</p>
            <h1 className="text-4xl md:text-5xl font-display uppercase tracking-widest leading-none">{data.profile.team_name}</h1>
            <p className="text-green-400 text-sm font-bold mt-3 uppercase tracking-widest">Manager: {data.profile.manager_name}</p>
          </div>
          
          {myData && myData.profile.id !== data.profile.id && (
            <button 
              onClick={() => setIsComparing(!isComparing)}
              className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg border-2 ${
                isComparing ? 'bg-yellow-500 border-yellow-400 text-green-950' : 'bg-transparent border-white/20 text-white hover:bg-white/10'
              }`}
            >
              {isComparing ? 'Exit Comparison' : '📊 Compare Teams'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Upcoming Event</p>
            <p className="font-display text-2xl text-green-900">{data.tournament.name}</p>
        </div>

        {!isComparing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {oppRoster.map((player: any) => {
               const isCaptain = player.id === data.choices?.captain_id
               const isWildcard = player.id === data.choices?.wildcard_in_id
               return (
                 <div key={player.id} className={`p-6 rounded-2xl border-4 bg-white shadow-sm flex flex-col transition-all relative ${isCaptain ? 'border-yellow-400' : isWildcard ? 'border-blue-400' : 'border-white'}`}>
                    {isCaptain && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-green-950 text-[10px] font-black px-4 py-1 rounded-full shadow-md uppercase tracking-widest">
                        Captain
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-4">
                      {player.flag && <img src={`https://flagcdn.com/w40/${player.flag.toLowerCase()}.png`} alt="" className="h-6 w-auto rounded shadow-sm" />}
                      <span className="font-display text-green-700 text-xl font-light">${player.cost?.toFixed(1)}m</span>
                    </div>
                    <h3 className="font-bold text-xl text-gray-800">{player.name}</h3>
                    <div className="mt-4 flex gap-2">
                       {isCaptain && <span className="text-yellow-600 text-[10px] font-black uppercase">👑 2x Pts</span>}
                       {isWildcard && <span className="text-blue-600 text-[10px] font-black uppercase">🃏 Wildcard</span>}
                    </div>
                 </div>
               )
             })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
            <div className="space-y-4">
              <h2 className="font-display text-xl uppercase tracking-widest text-gray-400 text-center">{data.profile.team_name}</h2>
              {oppRoster.map((player: any) => {
                const isCommon = myRoster.some(p => p.id === player.id)
                const isCaptain = player.id === data.choices?.captain_id
                return (
                  <div key={player.id} className={`p-5 rounded-xl border-2 flex justify-between items-center ${isCaptain ? 'border-yellow-400 bg-yellow-50/30' : isCommon ? 'bg-green-50 border-green-200' : 'bg-white border-white shadow-sm'}`}>
                    <span className="font-bold text-gray-800">{player.name}</span>
                    {isCaptain && <span className="text-[10px] font-black text-yellow-600 uppercase border border-yellow-200 px-2 py-0.5 rounded">Captain</span>}
                  </div>
                )
              })}
            </div>
            <div className="space-y-4">
              <h2 className="font-display text-xl uppercase tracking-widest text-green-800 text-center">My Team</h2>
              {myRoster.map((player: any) => {
                const isCommon = oppRoster.some(p => p.id === player.id)
                const isCaptain = player.id === myData?.choices?.captain_id
                return (
                  <div key={player.id} className={`p-5 rounded-xl border-2 flex justify-between items-center ${isCaptain ? 'border-yellow-400 bg-yellow-50/30' : isCommon ? 'bg-green-50 border-green-200' : 'bg-white border-white shadow-sm'}`}>
                    <span className="font-bold text-gray-800">{player.name}</span>
                    {isCaptain && <span className="text-[10px] font-black text-yellow-600 uppercase border border-yellow-200 px-2 py-0.5 rounded">Captain</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}