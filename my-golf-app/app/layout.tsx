import './globals.css'
import Navbar from '@/components/Navbar' // <--- 1. Make sure this import is here

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
      <body className="bg-gray-50 text-gray-900">
        
        {/* 2. Make sure this is the ONLY thing here (No <nav> tags!) */}
        <Navbar />

        <main>{children}</main>
      </body>
    </html>
  )
}