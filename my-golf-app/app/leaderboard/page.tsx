'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

type Profile = {
  id: string
  team_name: string
  manager_name: string
  total_season_points: number
  rank_trend?: 'up' | 'down' | 'neutral'
}

export default function Leaderboard() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // 1. Get current user to highlight "You"
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      // 2. Fetch from the VIEW 'season_leaderboard' instead of the 'profiles' table
      const { data, error } = await supabase
        .from('season_leaderboard')
        .select('*')
        .order('total_season_points', { ascending: false })
      
      if (error) {
        console.error("Leaderboard Error:", error.message)
      }

      if (data) {
        // Mocking trends for the UI (this can be mapped to real DB columns later)
        const dataWithTrends = data.map((p, i) => ({
          ...p,
          id: (p as any).user_id, // Mapping view user_id to id for the key
          rank_trend: i % 3 === 0 ? 'up' : i % 3 === 1 ? 'down' : 'neutral'
        }))
        setProfiles(dataWithTrends as Profile[])
      }
      setLoading(false)
    }
    fetchLeaderboard()
  }, [supabase])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-green-800 font-display text-2xl animate-pulse">
      Calculating Standings...
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* HEADER */}
      <div className="bg-green-900 text-white py-12 px-6 shadow-xl border-b-4 border-yellow-500 mb-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-display uppercase tracking-wider">League Standings</h1>
          <p className="text-green-200 mt-2 font-black tracking-[0.2em] uppercase text-xs">Official 2026 Leaderboard</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-6 font-display text-gray-400 uppercase tracking-widest text-[10px] w-24 text-center">Rank</th>
                  <th className="p-6 font-display text-gray-400 uppercase tracking-widest text-[10px]">Team & Manager</th>
                  <th className="p-6 font-display text-gray-400 uppercase tracking-widest text-[10px] text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {profiles.map((profile, index) => {
                  const isMe = profile.id === currentUserId
                  const rank = index + 1
                  
                  return (
                    <tr 
                      key={profile.id} 
                      className={`transition-colors duration-150 group ${isMe ? 'bg-yellow-50/50' : 'hover:bg-green-50/30'}`}
                    >
                      {/* RANK COLUMN */}
                      <td className="p-6 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <span className={`text-3xl font-display font-bold ${rank <= 3 ? 'text-yellow-600' : 'text-gray-400'}`}>
                            {rank}
                          </span>
                          
                          {/* TREND ARROW */}
                          <div className="flex items-center">
                             {profile.rank_trend === 'up' && <span className="text-green-500 text-sm animate-pulse">▲</span>}
                             {profile.rank_trend === 'down' && <span className="text-red-500 text-sm opacity-50">▼</span>}
                             {profile.rank_trend === 'neutral' && <span className="text-gray-300 text-[10px]">●</span>}
                          </div>
                        </div>
                      </td>

                      {/* TEAM COLUMN */}
                      <td className="p-6">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Link 
                              href={`/team/${profile.id}`} 
                              className={`font-bold text-lg hover:underline decoration-yellow-500 underline-offset-4 ${isMe ? 'text-green-900' : 'text-gray-800'}`}
                            >
                              {profile.team_name || 'Unnamed Team'}
                            </Link>
                            {isMe && (
                              <span className="bg-green-700 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase shadow-sm">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            {profile.manager_name || 'Unknown Manager'}
                          </span>
                        </div>
                      </td>

                      {/* POINTS COLUMN */}
                      <td className="p-6 text-right">
                        <span className={`font-display text-3xl font-bold ${isMe ? 'text-green-700' : 'text-green-900'}`}>
                          {profile.total_season_points.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  )
                })}

                {profiles.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-gray-400 font-medium italic">
                      No teams have joined the league yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BACK TO DASHBOARD LINK */}
        <div className="mt-10 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-green-700 font-bold hover:text-green-900 transition-all group uppercase tracking-widest text-xs"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Back to My Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}