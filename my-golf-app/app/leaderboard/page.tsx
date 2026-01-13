'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Profile = {
  id: string
  team_name: string
  manager_name: string
  total_season_points: number
}

export default function Leaderboard() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // Fetch data sorted by points (Highest first)
      const { data } = await supabase
        .from('profiles')
        .select('id, team_name, manager_name, total_season_points')
        .order('total_season_points', { ascending: false })
      
      if (data) setProfiles(data)
      setLoading(false)
    }
    fetchLeaderboard()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-green-800 font-display text-2xl animate-pulse">
      Calculating Standings...
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* HEADER */}
      <div className="bg-green-900 text-white py-12 px-6 shadow-xl border-b-4 border-yellow-500 mb-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-display uppercase tracking-wider">League Standings</h1>
          <p className="text-green-200 mt-2 font-medium tracking-widest uppercase text-sm">Official Leaderboard</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 pl-6 font-display text-gray-400 uppercase tracking-widest text-sm w-16">Rank</th>
                  <th className="p-4 font-display text-gray-500 uppercase tracking-widest text-sm">Team</th>
                  <th className="p-4 font-display text-gray-500 uppercase tracking-widest text-sm">Manager</th>
                  <th className="p-4 pr-6 font-display text-gray-500 uppercase tracking-widest text-sm text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((profile, index) => {
                  const isTop3 = index < 3
                  const rankColor = index === 0 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                                    index === 1 ? 'bg-gray-100 text-gray-600 border-gray-200' : 
                                    index === 2 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-white text-gray-500'

                  return (
                    <tr key={profile.id} className="hover:bg-green-50 transition-colors duration-150 group">
                      <td className="p-4 pl-6">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm border ${rankColor}`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-lg text-gray-800 group-hover:text-green-800 transition-colors">
                          {profile.team_name || 'Unnamed Team'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                             👤
                          </div>
                          <span className="text-gray-600 font-medium text-sm">
                            {profile.manager_name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <span className="font-display text-2xl text-green-700">
                          {profile.total_season_points}
                        </span>
                      </td>
                    </tr>
                  )
                })}

                {profiles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-400 italic">
                      No teams have joined the league yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}