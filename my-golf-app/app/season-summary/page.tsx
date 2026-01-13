'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

type TournamentSummary = {
  id: number
  name: string
  start_date: string
  is_major: boolean
  is_signature: boolean
  prize_pot: number | null
  logo_url: string | null
  status: string
  points: number | null
}

export default function SeasonSummaryPage() {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  useEffect(() => {
    const fetchSeasonData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: tourneyData } = await supabase
        .from('tournaments')
        .select('*')
        .order('start_date', { ascending: true })

      if (tourneyData) {
        let userScores: any[] = []
        if (user) {
          const { data: scores } = await supabase
            .from('user_scores') 
            .select('*')
            .eq('user_id', user.id)
          userScores = scores || []
        }

        const formatted = tourneyData.map((t: any) => {
          const scoreEntry = userScores.find(s => s.tournament_id === t.id)
          return {
            ...t,
            points: scoreEntry ? scoreEntry.points : (t.status === 'COMPLETED' ? 0 : null)
          }
        })

        setTournaments(formatted)
      }
      setLoading(false)
    }

    fetchSeasonData()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-green-800 font-display text-2xl animate-pulse">
      Loading Season Data...
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans">
      <div className="bg-green-900 text-white py-12 px-6 shadow-xl border-b-4 border-yellow-500">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-display uppercase tracking-wider">2026 Season Schedule</h1>
          <p className="text-green-200 mt-2 uppercase tracking-widest text-sm font-bold">Official Tournament Calendar</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-display uppercase tracking-widest text-gray-500 text-[10px]">Logo</th>
                <th className="p-4 font-display uppercase tracking-widest text-gray-500 text-[10px]">Tournament</th>
                <th className="p-4 font-display uppercase tracking-widest text-gray-500 text-[10px]">Date</th>
                <th className="p-4 font-display uppercase tracking-widest text-gray-500 text-[10px]">Purse</th>
                <th className="p-4 font-display uppercase tracking-widest text-gray-500 text-[10px] text-right">My Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tournaments.map((t) => (
                <tr key={t.id} className="hover:bg-green-50/40 transition-colors group">
                  {/* Tournament Logo Column */}
                  <td className="p-4 w-16">
                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center p-1 shadow-sm overflow-hidden">
                      {t.logo_url ? (
                        <img 
                          src={t.logo_url} 
                          alt="" 
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                        />
                      ) : (
                        <span className="text-lg opacity-20">⛳</span>
                      )}
                    </div>
                  </td>

                  {/* Name & Special Badges Column */}
                  <td className="p-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 text-lg group-hover:text-green-800 transition">{t.name}</span>
                        {t.is_major && (
                          <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase shadow-sm">Major</span>
                        )}
                        {t.is_signature && (
                          <span className="bg-yellow-400 text-green-900 text-[9px] font-black px-1.5 py-0.5 rounded uppercase shadow-sm">Signature</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.status}</span>
                    </div>
                  </td>

                  {/* Start Date Column */}
                  <td className="p-4 text-sm text-gray-600 font-semibold italic">
                    {new Date(t.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>

                  {/* Prize Pot Column */}
                  <td className="p-4 font-mono text-sm text-gray-700 font-bold">
                    {t.prize_pot ? formatCurrency(t.prize_pot) : 'TBD'}
                  </td>

                  {/* Points Earned Column */}
                  <td className="p-4 text-right">
                    {t.points !== null ? (
                      <span className="font-display text-2xl text-green-700 font-bold">{t.points}</span>
                    ) : (
                      <span className="text-gray-200">---</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-green-700 font-bold hover:text-green-900 transition-colors group">
            <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> 
            Back to My Team Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}