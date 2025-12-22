'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { TeamChat } from '@/components/TeamChat'
import { useLayout } from '@/contexts/LayoutContext'
import { cn } from '@/lib/utils'

export default function StatisticsPage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string
  const { sidebarCollapsed, chatCollapsed } = useLayout()

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
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar orgId={orgId} />
      
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        sidebarCollapsed ? "ml-20" : "ml-64",
        chatCollapsed ? "mr-12" : "mr-80"
      )}>
        <Header title="Statistics" />
        
        <div className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-muted-foreground">Statistics feature coming soon</div>
        </div>
      </div>

      <TeamChat orgId={orgId} />
    </div>
  )
}

