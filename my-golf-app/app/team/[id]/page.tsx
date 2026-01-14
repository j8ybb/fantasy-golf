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
    const { data: profile } = await supabase
      .from('profiles')
      .select('team_name, manager_name')
      .eq('id', userId)
      .single()

    const { data: rosterData } = await supabase
      .from('season_rosters')
      .select('*')
      .eq('user_id', userId)
      .single()

    const { data: choices } = await supabase
      .from('weekly_choices')
      .select('*')
      .eq('user_id', userId)
      .eq('tournament_id', tourneyId)
      .maybeSingle()

    if (profile && rosterData) {
      const rosterIds = [
        rosterData.player_1_id, rosterData.player_2_id, rosterData.player_3_id,
        rosterData.player_4_id, rosterData.player_5_id, rosterData.player_6_id
      ]
      const rosterDetails = golfers.filter(g => rosterIds.includes(g.id))
      return { profile, roster: rosterDetails, choices }
    }
    return null
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: tourney } = await supabase
        .from('tournaments')
        .select('*')
        .neq('status', 'COMPLETED')
        .order('start_date', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (!tourney) {
        setLoading(false)
        return
      }

      const { data: golfers } = await supabase.from('golfers').select('*')
      if (!golfers) {
        setLoading(false)
        return
      }

      const opponentDetails = await fetchTeamDetails(id as string, tourney.id, golfers)
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
      activeRoster = activeRoster.filter(g => g.id !== teamData.choices.wildcard_out_id)
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
      <h1 className="text-3xl font-display text-gray-800 uppercase tracking-widest">Team Not Found</h1>
      <Link href="/leaderboard" className="mt-8 text-green-700 font-bold underline text-xs">Back to Standings</Link>
    </div>
  )

  const oppRoster = getEffectiveRoster(data)
  const myRoster = getEffectiveRoster(myData)

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* HEADER */}
      <div className="bg-green-950 text-white py-12 px-6 border-b-4 border-yellow-500 shadow-xl relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="text-center md:text-left">
            <p className="text-yellow-500 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Scouting Report</p>
            <h1 className="text-4xl md:text-5xl font-display uppercase tracking-widest leading-none">{data.profile.team_name}</h1>
            <p className="text-green-400 text-sm font-bold mt-3 uppercase tracking-widest">Manager: {data.profile.manager_name}</p>
          </div>
          
          {myData && (
            <button 
              onClick={() => setIsComparing(!isComparing)}
              className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg border-2 ${
                isComparing ? 'bg-yellow-500 border-yellow-400 text-green-950' : 'bg-transparent border-white/20 text-white hover:bg-white/10'
              }`}
            >
              {isComparing ? 'Exit Comparison' : '📊 Compare vs My Team'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* TOURNAMENT BOX */}
        <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Upcoming Event</p>
            <p className="font-display text-2xl text-green-900">{data.tournament.name}</p>
        </div>

        {!isComparing ? (
          /* STANDARD VIEW: Captain stands out with Gold Border */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {oppRoster.map((player: any) => {
               const isCaptain = player.id === data.choices?.captain_id
               const isWildcard = player.id === data.choices?.wildcard_in_id
               return (
                 <div key={player.id} className={`p-6 rounded-2xl border-4 bg-white shadow-sm flex flex-col transition-all hover:shadow-md relative ${isCaptain ? 'border-yellow-400 shadow-yellow-100' : isWildcard ? 'border-blue-400' : 'border-white'}`}>
                    
                    {/* CAPTAIN TAG */}
                    {isCaptain && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-green-950 text-[10px] font-black px-4 py-1 rounded-full shadow-md uppercase tracking-widest">
                        Captain
                      </div>
                    )}

                    <div className="flex justify-between items-center mb-4">
                      {player.flag ? (
                        <img 
                          src={`https://flagcdn.com/w40/${player.flag.toLowerCase()}.png`} 
                          alt={player.flag} 
                          className="h-6 w-auto rounded shadow-sm border border-gray-100"
                        />
                      ) : (
                        <span className="text-2xl">⛳</span>
                      )}
                      <span className="font-display text-green-700 text-xl font-light">${player.cost?.toFixed(1)}m</span>
                    </div>
                    <h3 className="font-bold text-xl text-gray-800">{player.name}</h3>
                    
                    <div className="mt-4 flex gap-2">
                       {isCaptain && <span className="text-yellow-600 text-xs font-black uppercase">👑 2x Points</span>}
                       {isWildcard && <span className="text-blue-600 text-xs font-black uppercase">🃏 Wildcard</span>}
                    </div>
                 </div>
               )
             })}
          </div>
        ) : (
          /* COMPARISON VIEW: Captain clearly marked */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* OPPONENT */}
            <div className="space-y-4">
              <h2 className="font-display text-xl uppercase tracking-widest text-gray-400 text-center mb-4">{data.profile.team_name}</h2>
              {oppRoster.map((player: any) => {
                const isCommon = myRoster.some(p => p.id === player.id)
                const isCaptain = player.id === data.choices?.captain_id
                return (
                  <div key={player.id} className={`p-5 rounded-xl border-2 flex justify-between items-center ${isCaptain ? 'border-yellow-400 bg-yellow-50/30' : isCommon ? 'bg-green-50 border-green-200' : 'bg-white border-white shadow-sm'}`}>
                    <div className="flex items-center gap-4">
                      {player.flag && <img src={`https://flagcdn.com/w20/${player.flag.toLowerCase()}.png`} className="h-3 shadow-sm rounded-sm" />}
                      <span className="font-bold text-gray-800">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       {isCaptain && <span className="text-[9px] font-black text-yellow-600 uppercase border border-yellow-200 px-2 py-0.5 rounded">Captain</span>}
                       {isCommon && <span className="text-[8px] font-black text-green-600 uppercase bg-green-200/50 px-2 py-1 rounded-full">Common</span>}
                    </div>
                  </div>
                )
              })}
            </div>
            {/* MY TEAM */}
            <div className="space-y-4">
              <h2 className="font-display text-xl uppercase tracking-widest text-green-800 text-center mb-4">My Team</h2>
              {myRoster.map((player: any) => {
                const isCommon = oppRoster.some(p => p.id === player.id)
                const isCaptain = player.id === myData?.choices?.captain_id
                return (
                  <div key={player.id} className={`p-5 rounded-xl border-2 flex justify-between items-center ${isCaptain ? 'border-yellow-400 bg-yellow-50/30' : isCommon ? 'bg-green-50 border-green-200' : 'bg-white border-white shadow-sm'}`}>
                    <div className="flex items-center gap-4">
                      {player.flag && <img src={`https://flagcdn.com/w20/${player.flag.toLowerCase()}.png`} className="h-3 shadow-sm rounded-sm" />}
                      <span className="font-bold text-gray-800">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       {isCaptain && <span className="text-[9px] font-black text-yellow-600 uppercase border border-yellow-200 px-2 py-0.5 rounded">Captain</span>}
                       {isCommon && <span className="text-[8px] font-black text-green-600 uppercase bg-green-200/50 px-2 py-1 rounded-full">Common</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="text-center pt-12">
          <Link href="/leaderboard" className="text-gray-400 hover:text-green-800 font-black text-[10px] uppercase tracking-[0.4em] transition-all">
            ← Back to League Standings
          </Link>
        </div>
      </div>
    </div>
  )
}