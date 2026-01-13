'use client'

import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-green-900 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-wider text-yellow-400">
          FANTASY FAIRWAYS
        </Link>
        
        {/* Right Side Links */}
        <div className="flex items-center gap-4 text-sm font-bold">
          <Link href="/">MY TEAM</Link>
          <Link href="/season-summary">SEASON</Link>
          
          {/* HARDCODED TEST BUTTONS */}
          <div className="bg-red-600 px-4 py-2 border-2 border-yellow-400">
             TEST BUTTON
          </div>
        </div>
      </div>
    </nav>
  )
}