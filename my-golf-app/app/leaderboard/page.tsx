'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function Leaderboard() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const supabase = createClient()
      
      // Fetch profiles sorted by points (High to Low)
      const { data } = await supabase
        .from('profiles')
        .select('team_name, total_season_points')
        .order('total_season_points', { ascending: false })
        .limit(50)

      if (data) setUsers(data)
      setLoading(false)
    }
    fetchLeaderboard()
  }, [])

  if (loading) return <div className="p-10 text-center">Loading Standings...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-green-800 mb-8">Season Standings</h1>

        <div className="bg-white rounded-xl shadow border overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 bg-gray-100 p-4 font-bold text-sm text-gray-600 border-b">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-8">Team</div>
            <div className="col-span-2 text-right">Points</div>
          </div>

          {/* Rows */}
          {users.map((user, index) => (
            <div key={index} className="grid grid-cols-12 p-4 border-b items-center hover:bg-gray-50">
              <div className="col-span-2 text-center font-bold text-gray-400">
                {index + 1}
              </div>
              <div className="col-span-8 font-semibold text-lg">
                {user.team_name || 'Unnamed Team'}
              </div>
              <div className="col-span-2 text-right font-bold text-green-700 text-xl">
                {user.total_season_points}
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No teams found yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}