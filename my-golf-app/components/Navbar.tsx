'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: activeUser } } = await supabase.auth.getUser()
      setUser(activeUser)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
       setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsMobileMenuOpen(false)
    
    // FORCE RELOAD: This clears all React state and ensures the Landing Page appears
    window.location.href = '/' 
  }

  return (
    <nav className="bg-green-950 text-white border-b-4 border-yellow-500 shadow-lg sticky top-0 z-50 font-sans">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            <span className="font-display text-2xl md:text-3xl text-yellow-500 tracking-wider">
              FANTASY<span className="text-white">FAIRWAYS</span>
            </span>
          </Link>

          {/* Desktop Menu Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="font-display uppercase tracking-widest hover:text-yellow-400 transition-colors text-sm font-medium">
              Home
            </Link>

            {/* PROTECTED LINKS: Only show if user is logged in */}
            {user && (
              <>
                <Link href="/team" className="font-display uppercase tracking-widest hover:text-yellow-400 transition-colors text-sm font-medium">
                  Team
                </Link>
                <Link href="/leaderboard" className="font-display uppercase tracking-widest hover:text-yellow-400 transition-colors text-sm font-medium">
                  Leaderboard
                </Link>
              </>
            )}

            {/* Season Dropdown */}
            <div 
              className="relative group"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button className="font-display uppercase tracking-widest hover:text-yellow-400 transition-colors text-sm font-medium flex items-center gap-1 py-4">
                Season
                <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-56 bg-green-900 border-t-2 border-yellow-500 shadow-2xl py-2 mt-0 z-50">
                  <Link 
                    href="/season-summary" 
                    className="block px-4 py-3 text-xs font-display tracking-widest hover:bg-green-800 hover:text-yellow-400 transition"
                  >
                    2026 Schedule
                  </Link>
                  <Link 
                    href="/rules" 
                    className="block px-4 py-3 text-xs font-display tracking-widest hover:bg-green-800 hover:text-yellow-400 transition"
                  >
                    Rules & Scoring
                  </Link>
                </div>
              )}
            </div>

            {/* Auth Button */}
            {user ? (
              <button 
                onClick={handleLogout}
                className="bg-yellow-500 text-green-950 px-4 py-1.5 rounded font-display text-xs tracking-widest hover:bg-white transition"
              >
                LOGOUT
              </button>
            ) : (
              <Link href="/login" className="bg-white text-green-950 px-5 py-1.5 rounded font-display text-xs tracking-widest hover:bg-yellow-400 transition">
                LOGIN
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-yellow-500 focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-green-900 border-t border-white/10 animate-in slide-in-from-top duration-300">
          <div className="px-6 py-8 space-y-6">
            <Link onClick={() => setIsMobileMenuOpen(false)} href="/" className="block text-lg font-display uppercase tracking-widest">Home</Link>
            
            {/* PROTECTED MOBILE LINKS */}
            {user && (
              <>
                <Link onClick={() => setIsMobileMenuOpen(false)} href="/team" className="block text-lg font-display uppercase tracking-widest">Team</Link>
                <Link onClick={() => setIsMobileMenuOpen(false)} href="/leaderboard" className="block text-lg font-display uppercase tracking-widest">Leaderboard</Link>
              </>
            )}
            
            <div className="space-y-4 pt-2 pb-2">
              <p className="text-[10px] font-black uppercase text-yellow-500 tracking-[0.3em]">Season Info</p>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/season-summary" className="block text-lg font-display uppercase tracking-widest pl-4 border-l-2 border-yellow-500/30">Schedule</Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="/rules" className="block text-lg font-display uppercase tracking-widest pl-4 border-l-2 border-yellow-500/30">Rules & Scoring</Link>
            </div>
            
            <div className="pt-6 border-t border-white/10">
              {user ? (
                <button onClick={handleLogout} className="w-full text-left text-lg font-display uppercase tracking-widest text-yellow-500">Logout</button>
              ) : (
                <Link onClick={() => setIsMobileMenuOpen(false)} href="/login" className="block text-lg font-display uppercase tracking-widest text-yellow-500">Login</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}