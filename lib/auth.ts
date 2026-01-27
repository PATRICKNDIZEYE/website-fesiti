import api from './api'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: 'admin' | 'manager' | 'field_staff' | 'viewer'
  organizationId?: string
  hasCompletedOnboarding?: boolean
}

export interface LoginResponse {
  access_token: string
  user: User
}

export interface UserOrganization {
  id: string
  name: string
  code?: string
  type?: 'donor' | 'implementer' | 'partner'
  role: 'owner' | 'admin' | 'member'
  isDefault: boolean
}

export interface SwitchOrgResponse {
  access_token: string
  user: User
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  register: async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    orgId?: string,
    organizationName?: string
  ): Promise<LoginResponse> => {
    const response = await api.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
      orgId,
      organizationName,
    })
    return response.data
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile')
    return response.data
  },

  getOrganizations: async (): Promise<UserOrganization[]> => {
    const response = await api.get('/auth/organizations')
    return response.data
  },

  switchOrganization: async (
    orgId: string,
    setAsDefault?: boolean
  ): Promise<SwitchOrgResponse> => {
    const response = await api.post('/auth/switch-org', { orgId, setAsDefault })
    return response.data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userOrganizations')
  },

  forgotPassword: async (email: string): Promise<{ message: string; resetUrl?: string }> => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', { token, password })
    return response.data
  },

  // Helper to save auth data
  saveAuthData: (token: string, user: User) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  },

  // Helper to save user organizations
  saveUserOrganizations: (orgs: UserOrganization[]) => {
    localStorage.setItem('userOrganizations', JSON.stringify(orgs))
  },

  // Helper to get user organizations from cache
  getCachedOrganizations: (): UserOrganization[] | null => {
    const orgsStr = localStorage.getItem('userOrganizations')
    if (!orgsStr) return null
    try {
      return JSON.parse(orgsStr)
    } catch {
      return null
    }
  },
}

