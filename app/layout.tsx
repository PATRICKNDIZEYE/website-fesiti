import type { Metadata } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ThemeProvider } from '@/components/ThemeProvider'
import { LayoutProvider } from '@/contexts/LayoutContext'
import { OrganizationProvider } from '@/contexts/OrganizationContext'

const ibmPlex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PM Tool - NGO Project Management Platform',
  description: 'Plan, track, and visualize project performance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ibmPlex.variable} font-sans antialiased`}>
        <ThemeProvider>
          <LayoutProvider>
            <OrganizationProvider>
              <Providers>{children}</Providers>
            </OrganizationProvider>
          </LayoutProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
