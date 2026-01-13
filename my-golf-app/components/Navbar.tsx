'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // 1. Check active session immediately
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }
    checkUser()

    // 2. Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
       setUser(session?.user ?? null)
       if (event === 'SIGNED_OUT') {
         router.refresh()
       }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <nav className="bg-green-900 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* LOGO */}
        <Link href="/" className="text-2xl font-display font-bold tracking-wider hover:text-yellow-400 transition">
          FANTASY FAIRWAYS
        </Link>
        
        <div className="flex items-center gap-6 font-semibold text-sm">
          <Link href="/" className="hover:text-green-200 transition">MY TEAM</Link>
          <Link href="/season-summary" className="hover:text-green-200 transition">SEASON</Link>
          <Link href="/leaderboard" className="hover:text-green-200 transition">LEADERBOARD</Link>
          
          {/* IF YOU WANT TO FORCE THE LOGOUT BUTTON TO SHOW FOR TESTING:
              Change the line below from "{user ? (" to "{true ? (" 
          */}
          {true ? (
            <button 
              onClick={handleLogout} 
              className="bg-green-800 border border-green-600 px-3 py-1 rounded hover:bg-green-700 transition text-xs tracking-widest"
            >
              LOGOUT
            </button>
          ) : (
            <Link href="/login" className="bg-white text-green-900 px-3 py-1 rounded hover:bg-gray-100 transition">
              LOGIN
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}