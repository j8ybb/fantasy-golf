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
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

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
    router.push('/')
  }

  return (
    <nav className="bg-green-950 text-white border-b-4 border-yellow-500 shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            <span className="font-display text-2xl text-yellow-500 tracking-wider">
              FANTASY<span className="text-white">FAIRWAYS</span>
            </span>
          </Link>

          {/* Menu Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="font-display uppercase tracking-widest hover:text-yellow-400 transition-colors text-sm">
              Home
            </Link>
            <Link href="/season-summary" className="font-display uppercase tracking-widest hover:text-yellow-400 transition-colors text-sm">
              Season
            </Link>
            <Link href="/leaderboard" className="font-display uppercase tracking-widest hover:text-yellow-400 transition-colors text-sm">
              Leaderboard
            </Link>

            {/* Auth Button */}
            {user ? (
              <button 
                onClick={handleLogout}
                className="bg-red-700/20 border border-red-500 text-red-200 px-3 py-1 rounded font-display text-xs tracking-widest hover:bg-red-600 hover:text-white transition"
              >
                LOGOUT
              </button>
            ) : (
              <Link href="/login" className="bg-white text-green-950 px-4 py-1 rounded font-display text-xs tracking-widest hover:bg-yellow-400 transition">
                LOGIN
              </Link>
            )}
          </div>

          {/* Simple Mobile Menu */}
          <div className="md:hidden flex items-center space-x-4 text-xs font-bold uppercase">
            <Link href="/">Home</Link>
            {user ? (
              <button onClick={handleLogout} className="text-red-400">Logout</button>
            ) : (
              <Link href="/login" className="text-yellow-500">Login</Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}