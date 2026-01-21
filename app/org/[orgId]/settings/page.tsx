'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { TeamChat } from '@/components/TeamChat'

export default function SettingsPage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (!orgId) {
      console.error('Organization ID not found in route')
      return
    }
  }, [router, orgId])

  return (
    <div className="space-y-6">
      <Header title="Settings" subtitle="Workspace preferences and governance." />

      <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/60 p-12 text-muted-foreground">
        Settings feature coming soon
      </div>

      <TeamChat orgId={orgId} />
    </div>
  )
}
