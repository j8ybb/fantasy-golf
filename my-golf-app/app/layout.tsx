import type { Metadata } from 'next'
import { Inter, Oswald } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' })

export const metadata: Metadata = {
  title: 'Fantasy Fairways Golf',
  description: 'The PGA Tour Fantasy League',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${oswald.variable} font-sans bg-gray-50`}>
        {/* GLOBAL NAVIGATION BAR */}
        <nav className="bg-green-950 text-white border-b-4 border-yellow-500 shadow-lg sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              {/* Logo / Title */}
              <div className="flex-shrink-0 flex items-center">
                <span className="font-display text-2xl text-yellow-500 tracking-wider">
                  FANTASY<span className="text-white">FAIRWAYS</span>
                </span>
              </div>

              {/* Menu Links */}
              <div className="hidden md:flex space-x-8">
                <Link href="/" className="font-display uppercase tracking-widest hover:text-yellow-400 transition-colors text-sm">
                  Home
                </Link>
                <Link href="/team" className="font-display uppercase tracking-widest hover:text-yellow-400 transition-colors text-sm">
                  Manage Team
                </Link>
                <Link href="/leaderboard" className="font-display uppercase tracking-widest hover:text-yellow-400 transition-colors text-sm">
                  Leaderboard
                </Link>
              </div>

              {/* Mobile Menu (Simple) */}
              <div className="md:hidden flex space-x-4 text-xs font-bold uppercase">
                <Link href="/">Home</Link>
                <Link href="/team">Team</Link>
                <Link href="/leaderboard">Table</Link>
              </div>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  )
}