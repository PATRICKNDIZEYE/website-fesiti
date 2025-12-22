import api from './api'

/**
 * Build API URL with organization ID
 * All tenant-scoped endpoints should use this helper
 */
export function buildOrgApiUrl(orgId: string, path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // If path already starts with org/:orgId, return as is
  if (cleanPath.startsWith(`org/${orgId}/`)) {
    return `/${cleanPath}`
  }
  
  // Otherwise, prepend org/:orgId
  return `/org/${orgId}/${cleanPath}`
}

/**
 * API helper functions that automatically include organizationId
 */
export const orgApi = {
  get: (orgId: string, path: string, config?: any) => {
    return api.get(buildOrgApiUrl(orgId, path), config)
  },
  
  post: (orgId: string, path: string, data?: any, config?: any) => {
    return api.post(buildOrgApiUrl(orgId, path), data, config)
  },
  
  patch: (orgId: string, path: string, data?: any, config?: any) => {
    return api.patch(buildOrgApiUrl(orgId, path), data, config)
  },
  
  put: (orgId: string, path: string, data?: any, config?: any) => {
    return api.put(buildOrgApiUrl(orgId, path), data, config)
  },
  
  delete: (orgId: string, path: string, config?: any) => {
    return api.delete(buildOrgApiUrl(orgId, path), config)
  },
}

