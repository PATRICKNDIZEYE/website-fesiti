import axios, { AxiosRequestConfig } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token and organizationId to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    // Always set Authorization header, even if headers are manually set
    // This ensures it works with FormData and other custom headers
    if (!config.headers) {
      config.headers = {}
    }
    config.headers.Authorization = `Bearer ${token}`
    
    // Debug log for org endpoints
    if (config.url?.includes('/organizations/')) {
      console.log('Sending request to:', config.url, 'with token:', token.substring(0, 20) + '...')
    }
  } else {
    console.warn('No token found in localStorage for request:', config.url)
  }

  // Extract organizationId from URL if present (for /org/:orgId routes)
  // This will be handled by the route structure, but we can also get it from user data
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      if (user.organizationId && config.url && !config.url.startsWith('/auth') && !config.url.startsWith('/organizations')) {
        // If URL doesn't already have /org/:orgId, we'll need to add it
        // But since we're using path-based routing, the URL should already include it
        // This is mainly for backward compatibility
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  return config
})

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const url = error.config?.url || ''
      const method = error.config?.method?.toLowerCase() || ''
      
      // Don't redirect for organization endpoints during onboarding
      // These endpoints allow users to manage their own org without explicit permissions
      const isOrgEndpoint = url.includes('/organizations/')
      // Match: /organizations/:id, /organizations/:id/setup, /organizations/:id/logo
      const isOrgSetupFlow = isOrgEndpoint && (
        url.includes('/setup') || 
        url.includes('/logo') || 
        (method === 'get' && /\/organizations\/[^/]+(\?|$)/.test(url)) // GET /organizations/:id (with or without query params)
      )
      
      // Don't redirect for import history endpoints (let the UI show the error instead of logging out)
      const isImportHistoryEndpoint = url.includes('/import-history')
      
      if (isOrgSetupFlow || isImportHistoryEndpoint) {
        // Don't redirect - let the component handle the error
        console.log('Auth error on non-critical endpoint, not redirecting:', url, error.response?.status)
        return Promise.reject(error)
      }
      
      // For other endpoints, redirect to login
      // BUT: only redirect if we're not already on the login page
      // AND: don't redirect if we're on a form submission page (let component handle error)
      const isFormPage = typeof window !== 'undefined' && (
        window.location.pathname.includes('/projects/new') ||
        window.location.pathname.includes('/projects/[id]/edit')
      )
      
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !isFormPage) {
        console.log('Auth error, redirecting to login:', url, error.response?.status)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      } else if (isFormPage) {
        // On form pages, don't redirect - let component handle the error
        console.log('Auth error on form page, not redirecting:', url, error.response?.status)
      }
    }
    return Promise.reject(error)
  }
)

export default api

