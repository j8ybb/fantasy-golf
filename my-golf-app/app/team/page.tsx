'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function MyTeam() {
  const [roster, setRoster] = useState<any[]>([])
  const [allGolfers, setAllGolfers] = useState<any[]>([])
  const [captainId, setCaptainId] = useState<number | null>(null)
  
  // Wildcard State
  const [wildcardActive, setWildcardActive] = useState(false)
  const [playerOut, setPlayerOut] = useState<number | null>(null)
  const [playerIn, setPlayerIn] = useState<number | null>(null)
  
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // Change this manually each week, or we can build an admin tool later
  const CURRENT_WEEK = 1 

  useEffect(() => {
    const fetchData = async () => {
      // 1. Get Current User
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      // 2. Fetch Season Roster
      const { data: teamData } = await supabase
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

      if (teamData) {
        const myPlayers = [
          teamData.player_1, teamData.player_2, teamData.player_3,
          teamData.player_4, teamData.player_5, teamData.player_6
        ]
        setRoster(myPlayers)
      }

      // 3. Fetch All Golfers (for Wildcard options)
      const { data: golfers } = await supabase.from('golfers').select('*').order('cost', { ascending: false })
      if (golfers) setAllGolfers(golfers)

      // 4. Fetch Existing Choices for this Week
      const { data: choices } = await supabase
        .from('weekly_choices')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_number', CURRENT_WEEK)
        .single()

      if (choices) {
        setCaptainId(choices.captain_id)
        if (choices.wildcard_in_id) {
          setWildcardActive(true)
          setPlayerOut(choices.wildcard_out_id)
          setPlayerIn(choices.wildcard_in_id)
        }
      }
    }
    fetchData()
  }, [])

  const saveChoices = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      week_number: CURRENT_WEEK,
      captain_id: captainId,
      wildcard_out_id: wildcardActive ? playerOut : null,
      wildcard_in_id: wildcardActive ? playerIn : null
    }

    // Upsert = Insert or Update if exists
    const { error } = await supabase.from('weekly_choices').upsert(payload, { onConflict: 'user_id, week_number' })

    setSaving(false)
    if (!error) alert('✅ Tactics Saved!')
    else alert('❌ Error saving tactics')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-green-900 text-white py-8 px-6 border-b-4 border-yellow-500">
        <h1 className="text-3xl font-display uppercase">Week {CURRENT_WEEK} Tactics</h1>
        <p className="text-green-200">Select your Captain and play your Wildcard.</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8 space-y-8">
        
        {/* SECTION 1: CAPTAIN SELECTION */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-2">👑</span> Select Captain (2x Points)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roster.map(player => (
              <button
                key={player.id}
                onClick={() => setCaptainId(player.id)}
                className={`flex items-center p-3 rounded-lg border-2 transition-all ${
                  captainId === player.id 
                    ? 'border-yellow-500 bg-yellow-50 shadow-md ring-1 ring-yellow-500' 
                    : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                {player.flag ? (
                  <img src={`https://flagcdn.com/24x18/${player.flag.toLowerCase()}.png`} className="w-6 h-4 mr-3 rounded" />
                ) : <span className="mr-3">⛳</span>}
                <span className={`font-bold ${captainId === player.id ? 'text-yellow-800' : 'text-gray-700'}`}>
                  {player.name}
                </span>
                {captainId === player.id && <span className="ml-auto text-yellow-600 font-bold">2x</span>}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 2: WILDCARD */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="text-2xl mr-2">🃏</span> One-Week Wildcard
            </h2>
            <button 
              onClick={() => setWildcardActive(!wildcardActive)}
              className={`px-4 py-1 rounded-full text-sm font-bold transition-colors ${
                wildcardActive ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {wildcardActive ? 'ACTIVE' : 'INACTIVE'}
            </button>
          </div>

          {wildcardActive && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bench This Player (Out)</label>
                <select 
                  className="w-full p-2 border rounded text-gray-800"
                  value={playerOut || ''}
                  onChange={(e) => setPlayerOut(Number(e.target.value))}
                >
                  <option value="">Select player to remove...</option>
                  {roster.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="flex justify-center text-gray-400">⬇️ SWAP FOR ⬇️</div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Play This Player (In)</label>
                <select 
                  className="w-full p-2 border rounded text-gray-800"
                  value={playerIn || ''}
                  onChange={(e) => setPlayerIn(Number(e.target.value))}
                >
                  <option value="">Select player to add...</option>
                  {allGolfers
                    .filter(g => !roster.find(r => r.id === g.id)) // Hide players you already have
                    .map(g => (
                    <option key={g.id} value={g.id}>{g.name} (${g.cost}m)</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* SAVE BUTTON */}
        <button
          onClick={saveChoices}
          disabled={saving}
          className="w-full bg-green-800 hover:bg-green-700 text-white font-display text-xl py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02]"
        >
          {saving ? 'Saving...' : '💾 Save Tactics'}
        </button>

      </div>
    </div>
  )
}