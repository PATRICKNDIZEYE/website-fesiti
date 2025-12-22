'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProjectRedirect() {
  const router = useRouter()

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.organizationId) {
          router.replace(`/org/${user.organizationId}/projects/new`)
          return
        }
      } catch (error) {
        console.error('Failed to parse user data:', error)
      }
    }
    router.replace('/login')
  }, [router])

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-muted-foreground">Redirecting...</div>
    </div>
  )
}
