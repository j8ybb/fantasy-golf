import type { Metadata } from 'next'
import { Inter, Oswald } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar' // <--- This imports your logic-heavy navbar

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
        {/* We replaced the old <nav> block with your actual Navbar component */}
        <Navbar />

        {children}
      </body>
    </html>
  )
}