import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import AuthSessionProvider from '@/components/auth/SessionProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Separate viewport export for Next.js 14
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'EDUSCHEME - AI-Powered Curriculum Planning',
  description: 'Transform hours of manual scheme creation into minutes of automated, professional-grade educational planning.',
  keywords: ['education', 'curriculum', 'planning', 'AI', 'school management'],
  authors: [{ name: 'EDUSCHEME Team' }],
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthSessionProvider>
          <div id="root" className="min-h-screen bg-background">
            {children}
          </div>
          <Toaster 
            position="top-right"
            richColors
            closeButton
          />
          <div id="modal-root" />
        </AuthSessionProvider>
      </body>
    </html>
  )
}