import api from './api'
import type { SubmissionStatus, IndicatorPeriodStatus } from './types'

/**
 * Build API URL - the backend uses flat routes, not /org/:orgId prefix
 * The orgId is passed via query params or request body, and JWT token
 * contains the user's org for permission checks via OrgScopeGuard
 */
export function buildOrgApiUrl(orgId: string, path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // If path already starts with org/, strip it (legacy frontend code)
  if (cleanPath.startsWith(`org/${orgId}/`)) {
    return `/${cleanPath.replace(`org/${orgId}/`, '')}`
  }
  
  // Return clean path (backend uses flat routes like /projects, /programs, etc.)
  return `/${cleanPath}`
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
    status: 'approved' | 'returned' | 'locked'
    decidedById: string
    reason?: string
  }) => orgApi.patch(orgId, `submissions/${id}/status`, data),
}

/**
 * Approval API helpers
 */
export const approvalsApi = {
  list: (orgId: string, submissionId?: string) => {
    const params = new URLSearchParams()
    if (submissionId) params.append('submissionId', submissionId)
    const query = params.toString()
    return orgApi.get(orgId, query ? `approvals?${query}` : 'approvals')
  },
}

/**
 * Narratives API helpers
 */
export const narrativesApi = {
  list: (orgId: string, projectId?: string, periodId?: string) => {
    const params = new URLSearchParams()
    if (projectId) params.append('projectId', projectId)
    if (periodId) params.append('periodId', periodId)
    const query = params.toString()
    return orgApi.get(orgId, query ? `narratives?${query}` : 'narratives')
  },
  create: (orgId: string, data: { projectId: string; indicatorPeriodId: string; title: string; content: string }) =>
    orgApi.post(orgId, 'narratives', data),
  update: (orgId: string, id: string, data: { title?: string; content?: string }) =>
    orgApi.patch(orgId, `narratives/${id}`, data),
  delete: (orgId: string, id: string) =>
    orgApi.delete(orgId, `narratives/${id}`),
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
   * Update period status (open/closed)
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
    frequency: 'monthly' | 'quarterly' | 'termly' | 'annual' | 'custom'
    calendarType?: 'gregorian' | 'fiscal'
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

/**
 * Indicator inputs (for formula indicators)
 */
export const indicatorInputsApi = {
  list: (orgId: string, indicatorId: string) =>
    orgApi.get(orgId, `indicators/${indicatorId}/inputs`),
  create: (orgId: string, indicatorId: string, data: {
    name: string
    code?: string
    inputType: 'value' | 'numerator' | 'denominator'
    unitId?: string
    description?: string
    isRequired?: boolean
    disaggregationDefIds?: string[]
  }) => orgApi.post(orgId, `indicators/${indicatorId}/inputs`, data),
  update: (orgId: string, inputId: string, data: { name?: string; code?: string; inputType?: string; unitId?: string; description?: string; isRequired?: boolean }) =>
    orgApi.patch(orgId, `indicators/inputs/${inputId}`, data),
  delete: (orgId: string, inputId: string) =>
    orgApi.delete(orgId, `indicators/inputs/${inputId}`),
}

/**
 * Disaggregation API helpers
 */
export const disaggregationsApi = {
  // Definitions (dimensions like Gender, Age Group, etc.)
  listDefinitions: (orgId: string) => 
    orgApi.get(orgId, `disaggregations/definitions?orgId=${orgId}`),
  
  createDefinition: (orgId: string, data: { name: string; code?: string }) =>
    orgApi.post(orgId, 'disaggregations/definitions', { ...data, orgId }),
  
  // Values (Male, Female, 0-5, 6-17, etc.)
  listValues: (orgId: string, defId: string) =>
    orgApi.get(orgId, `disaggregations/definitions/${defId}/values`),
  
  addValue: (orgId: string, data: { disaggregationDefId: string; valueLabel: string; valueCode?: string; sortOrder?: number; locationId?: string }) =>
    orgApi.post(orgId, 'disaggregations/values', data),
  
  // Indicator-Disaggregation linking
  getIndicatorDisaggregations: (orgId: string, indicatorId: string) =>
    orgApi.get(orgId, `indicators/${indicatorId}/disaggregations`),
  
  linkToIndicator: (orgId: string, indicatorId: string, disaggregationDefIds: string[]) =>
    orgApi.post(orgId, `indicators/${indicatorId}/disaggregations`, { disaggregationDefIds }),
  
  addToIndicator: (orgId: string, indicatorId: string, disaggregationDefId: string) =>
    orgApi.post(orgId, `indicators/${indicatorId}/disaggregations/add`, { disaggregationDefId }),
  
  removeFromIndicator: (orgId: string, indicatorId: string, defId: string) =>
    orgApi.delete(orgId, `indicators/${indicatorId}/disaggregations/${defId}`),
}

/**
 * Locations (for linking to disaggregation values or sites; have lat/lng)
 */
export const locationsApi = {
  list: (orgId: string) => orgApi.get(orgId, `locations?orgId=${orgId}`),
  get: (orgId: string, id: string) => orgApi.get(orgId, `locations/${id}`),
}

/**
 * Data Collection (Shareable Forms) API helpers
 */
export const dataCollectionApi = {
  // Authenticated endpoints (admin)
  createLink: (orgId: string, data: {
    indicatorId: string
    indicatorPeriodId: string
    title: string
    description?: string
    welcomeMessage?: string
    thankYouMessage?: string
    allowMultipleSubmissions?: boolean
    requireName?: boolean
    requireEmail?: boolean
    requirePhone?: boolean
    expiresAt?: string
  }) => orgApi.post(orgId, 'data-collection/links', data),
  
  listLinks: (orgId: string, indicatorId?: string) =>
    orgApi.get(orgId, indicatorId ? `data-collection/links?indicatorId=${indicatorId}` : 'data-collection/links'),
  
  getLink: (orgId: string, linkId: string) =>
    orgApi.get(orgId, `data-collection/links/${linkId}`),
  
  getResponses: (orgId: string, linkId: string) =>
    orgApi.get(orgId, `data-collection/links/${linkId}/responses`),

  listResponses: (orgId: string, indicatorId?: string, periodId?: string) => {
    const params = new URLSearchParams()
    if (indicatorId) params.set('indicatorId', indicatorId)
    if (periodId) params.set('periodId', periodId)
    const query = params.toString()
    return orgApi.get(orgId, query ? `data-collection/responses?${query}` : 'data-collection/responses')
  },
  
  getAggregatedResults: (orgId: string, linkId: string) =>
    orgApi.get(orgId, `data-collection/links/${linkId}/aggregated`),
  
  updateLinkStatus: (orgId: string, linkId: string, status: 'active' | 'paused' | 'closed') =>
    orgApi.patch(orgId, `data-collection/links/${linkId}/status`, { status }),
  
  deleteLink: (orgId: string, linkId: string) =>
    orgApi.delete(orgId, `data-collection/links/${linkId}`),

  /**
   * Convert form responses into draft submissions so they can be submitted and approved.
   * Returns { created, submissionIds }.
   */
  convertToSubmissions: (orgId: string, formResponseIds: string[]) =>
    orgApi.post(orgId, 'data-collection/convert-to-submissions', { formResponseIds }),
}

/**
 * Import History API helpers
 */
export const importHistoryApi = {
  create: (orgId: string, data: {
    indicatorId?: string
    indicatorPeriodId?: string
    importType: 'data_collection' | 'data_table' | 'bulk_update'
    fileName: string
    fileSize?: number
    columnMappings?: Record<string, string>
  }) => orgApi.post(orgId, 'import-history', data),
  
  list: (orgId: string, indicatorId?: string) =>
    orgApi.get(orgId, indicatorId ? `import-history?indicatorId=${indicatorId}` : 'import-history'),
  
  get: (orgId: string, importId: string) =>
    orgApi.get(orgId, `import-history/${importId}`),
  
  process: (orgId: string, importId: string, data: {
    rows: { rowKey?: string; value: number; disaggregationValueIds?: string[]; isEstimated?: boolean; notes?: string }[]
    submissionId: string
  }) => orgApi.post(orgId, `import-history/${importId}/process`, data),
  
  download: (orgId: string, importId: string) =>
    orgApi.get(orgId, `import-history/${importId}/download`),
  
  delete: (orgId: string, importId: string) =>
    orgApi.delete(orgId, `import-history/${importId}`),
}

/**
 * Results nodes (project objectives / outcomes) API helpers
 */
export const resultsNodesApi = {
  list: (orgId: string, projectId?: string) => {
    const query = projectId ? `?projectId=${projectId}` : ''
    return orgApi.get(orgId, `results-nodes${query}`)
  },
  get: (orgId: string, id: string) => orgApi.get(orgId, `results-nodes/${id}`),
  create: (orgId: string, data: {
    projectId: string
    parentId?: string
    nodeType: 'outcome' | 'output'
    title: string
    code?: string
    description?: string
    sortOrder?: number
  }) => orgApi.post(orgId, 'results-nodes', data),
  update: (orgId: string, id: string, data: {
    parentId?: string
    nodeType?: 'outcome' | 'output'
    title?: string
    code?: string
    description?: string
    sortOrder?: number
  }) => orgApi.patch(orgId, `results-nodes/${id}`, data),
  delete: (orgId: string, id: string) => orgApi.delete(orgId, `results-nodes/${id}`),
}

/**
 * Reports API helpers (PITT = Performance Indicator Tracking Table)
 */
export const reportsApi = {
  getPitt: (orgId: string, projectId: string) =>
    orgApi.get(orgId, `reports/pitt/${projectId}`),

  /** Get indicator progress: aggregated submissions vs targets (formula applied for formula indicators) */
  getIndicatorProgress: (orgId: string, indicatorId: string, periodId?: string) => {
    const query = periodId ? `?periodId=${periodId}` : ''
    return orgApi.get(orgId, `reports/indicator-progress/${indicatorId}${query}`)
  },
}

