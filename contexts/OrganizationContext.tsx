'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface OrganizationContextType {
  organizationId: string | null
  setOrganizationId: (id: string | null) => void
  extractOrgIdFromPath: (path: string) => string | null
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  const extractOrgIdFromPath = (path: string): string | null => {
    // Extract orgId from paths like /org/[orgId]/projects
    const match = path.match(/^\/org\/([^/]+)/)
    return match ? match[1] : null
  }

  useEffect(() => {
    const orgId = extractOrgIdFromPath(pathname)
    if (orgId) {
      setOrganizationId(orgId)
    } else {
      // If no orgId in path, try to get from user data or redirect
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          if (user.organizationId) {
            // Redirect to org route if user has organizationId but path doesn't
            if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
              router.push(`/org/${user.organizationId}/dashboard`)
            }
          }
        } catch (e) {
          console.error('Error parsing user data:', e)
        }
      }
    }
  }, [pathname, router])

  return (
    <OrganizationContext.Provider value={{ organizationId, setOrganizationId, extractOrgIdFromPath }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}

