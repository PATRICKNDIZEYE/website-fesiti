'use client'

import { usePathname } from 'next/navigation'
import { useOrganization as useOrgContext } from '@/contexts/OrganizationContext'

export function useOrganizationId(): string {
  const pathname = usePathname()
  const { extractOrgIdFromPath } = useOrgContext()
  
  const orgId = extractOrgIdFromPath(pathname)
  
  if (!orgId) {
    // Try to get from user data as fallback
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          if (user.organizationId) {
            return user.organizationId
          }
        } catch (e) {
          console.error('Error parsing user data:', e)
        }
      }
    }
    throw new Error('Organization ID not found in route. Ensure you are on a route like /org/[orgId]/...')
  }
  
  return orgId
}

