import api from './api'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: 'admin' | 'manager' | 'field_staff' | 'viewer'
}

export interface LoginResponse {
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
    lastName: string
  ): Promise<LoginResponse> => {
    const response = await api.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
    })
    return response.data
  },

  getProfile: async (): Promise<User> => {
    const response = await api.post('/auth/profile')
    return response.data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  forgotPassword: async (email: string): Promise<{ message: string; resetUrl?: string }> => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', { token, password })
    return response.data
  },
}

