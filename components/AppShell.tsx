'use client'

import { ReactNode } from 'react'
import { AppTopNav } from '@/components/AppTopNav'
import { SubNavigation } from '@/components/SubNavigation'

interface AppShellProps {
  orgId: string
  children: ReactNode
}

export function AppShell({ orgId, children }: AppShellProps) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <AppTopNav orgId={orgId} />
      <div className="flex pt-16">
        <SubNavigation orgId={orgId} />
        {/* Add left margin to account for sidebar (64px = w-16) */}
        {/* Use w-0 trick to prevent flex item from overflowing */}
        {/* Add right padding to account for chat panel (320px = w-80 when open) */}
        <main className="flex-1 ml-16 min-w-0 w-0 overflow-x-hidden pr-80">
          <div className="w-full max-w-full px-4 sm:px-6 pb-16 pt-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
