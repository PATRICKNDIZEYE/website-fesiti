import {
  LayoutDashboard,
  FolderKanban,
  TrendingUp,
  FileSpreadsheet,
  Calendar,
  Users,
  MessageSquare,
  BarChart3,
  List,
  Plus,
  Settings,
  Database,
  Upload,
  PieChart,
  LineChart,
  Activity,
  Sparkles,
  Brain,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react'

export interface SubNavItem {
  label: string
  path: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: number | string
}

export interface SubNavigationConfig {
  [key: string]: {
    items: SubNavItem[]
    showIn?: string[]
  }
}

export const subNavigationConfig: SubNavigationConfig = {
  dashboard: {
    items: [
      { label: 'Overview', path: 'dashboard', icon: LayoutDashboard },
      { label: 'Statistics', path: 'statistics', icon: BarChart3 },
      { label: 'Notifications', path: 'notifications', icon: Activity },
    ],
    showIn: ['dashboard', 'statistics', 'notifications'],
  },
  projects: {
    items: [
      { label: 'All Programs', path: 'projects', icon: List },
      { label: 'New Program', path: 'projects/new', icon: Plus },
      { label: 'Kanban View', path: 'projects?view=kanban', icon: FolderKanban },
    ],
    showIn: ['projects', 'projects/new', 'projects/[id]', 'projects/[id]/edit'],
  },
  visualization: {
    items: [
      { label: 'Overview', path: 'visualization', icon: PieChart },
      { label: 'Projects', path: 'visualization?tab=projects', icon: FolderKanban },
      { label: 'Reports', path: 'visualization?tab=reports', icon: FileSpreadsheet },
      { label: 'Analytics', path: 'visualization?tab=analytics', icon: LineChart },
    ],
    showIn: ['visualization', 'visualization/[projectId]'],
  },
  'data-import': {
    items: [
      { label: 'Import Data', path: 'data-import', icon: Upload },
      { label: 'Datasets', path: 'data-import?tab=datasets', icon: Database },
      { label: 'Connections', path: 'data-import?tab=connections', icon: Settings },
    ],
    showIn: ['data-import', 'data-import/[datasetId]', 'data-import/[datasetId]/visualize'],
  },
  calendar: {
    items: [
      { label: 'Calendar', path: 'calendar', icon: Calendar },
      { label: 'Events', path: 'calendar?view=events', icon: Activity },
      { label: 'Timeline', path: 'calendar?view=timeline', icon: BarChart3 },
    ],
    showIn: ['calendar'],
  },
  users: {
    items: [
      { label: 'All Users', path: 'users', icon: Users },
      { label: 'Roles & Permissions', path: 'users?tab=roles', icon: Settings },
      { label: 'Teams', path: 'users?tab=teams', icon: FolderKanban },
    ],
    showIn: ['users'],
  },
  messages: {
    items: [
      { label: 'Conversations', path: 'messages', icon: MessageSquare },
      { label: 'Archived', path: 'messages?tab=archived', icon: FolderKanban },
    ],
    showIn: ['messages'],
  },
  settings: {
    items: [
      { label: 'General', path: 'settings', icon: Settings },
      { label: 'Organization', path: 'settings?tab=organization', icon: FolderKanban },
      { label: 'Integrations', path: 'settings?tab=integrations', icon: Database },
    ],
    showIn: ['settings'],
  },
  'ai-insights': {
    items: [
      { label: 'Overview', path: 'ai-insights', icon: Sparkles },
      { label: 'Predictions', path: 'ai-insights?tab=predictions', icon: Brain },
      { label: 'Risk Alerts', path: 'ai-insights?tab=risks', icon: AlertTriangle },
      { label: 'Recommendations', path: 'ai-insights?tab=recommendations', icon: Lightbulb },
    ],
    showIn: ['ai-insights'],
  },
}
