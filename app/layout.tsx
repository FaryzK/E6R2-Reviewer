import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'E6(R2) Reviewer',
  description: 'Document review and analysis tool',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/favicon.png',
        type: 'image/png',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
} 