import api from './api'
import type { SubmissionStatus, IndicatorPeriodStatus } from './types'

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

/**
 * Submission API helpers
 */
export const submissionsApi = {
  /**
   * List submissions with optional filters
   */
  list: (orgId: string, filters?: {
    projectId?: string
    status?: SubmissionStatus
    indicatorPeriodId?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.projectId) params.append('projectId', filters.projectId)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.indicatorPeriodId) params.append('indicatorPeriodId', filters.indicatorPeriodId)
    const query = params.toString()
    return orgApi.get(orgId, query ? `submissions?${query}` : 'submissions')
  },

  /**
   * Create draft submission
   */
  create: (orgId: string, data: {
    projectId: string
    indicatorPeriodId: string
    partnerOrgId?: string
    siteId?: string
  }) => orgApi.post(orgId, 'submissions', data),

  /**
   * Get submission by ID
   */
  get: (orgId: string, id: string) => orgApi.get(orgId, `submissions/${id}`),

  /**
   * Add value to submission (draft/returned only)
   */
  addValue: (orgId: string, submissionId: string, data: {
    indicatorId: string
    valueNumber?: number
    valueText?: string
    valueDate?: string
    disaggregationValueId?: string
    questionId?: string
    notes?: string
  }) => orgApi.post(orgId, `submissions/${submissionId}/values`, data),

  /**
   * Attach evidence file to submission
   */
  attachEvidence: async (orgId: string, submissionId: string, file: File, description?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }
    return orgApi.post(orgId, `submissions/${submissionId}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * Submit draft submission (changes status to SUBMITTED)
   */
  submit: (orgId: string, id: string) => orgApi.post(orgId, `submissions/${id}/submit`),

  /**
   * Update submission status (approve/return/lock)
   */
  updateStatus: (orgId: string, id: string, data: {
    status: 'APPROVED' | 'RETURNED' | 'LOCKED'
    decidedById: string
    reason?: string
  }) => orgApi.patch(orgId, `submissions/${id}/status`, data),
}

/**
 * Indicator Period API helpers
 */
export const indicatorPeriodsApi = {
  /**
   * Create indicator period
   */
  create: (orgId: string, data: {
    indicatorId: string
    periodKey: string
    startDate: string
    endDate: string
    dueDate?: string
  }) => orgApi.post(orgId, 'indicators/periods', data),

  /**
   * Update period status (OPEN/CLOSED)
   */
  updateStatus: (orgId: string, periodId: string, status: IndicatorPeriodStatus) =>
    orgApi.patch(orgId, `indicators/periods/${periodId}/status`, { status }),

  /**
   * Get periods for an indicator (via indicator endpoint)
   */
  getByIndicator: async (orgId: string, indicatorId: string) => {
    const response = await orgApi.get(orgId, `indicators/${indicatorId}`)
    return response.data.periods || []
  },
}

/**
 * Indicator Schedule API helpers
 */
export const indicatorSchedulesApi = {
  /**
   * Create indicator schedule
   */
  create: (orgId: string, data: {
    indicatorId: string
    frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM'
    calendarType?: 'GREGORIAN' | 'FISCAL'
    fiscalYearStartMonth?: number
    dueDaysAfterPeriodEnd?: number
    graceDays?: number
    timezone?: string
    isOpenOnCreate?: boolean
  }) => orgApi.post(orgId, 'indicators/schedules', data),
}

/**
 * Indicator Target API helpers
 */
export const indicatorTargetsApi = {
  /**
   * Create indicator target
   */
  create: (orgId: string, data: {
    indicatorId: string
    indicatorPeriodId?: string
    targetValue: number
    notes?: string
  }) => orgApi.post(orgId, 'indicators/targets', data),
}

