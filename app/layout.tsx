import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "You're Absolutely Right! Counter",
  description: 'Counting how many times Claude Code says "You\'re absolutely right!"',
  keywords: ['claude', 'code', 'counter', 'ai', 'assistant'],
  openGraph: {
    title: "You're Absolutely Right! Counter",
    description: 'A fun counter tracking Claude Code\'s favorite phrase',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com',
    siteName: "You're Absolutely Right! Counter",
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}