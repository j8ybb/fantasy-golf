import './globals.css'
import Navbar from '@/components/Navbar' // Ensure this path is correct based on your folder move
import { Inter, Oswald } from 'next/font/google'

// Load fonts
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' })

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
      <body className={`${inter.variable} ${oswald.variable} font-sans bg-gray-50 text-gray-900`}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
}