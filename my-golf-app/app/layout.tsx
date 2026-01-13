import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'Fantasy Golf',
  description: 'PGA Tour Fantasy League',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* NAVIGATION BAR */}
        <nav className="bg-green-800 text-white p-4 shadow-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold tracking-tighter hover:text-green-200">
              ⛳ FANTASY GOLF
            </Link>
            
            <div className="space-x-6 font-semibold text-sm">
              <Link href="/" className="hover:text-green-200 transition">MY TEAM</Link>
              <Link href="/leaderboard" className="hover:text-green-200 transition">LEADERBOARD</Link>
            </div>
          </div>
        </nav>

        {/* PAGE CONTENT */}
        <main>{children}</main>
      </body>
    </html>
  )
}