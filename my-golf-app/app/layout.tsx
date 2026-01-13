import './globals.css'
import Navbar from '@/components/Navbar' // <--- Importing the new component

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
        
        {/* We just place the component here! */}
        <Navbar />

        <main>{children}</main>
      </body>
    </html>
  )
}