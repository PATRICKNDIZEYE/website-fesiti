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
    config.headers.Authorization = `Bearer ${token}`
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

