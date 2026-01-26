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
  programId?: string
  program?: Program
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
  reports?: Report[] // Legacy - will be replaced by submissions
  submissions?: Submission[]
  createdAt: string
  updatedAt: string
}

export interface Program {
  id: string
  orgId: string
  name: string
  code?: string
  startDate?: string
  endDate?: string
  currencyCode?: string
  projects?: Project[]
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
  resultsNodeId?: string
  direction?: 'increase' | 'decrease'
  aggregationRule?: 'sum' | 'avg' | 'latest' | 'formula'
  formulaExpr?: string
  baselineValue?: number
  baselineDate?: string
  requiresReview?: boolean
  isActive?: boolean
  targets?: IndicatorTarget[]
  periods?: IndicatorPeriod[]
  schedules?: IndicatorSchedule[]
  reports?: Report[] // Legacy
  submissions?: Submission[]
  createdAt: string
  updatedAt: string
}

// Updated to match backend IndicatorTarget
export interface IndicatorTarget {
  id: string
  indicatorId: string
  indicatorPeriodId?: string
  targetValue: number
  notes?: string
  indicatorPeriod?: IndicatorPeriod
  createdAt: string
}

// Legacy Target type (kept for backward compatibility)
export interface Target {
  id: string
  value: number
  targetDate: string
  notes?: string
  indicatorId: string
  createdAt: string
  updatedAt: string
}

// Legacy Report type (kept for backward compatibility with old ReportSubmissionForm)
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

// Submission Types (matching backend)
export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'RETURNED' | 'APPROVED' | 'LOCKED'

export interface Submission {
  id: string
  projectId: string
  indicatorPeriodId: string
  submittedById: string
  partnerOrgId?: string
  siteId?: string
  status: SubmissionStatus
  submittedAt?: string
  approvedAt?: string
  currentRevision: number
  values?: SubmissionValue[]
  evidence?: Evidence[]
  reviewTasks?: ReviewTask[]
  approvalDecisions?: ApprovalDecision[]
  indicatorPeriod?: IndicatorPeriod
  project?: Project
  submittedBy?: User
  partnerOrganization?: Organization
  site?: ProjectSite
  createdAt: string
  updatedAt: string
}

export interface SubmissionValue {
  id: string
  submissionId: string
  indicatorId: string
  questionId?: string
  disaggregationValueId?: string
  valueNumber?: number
  valueText?: string
  valueDate?: string
  valueCurrencyCode?: string
  isEstimated: boolean
  notes?: string
  indicator?: Indicator
  createdAt: string
}

export interface Evidence {
  id: string
  submissionId: string
  fileUrl?: string
  blobKey?: string
  fileType?: string
  description?: string
  capturedAt?: string
  createdAt: string
}

// Indicator Period Types
export type IndicatorPeriodStatus = 'OPEN' | 'CLOSED'

export interface IndicatorPeriod {
  id: string
  indicatorId: string
  periodKey: string
  startDate: string
  endDate: string
  dueDate?: string
  status: IndicatorPeriodStatus
  openedAt?: string
  closedAt?: string
  indicator?: Indicator
  submissions?: Submission[]
  targets?: IndicatorTarget[]
  createdAt: string
}

export type IndicatorFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM'
export type CalendarType = 'GREGORIAN' | 'FISCAL'

export interface IndicatorSchedule {
  id: string
  indicatorId: string
  frequency: IndicatorFrequency
  calendarType: CalendarType
  fiscalYearStartMonth?: number
  dueDaysAfterPeriodEnd: number
  graceDays: number
  timezone: string
  isOpenOnCreate: boolean
  createdAt: string
}

// Approval Types
export type ApprovalDecisionType = 'APPROVE' | 'RETURN' | 'REJECT'

export interface ApprovalDecision {
  id: string
  submissionId: string
  decidedById: string
  decision: ApprovalDecisionType
  decidedAt: string
  reason?: string
  decidedBy?: User
  createdAt: string
}

export type ReviewTaskStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED'

export interface ReviewTask {
  id: string
  submissionId: string
  assignedToId: string
  status: ReviewTaskStatus
  assignedTo?: User
  createdAt: string
  updatedAt: string
}

// Additional supporting types
export interface Organization {
  id: string
  name: string
  code?: string
  type?: 'donor' | 'implementer' | 'partner'
  parentOrgId?: string
  settingsJson?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface ProjectSite {
  id: string
  projectId: string
  name: string
  location?: string
  latitude?: number
  longitude?: number
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
  recentSubmissions?: Submission[]
}

