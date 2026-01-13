'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

// --- TYPES ---
type Golfer = {
  id: number
  name: string
  cost: number
  world_rank: number
}

// --- MAIN COMPONENT ---
export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // View Mode (If team exists)
  const [existingTeam, setExistingTeam] = useState<Golfer[] | null>(null)
  const [myTeamName, setMyTeamName] = useState('')
  const [myManagerName, setMyManagerName] = useState('') // <--- NEW

  // Draft Mode
  const [golfers, setGolfers] = useState<Golfer[]>([])
  const [draftTeam, setDraftTeam] = useState<Golfer[]>([])
  const [draftName, setDraftName] = useState('')
  const [draftManager, setDraftManager] = useState('') // <--- NEW
  const [search, setSearch] = useState('')

  const BUDGET = 25.0
  const MAX_PLAYERS = 6

  const supabase = createClient()

  // 1. INITIAL LOAD
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // A. Get Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('team_name, manager_name') // <--- NEW
          .eq('id', user.id)
          .single()
        
        if (profile) {
            setMyTeamName(profile.team_name)
            setMyManagerName(profile.manager_name)
        }

        // B. Get Roster
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
        }
      }

      // C. Get All Golfers
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
    if (!user) return (window.location.href = '/login')
    if (!draftName.trim()) return alert('Please enter a Team Name!')
    if (!draftManager.trim()) return alert('Please enter your Manager Name!') // <--- NEW CHECK

    // 1. Save Profile Info
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
          team_name: draftName,
          manager_name: draftManager // <--- NEW SAVE
      })
      .eq('id', user.id)

    if (profileError) return alert('Error saving name: ' + profileError.message)

    // 2. Save Roster
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

  // --- CALCULATIONS ---
  const currentSpend = draftTeam.reduce((sum, p) => sum + p.cost, 0)
  const remainingBudget = (BUDGET - currentSpend).toFixed(1)
  const filteredGolfers = golfers.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="p-10 text-center">Loading...</div>

  // --- VIEW 1: ALREADY HAS TEAM ---
  if (existingTeam) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 font-sans">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
               <h1 className="text-3xl font-bold text-green-800">{myTeamName || 'My Team'}</h1>
               <p className="text-gray-500 font-medium">Manager: {myManagerName || 'Unknown'}</p> {/* <--- NEW DISPLAY */}
            </div>
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold">
               {existingTeam.reduce((acc, p) => acc + p.cost, 0).toFixed(1)}m Spent
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {existingTeam.map((player) => (
              <div key={player.id} className="flex items-center p-4 bg-green-50 border border-green-100 rounded-lg">
                <div className="h-10 w-10 bg-green-200 rounded-full flex items-center justify-center font-bold text-green-800 mr-4">
                  {player.world_rank}
                </div>
                <div>
                  <div className="font-bold text-lg">{player.name}</div>
                  <div className="text-sm text-gray-500">${player.cost.toFixed(1)}m</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-400">
             Transfers open March 16th
          </div>
        </div>
      </div>
    )
  }

  // --- VIEW 2: DRAFT BOARD ---
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT: Player List */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-green-800">Draft Your Team</h1>
            {!user && <a href="/login" className="text-blue-600 underline">Login first</a>}
          </div>

          {/* NEW: Input Fields */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Team Name</label>
                <input 
                type="text" 
                placeholder="e.g. The Tiger Kings" 
                className="w-full p-2 border rounded font-semibold"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Manager Name</label>
                <input 
                type="text" 
                placeholder="e.g. John Doe" 
                className="w-full p-2 border rounded font-semibold"
                value={draftManager}
                onChange={(e) => setDraftManager(e.target.value)}
                />
            </div>
          </div>

          <input 
            type="text" 
            placeholder="Search player..." 
            className="w-full p-3 border rounded-lg shadow-sm"
            onChange={(e) => setSearch(e.target.value)}
          />
          
          <div className="bg-white rounded-xl shadow overflow-hidden border h-[500px] overflow-y-auto">
            {filteredGolfers.map((player) => {
              const isSelected = draftTeam.some(p => p.id === player.id)
              return (
                <div key={player.id} className={`flex justify-between p-3 border-b hover:bg-green-50 ${isSelected ? 'bg-green-100 opacity-60' : ''}`}>
                  <div>
                    <span className="text-gray-400 text-sm mr-2">#{player.world_rank}</span>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">${player.cost.toFixed(1)}m</span>
                    <button 
                      onClick={() => addPlayer(player)}
                      disabled={isSelected}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:bg-gray-400"
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT: Your Selections */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-green-100 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Your Squad ({draftTeam.length}/6)</h2>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1 font-semibold">
                <span>Budget: ${currentSpend.toFixed(1)}m</span>
                <span className={Number(remainingBudget) < 0 ? 'text-red-500' : 'text-green-600'}>Left: ${remainingBudget}m</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full">
                 <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(currentSpend / BUDGET) * 100}%` }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              {draftTeam.map((p) => (
                <div key={p.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded border">
                  <span>{p.name}</span>
                  <button onClick={() => removePlayer(p.id)} className="text-red-500">x</button>
                </div>
              ))}
            </div>

            <button 
              onClick={submitTeam}
              disabled={draftTeam.length !== 6 || currentSpend > BUDGET}
              className="w-full mt-6 bg-black text-white py-3 rounded-lg font-bold disabled:opacity-50 hover:bg-gray-800 transition"
            >
              {user ? 'Submit Team' : 'Login Required'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}