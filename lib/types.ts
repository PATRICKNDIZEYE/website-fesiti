export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'

export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  startDate?: string
  endDate?: string
  progress: number
  managerId: string
  manager?: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  teamMembers?: Array<{
    id: string
    email: string
    firstName: string
    lastName: string
    avatar?: string
  }>
  indicators?: Indicator[]
  reports?: Report[]
  createdAt: string
  updatedAt: string
}

export interface Indicator {
  id: string
  name: string
  description?: string
  type: 'quantitative' | 'qualitative' | 'percentage'
  unit: 'number' | 'percentage' | 'currency' | 'text'
  projectId: string
  targets?: Target[]
  reports?: Report[]
  createdAt: string
  updatedAt: string
}

export interface Target {
  id: string
  value: number
  targetDate: string
  notes?: string
  indicatorId: string
  createdAt: string
  updatedAt: string
}

export interface Report {
  id: string
  value?: number | null
  textValue?: string | null
  notes?: string
  reportDate: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  projectId: string
  indicatorId: string
  submittedById: string
  submittedBy?: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  attachments?: string[]
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: 'admin' | 'manager' | 'field_staff' | 'viewer'
  isActive: boolean
  hasCompletedOnboarding?: boolean
  createdAt: string
}

export interface DashboardStats {
  stats: {
    totalProjects: number
    activeProjects: number
    totalUsers: number
    totalReports: number
    totalIndicators: number
    averageProgress: number
  }
  recentProjects: Project[]
  recentReports: Report[]
}

