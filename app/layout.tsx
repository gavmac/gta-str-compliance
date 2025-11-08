import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GTA Compliance Digest',
  description: 'Stay compliant with municipal regulations across Greater Toronto Area cities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}