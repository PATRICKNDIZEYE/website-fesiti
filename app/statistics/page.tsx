'use client'

import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { TeamChat } from '@/components/TeamChat'

export default function StatisticsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Statistics" />
        
        <div className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-gray-500">Statistics feature coming soon</div>
        </div>
      </div>

      <TeamChat />
    </div>
  )
}

