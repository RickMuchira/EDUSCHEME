import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EDUScheme Pro - AI-Powered Curriculum Planning',
  description: 'Transform hours of manual scheme creation into minutes of automated, professional-grade educational planning.',
  keywords: ['education', 'curriculum', 'planning', 'AI', 'school management'],
  authors: [{ name: 'EDUScheme Pro Team' }],
  viewport: 'width=device-width, initial-scale=1',
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
        <div id="root" className="min-h-screen bg-background">
          {children}
        </div>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
        <div id="modal-root" />
      </body>
    </html>
  )
}