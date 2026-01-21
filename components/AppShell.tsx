'use client'

import { ReactNode } from 'react'
import { AppTopNav } from '@/components/AppTopNav'

interface AppShellProps {
  orgId: string
  children: ReactNode
}

export function AppShell({ orgId, children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <AppTopNav orgId={orgId} />
      <main className="mx-auto w-full max-w-7xl px-6 pb-16 pt-8">
        {children}
      </main>
    </div>
  )
}
