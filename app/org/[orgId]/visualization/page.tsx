'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
} from 'recharts'
import { Loader2, BarChart3, ArrowRight } from 'lucide-react'
import { orgApi } from '@/lib/api-helpers'
import { Project } from '@/lib/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
  const params = useParams()
  const orgId = params.orgId as string
  const { sidebarCollapsed, chatCollapsed } = useLayout()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'reports'>('overview')
  const [vizData, setVizData] = useState<VisualizationData | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (!orgId) {
      console.error('Organization ID not found in route')
      return
    }

    fetchAllData()
    fetchProjects()
  }, [router, orgId])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await orgApi.get(orgId, 'dashboard/visualization')
      setVizData(response.data)
    } catch (err: any) {
      console.error('Failed to fetch visualization data:', err)
      setError(err.response?.data?.message || 'Failed to load visualization data')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true)
      const response = await orgApi.get(orgId, 'projects')
      setProjects(response.data)
    } catch (err: any) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoadingProjects(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar orgId={orgId} />
      
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        sidebarCollapsed ? "ml-20" : "ml-64",
        chatCollapsed ? "mr-12" : "mr-80"
      )}>
        <Header title="Visualization" />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">Data Visualization</h1>
              <p className="text-muted-foreground">Visualize your project data and insights</p>
            </div>

            {/* Project Selection Section */}
            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Create Project Charts</h2>
                  <p className="text-sm text-muted-foreground">
                    Select a project to create custom charts and visualizations
                  </p>
                </div>
              </div>
              
              {loadingProjects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No projects available</p>
                  <Link href={`/org/${orgId}/projects/new`}>
                    <Button className="bg-gold-500 hover:bg-gold-600 text-charcoal-900">
                      Create Your First Project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/org/${orgId}/visualization/${project.id}`}
                      className="bg-background border border-border rounded-lg p-4 hover:shadow-lg transition-shadow hover:border-gold-500/50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">{project.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {project.description || 'No description'}
                          </p>
                        </div>
                        <BarChart3 className="w-5 h-5 text-gold-500 flex-shrink-0 ml-2" />
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="text-sm text-muted-foreground">
                          Progress: <span className="font-medium text-foreground">{Math.round(project.progress)}%</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gold-500" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Overview Charts */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Overview Statistics</h2>
            </div>

            {vizData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vizData.projectsByStatus && (
                  <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Projects by Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={vizData.projectsByStatus}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {vizData.projectsByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {vizData.reportsByMonth && (
                  <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Reports by Month</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={vizData.reportsByMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill={CHART_COLORS[0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <TeamChat orgId={orgId} />
    </div>
  )
}

