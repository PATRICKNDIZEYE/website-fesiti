'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Redirect old visualization route to organization visualization
 */
export default function VisualizationRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.organizationId) {
          router.replace(`/org/${user.organizationId}/visualization`)
          return
        }
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }
    // If no organizationId, redirect to login
    router.replace('/login')
  }, [router])

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
