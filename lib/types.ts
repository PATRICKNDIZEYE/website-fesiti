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
  definition?: string  // Backend uses 'definition', not 'description'
  description?: string // Keep for backward compatibility
  type: 'quantitative' | 'qualitative' | 'percentage'
  // Unit can be a string (legacy) or Unit object (new backend with relations)
  unit: string | Unit | null
  unitId?: string
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
  disaggregations?: IndicatorDisaggregation[]
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
export type SubmissionStatus = 'draft' | 'submitted' | 'returned' | 'approved' | 'locked'

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
  importId?: string | null
  questionId?: string
  disaggregationValueId?: string
  valueNumber?: number
  valueText?: string
  valueDate?: string
  valueCurrencyCode?: string
  isEstimated: boolean
  notes?: string
  indicator?: Indicator
  disaggregationValues?: DisaggregationValue[]
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

// Unit Types (for indicator measurement)
export interface Unit {
  id: string
  orgId: string
  name: string
  symbol?: string
  unitType?: string
  createdAt: string
}

// Indicator Period Types
export type IndicatorPeriodStatus = 'open' | 'closed'

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

export type IndicatorFrequency = 'monthly' | 'quarterly' | 'annual' | 'custom'
export type CalendarType = 'gregorian' | 'fiscal'

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

// Disaggregation Types
export interface DisaggregationDef {
  id: string
  orgId: string
  name: string
  code?: string
  values?: DisaggregationValue[]
  createdAt: string
}

export interface DisaggregationValue {
  id: string
  disaggregationDefId: string
  valueLabel: string
  valueCode?: string
  sortOrder: number
  definition?: DisaggregationDef
  createdAt: string
}

export interface IndicatorDisaggregation {
  id: string
  indicatorId: string
  disaggregationDefId: string
  definition?: DisaggregationDef
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

export type ReviewTaskStatus = 'open' | 'in_review' | 'resolved'

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

// Organization membership types
export type MembershipRole = 'owner' | 'admin' | 'member'

export interface OrganizationMembership {
  id: string
  userId: string
  orgId: string
  membershipRole: MembershipRole
  isDefault: boolean
  organization: Organization
  createdAt: string
  updatedAt: string
}

export interface UserOrganization {
  id: string
  name: string
  code?: string
  type?: 'donor' | 'implementer' | 'partner'
  role: MembershipRole
  isDefault: boolean
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

// Data Collection (Public Forms)
export enum LinkStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
}

export interface DataCollectionLink {
  id: string
  orgId: string
  indicatorId: string
  indicatorPeriodId: string
  accessToken?: string
  title: string
  description?: string
  welcomeMessage?: string
  thankYouMessage?: string
  allowMultipleSubmissions: boolean
  requireName: boolean
  requireEmail: boolean
  requirePhone: boolean
  expiresAt?: string
  status: LinkStatus
  responseCount?: number
  indicator?: Indicator
  indicatorPeriod?: IndicatorPeriod
  createdAt: string
}

export interface FormResponse {
  id: string
  linkId: string
  respondentName?: string | null
  respondentEmail?: string | null
  respondentPhone?: string | null
  valueNumber?: number | null
  valueText?: string | null
  disaggregationValues?: string[] | null
  isEstimated?: boolean
  notes?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
  link?: DataCollectionLink
}

export interface PeriodNarrative {
  id: string
  orgId: string
  projectId: string
  indicatorPeriodId: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

