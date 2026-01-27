'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { authService, UserOrganization } from '@/lib/auth'

interface OrganizationContextType {
  organizationId: string | null
  setOrganizationId: (id: string | null) => void
  extractOrgIdFromPath: (path: string) => string | null
  organizations: UserOrganization[]
  currentOrganization: UserOrganization | null
  isLoading: boolean
  refreshOrganizations: () => Promise<void>
  switchOrganization: (orgId: string) => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [organizations, setOrganizations] = useState<UserOrganization[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const extractOrgIdFromPath = (path: string): string | null => {
    const match = path.match(/^\/org\/([^/]+)/)
    return match ? match[1] : null
  }

  const currentOrganization = organizations.find((org) => org.id === organizationId) || null

  const refreshOrganizations = useCallback(async () => {
    try {
      setIsLoading(true)
      const orgs = await authService.getOrganizations()
      setOrganizations(orgs)
      authService.saveUserOrganizations(orgs)
    } catch (error) {
      console.error('Failed to refresh organizations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const switchOrganization = useCallback(async (orgId: string) => {
    if (orgId === organizationId) return

    try {
      setIsLoading(true)
      const result = await authService.switchOrganization(orgId, false)
      authService.saveAuthData(result.access_token, result.user)
      setOrganizationId(orgId)

      // Navigate to the new org
      const newPath = pathname.replace(`/org/${organizationId}`, `/org/${orgId}`)
      router.push(newPath.includes('/org/') ? newPath : `/org/${orgId}/dashboard`)
      router.refresh()
    } catch (error) {
      console.error('Failed to switch organization:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [organizationId, pathname, router])

  // Load cached organizations on mount
  useEffect(() => {
    const cached = authService.getCachedOrganizations()
    if (cached && cached.length > 0) {
      setOrganizations(cached)
    }
  }, [])

  // Fetch organizations when user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && organizations.length === 0) {
      refreshOrganizations()
    }
  }, [refreshOrganizations, organizations.length])

  // Extract org ID from path
  useEffect(() => {
    const orgId = extractOrgIdFromPath(pathname)
    if (orgId) {
      setOrganizationId(orgId)
    } else {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          if (user.organizationId) {
            const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password']
            const isPublicPath = publicPaths.some((p) => pathname.startsWith(p))
            if (!isPublicPath && pathname !== '/') {
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
    <OrganizationContext.Provider
      value={{
        organizationId,
        setOrganizationId,
        extractOrgIdFromPath,
        organizations,
        currentOrganization,
        isLoading,
        refreshOrganizations,
        switchOrganization,
      }}
    >
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

