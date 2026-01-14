'use client'

import Link from 'next/link'

export default function RulesPage() {
  const finishingPoints = [
    { pos: '1st Place', pts: 100 },
    { pos: '2nd Place', pts: 75 },
    { pos: '3rd Place', pts: 55 },
    { pos: '4th Place', pts: 40 },
    { pos: '5th Place', pts: 30 },
    { pos: '6th Place', pts: 25 },
    { pos: '7th Place', pts: 20 },
    { pos: '8th Place', pts: 16 },
    { pos: '9th Place', pts: 14 },
    { pos: '10th Place', pts: 12 },
    { pos: '11th Place', pts: 10 },
    { pos: '12th Place', pts: 9 },
    { pos: '13th Place', pts: 8 },
    { pos: '14th Place', pts: 7 },
    { pos: '15th Place', pts: 6 },
    { pos: '16th Place', pts: 5 },
    { pos: '17th Place', pts: 4 },
    { pos: '18th Place', pts: 3 },
    { pos: '19th Place', pts: 2 },
    { pos: '20th Place', pts: 1 },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-800">
      {/* Header */}
      <div className="bg-green-900 text-white py-16 px-6 border-b-4 border-yellow-500 shadow-xl text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-display uppercase tracking-widest leading-tight">
            Rules & Scoring
          </h1>
          <p className="text-green-300 mt-4 font-bold uppercase tracking-[0.3em] text-sm italic">
            Official 2026 Season Guidelines
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-10 space-y-10">
        
        {/* SECTION 1: THE SQUAD */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl bg-green-100 p-3 rounded-xl">⛳</span>
            <h2 className="text-2xl font-display text-green-900 uppercase">Your Squad</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Every manager must draft a team of <strong>6 golfers</strong> while staying within the 
            <strong> $30.0m salary cap</strong>. Your team is fixed until the transfer window, 
            but there are weekly actions you can take to gain an advantage using the mechanics below.
          </p>
        </div>

        {/* SECTION 2: TRANSFER WINDOW */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl bg-green-100 p-3 rounded-xl">🤝</span>
                <h2 className="text-2xl font-display text-green-900 uppercase">Transfer Window</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                During the Transfer Window between <strong>The Players and The Masters</strong>, 
                you may permanently swap <strong>three players</strong> on your team. 
                Your new team total must still remain within the <strong>$30.0m salary cap</strong>.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-center min-w-[240px] shadow-inner">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Active Window Dates</p>
              <p className="font-display text-lg text-green-900">16 Mar — 09 Apr 2026</p>
            </div>
          </div>
        </div>

        {/* SECTION 3 & 4: STRATEGY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-yellow-500">
            <h3 className="text-xl font-display text-gray-800 uppercase mb-4 flex items-center gap-2">
              👑 The Captain
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Every tournament, you designate one golfer as your Captain. This player earns 
              <strong> 2x Points</strong> for that week. Choose wisely based on recent form!
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-blue-500">
            <h3 className="text-xl font-display text-gray-800 uppercase mb-4 flex items-center gap-2">
              🃏 The Wildcard
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              You have <strong>one swap per week</strong>. This allows you to bench one of your team and play an alternate golfer for that week only.
            </p>
          </div>
        </div>

        {/* SECTION 5: SCORING TABLE */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-8 py-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-display text-green-900 uppercase tracking-widest">Finishing Points</h2>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Weekly Payout</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="p-6 font-display text-gray-400 uppercase tracking-widest text-xs">Position</th>
                  <th className="p-6 font-display text-gray-400 uppercase tracking-widest text-xs text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {finishingPoints.map((row, idx) => (
                  <tr key={idx} className="hover:bg-green-50/50 transition-colors group">
                    <td className="p-6 font-bold text-gray-700">{row.pos}</td>
                    <td className="p-6 text-right">
                      <span className="font-display text-3xl text-green-700 font-light group-hover:scale-110 transition-transform inline-block">
                        {row.pts}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50/50 italic">
                  <td className="p-6 text-gray-400 text-sm">Positions 21st and below</td>
                  <td className="p-6 text-right text-gray-400 font-display text-2xl font-light">0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <Link href="/" className="bg-green-900 text-white px-12 py-4 rounded-full font-display text-xl uppercase tracking-widest hover:bg-green-800 transition shadow-xl inline-block hover:-translate-y-1">
            Return to Dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}