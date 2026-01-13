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
    // Check current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // Listen for login/logout changes automatically
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
    <nav className="bg-green-800 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold tracking-tighter hover:text-green-200">
          ⛳ FANTASY GOLF
        </Link>
        
        <div className="flex items-center gap-6 font-semibold text-sm">
          <Link href="/" className="hover:text-green-200 transition">MY TEAM</Link>
          <Link href="/leaderboard" className="hover:text-green-200 transition">LEADERBOARD</Link>
          
          {user ? (
            <button 
              onClick={handleLogout} 
              className="bg-green-900 border border-green-700 px-3 py-1 rounded hover:bg-green-700 transition text-xs tracking-widest"
            >
              LOGOUT
            </button>
          ) : (
            <Link href="/login" className="bg-white text-green-800 px-3 py-1 rounded hover:bg-gray-100 transition">
              LOGIN
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}