'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { TeamChat } from '@/components/TeamChat'
import { useLayout } from '@/contexts/LayoutContext'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { Loader2, TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react'
import api from '@/lib/api'

interface VisualizationData {
  projectsByStatus: Array<{ status: string; count: number }>
  progressDistribution: Array<{ range: string; count: number }>
  reportsByMonth: Array<{ month: string; count: number }>
  topProjects: Array<{ name: string; progress: number; status: string }>
  indicatorsByType: Array<{ type: string; count: number }>
  totalProjects: number
  totalReports: number
  totalIndicators: number
}

interface ProjectsData {
  projectsByMonth: Array<{ month: string; count: number }>
  teamSizeDistribution: Array<{ size: string; count: number }>
}

interface ReportsData {
  reportsByStatus: Array<{ status: string; count: number }>
  reportsByMonth: Array<{ month: string; count: number }>
  reportsByProject: Array<{ project: string; count: number }>
}

const COLORS = {
  primary: '#D4A017', // Gold
  secondary: '#C41E3A', // Crimson Red
  accent: '#525252', // Slate Gray
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
}

const CHART_COLORS = [
  '#D4A017', // Gold
  '#C41E3A', // Crimson Red
  '#525252', // Slate Gray
  '#10b981', // Green
  '#3b82f6', // Blue
  '#f59e0b', // Orange
  '#8b5cf6', // Purple
  '#ec4899', // Pink
]

export default function VisualizationPage() {
  const router = useRouter()
  const { sidebarCollapsed, chatCollapsed } = useLayout()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'reports'>('overview')
  const [vizData, setVizData] = useState<VisualizationData | null>(null)
  const [projectsData, setProjectsData] = useState<ProjectsData | null>(null)
  const [reportsData, setReportsData] = useState<ReportsData | null>(null)
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchProjects()
    fetchAllData()
  }, [router])

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects')
      setProjects(response.data)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching visualization data...')
      
      const [viz, projects, reports] = await Promise.all([
        api.get('/dashboard/visualization').catch(err => {
          console.error('Error fetching visualization:', err.response?.status, err.response?.data)
          throw err
        }),
        api.get('/dashboard/visualization/projects').catch(err => {
          console.error('Error fetching projects data:', err.response?.status, err.response?.data)
          throw err
        }),
        api.get('/dashboard/visualization/reports').catch(err => {
          console.error('Error fetching reports data:', err.response?.status, err.response?.data)
          throw err
        }),
      ])
      
      console.log('Visualization data received:', { viz: viz.data, projects: projects.data, reports: reports.data })
      
      setVizData(viz.data)
      setProjectsData(projects.data)
      setReportsData(reports.data)
    } catch (err: any) {
      console.error('Failed to fetch visualization data:', err)
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        url: err.config?.url,
      })
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load visualization data'
      setError(`${errorMessage} (Status: ${err.response?.status || 'Unknown'})`)
      // Set empty data structures to prevent crashes
      setVizData({
        projectsByStatus: [],
        progressDistribution: [],
        reportsByMonth: [],
        topProjects: [],
        indicatorsByType: [],
        totalProjects: 0,
        totalReports: 0,
        totalIndicators: 0,
      })
      setProjectsData({
        projectsByMonth: [],
        teamSizeDistribution: [],
      })
      setReportsData({
        reportsByStatus: [],
        reportsByMonth: [],
        reportsByProject: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-')
    const date = new Date(parseInt(year), parseInt(monthNum) - 1)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300",
          sidebarCollapsed ? "ml-20" : "ml-64",
          chatCollapsed ? "mr-12" : "mr-80"
        )}>
          <Header title="Visualization" />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading visualization data...</p>
            </div>
          </div>
        </div>
        <TeamChat />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        sidebarCollapsed ? "ml-20" : "ml-64",
        chatCollapsed ? "mr-12" : "mr-80"
      )}>
        <Header title="Data Visualization & Analytics" />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Project Selector */}
            <div className="mb-6 bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Project-Specific Visualization</h3>
                  <p className="text-sm text-muted-foreground">Select a project to view and customize its charts</p>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        router.push(`/visualization/${e.target.value}`)
                      }
                    }}
                    className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a project...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6 border-b border-border">
              <button
                onClick={() => setActiveTab('overview')}
                className={cn(
                  "px-4 py-2 font-medium transition-colors border-b-2",
                  activeTab === 'overview'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Overview</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={cn(
                  "px-4 py-2 font-medium transition-colors border-b-2",
                  activeTab === 'projects'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Projects</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={cn(
                  "px-4 py-2 font-medium transition-colors border-b-2",
                  activeTab === 'reports'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <span>Reports</span>
                </div>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
                <p className="text-destructive font-medium">Error loading data</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <button
                  onClick={fetchAllData}
                  className="mt-3 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && vizData && vizData.totalProjects === 0 && (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Data Available</h3>
                <p className="text-muted-foreground mb-6">
                  Start by creating projects and submitting reports to see visualizations.
                </p>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && vizData && vizData.totalProjects > 0 && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Projects</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{vizData.totalProjects}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Reports</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{vizData.totalReports}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Activity className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Indicators</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{vizData.totalIndicators}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                        <PieChartIcon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Projects by Status - Pie Chart */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Projects by Status</h3>
                    {vizData.projectsByStatus.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={vizData.projectsByStatus}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {vizData.projectsByStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No project status data available
                      </div>
                    )}
                  </div>

                  {/* Progress Distribution - Bar Chart */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Progress Distribution</h3>
                    {vizData.progressDistribution.some(d => d.count > 0) ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={vizData.progressDistribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
                          <XAxis dataKey="range" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                            }}
                          />
                          <Bar dataKey="count" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No progress data available
                      </div>
                    )}
                  </div>

                  {/* Reports Over Time - Area Chart */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Reports Over Time</h3>
                    {vizData.reportsByMonth.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart
                          data={vizData.reportsByMonth.map(item => ({
                            ...item,
                            month: formatMonth(item.month),
                          }))}
                        >
                          <defs>
                            <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
                          <XAxis dataKey="month" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke={COLORS.primary}
                            fillOpacity={1}
                            fill="url(#colorReports)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No reports data available
                      </div>
                    )}
                  </div>

                  {/* Indicators by Type - Radar Chart */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Indicators by Type</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={vizData.indicatorsByType}>
                        <PolarGrid stroke="#525252" opacity={0.2} />
                        <PolarAngleAxis dataKey="type" stroke="#888" />
                        <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} stroke="#888" />
                        <Radar
                          name="Indicators"
                          dataKey="count"
                          stroke={COLORS.primary}
                          fill={COLORS.primary}
                          fillOpacity={0.6}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Projects - Bar Chart */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Top Projects by Progress</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={vizData.topProjects} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
                      <XAxis type="number" domain={[0, 100]} stroke="#888" />
                      <YAxis dataKey="name" type="category" width={150} stroke="#888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Progress']}
                      />
                      <Bar dataKey="progress" fill={COLORS.primary} radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && projectsData && projectsData.projectsByMonth.length > 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Projects Created Over Time */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Projects Created Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={projectsData.projectsByMonth.map(item => ({
                          ...item,
                          month: formatMonth(item.month),
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
                        <XAxis dataKey="month" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke={COLORS.primary}
                          strokeWidth={3}
                          dot={{ fill: COLORS.primary, r: 5 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Team Size Distribution */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Team Size Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={projectsData.teamSizeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ size, percent }) => `${size} members: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {projectsData.teamSizeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && reportsData && reportsData.reportsByStatus.length > 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Reports by Status */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Reports by Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reportsData.reportsByStatus}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
                        <XAxis dataKey="status" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Bar dataKey="count" fill={COLORS.secondary} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Reports Over Time */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Reports Submitted Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart
                        data={reportsData.reportsByMonth.map(item => ({
                          ...item,
                          month: formatMonth(item.month),
                        }))}
                      >
                        <defs>
                          <linearGradient id="colorReportsTime" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
                        <XAxis dataKey="month" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke={COLORS.secondary}
                          fillOpacity={1}
                          fill="url(#colorReportsTime)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Projects by Reports */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Top Projects by Report Count</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={reportsData.reportsByProject} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
                      <XAxis type="number" stroke="#888" />
                      <YAxis dataKey="project" type="category" width={200} stroke="#888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="count" fill={COLORS.secondary} radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <TeamChat />
    </div>
  )
}

