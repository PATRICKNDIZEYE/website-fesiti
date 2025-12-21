'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  ComposedChart,
  ScatterChart,
  Scatter,
} from 'recharts'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  ArrowLeft, 
  Palette,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Target,
  Activity,
  CheckCircle2,
  Clock,
  Share2,
  Copy,
  Check,
  GripVertical,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react'
import api from '@/lib/api'
import { Project } from '@/lib/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Chart {
  id: string
  title: string
  chartType: 'indicator-progress' | 'progress-summary' | 'target-vs-actual' | 'reports-timeline' | 'indicator-performance' | 'progress-trend' | 'completion-status' | 'monthly-comparison'
  displayType: 'bar' | 'line' | 'area' | 'pie' | 'composed' | 'scatter'
  indicatorId?: string // For indicator-specific charts
  color: string
  targetColor?: string // Separate color for targets
  width?: number // Chart width in grid units (1-12)
  height?: number // Chart height in pixels
  order?: number // Display order for drag and drop
}

const CHART_COLORS = [
  '#D4A017', '#C41E3A', '#525252', '#10b981',
  '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899',
]

const TARGET_COLOR = '#ef4444' // Red for targets
const PROGRESS_COLOR = '#10b981' // Green for actual progress

const CHART_TYPES = [
  { value: 'indicator-progress', label: 'Indicator Progress Over Time', description: 'Track target vs actual progress over time', icon: TrendingUp },
  { value: 'progress-summary', label: 'Project Progress Summary', description: 'Overall progress breakdown by indicator', icon: BarChart3 },
  { value: 'target-vs-actual', label: 'Target vs Actual Comparison', description: 'Compare latest targets with current achievements', icon: Target },
  { value: 'reports-timeline', label: 'Reports Timeline', description: 'Visualize when reports were submitted', icon: Calendar },
  { value: 'indicator-performance', label: 'Indicator Performance Status', description: 'See which indicators are on track, behind, or ahead', icon: Activity },
  { value: 'progress-trend', label: 'Progress Trend Analysis', description: 'Analyze progress trends over multiple periods', icon: TrendingUp },
  { value: 'completion-status', label: 'Completion Status Overview', description: 'Visualize completion status across all indicators', icon: CheckCircle2 },
  { value: 'monthly-comparison', label: 'Monthly Progress Comparison', description: 'Compare progress across different months', icon: Clock },
]

const DISPLAY_TYPES = [
  { value: 'bar', label: 'Bar Chart', description: 'Best for comparing values' },
  { value: 'line', label: 'Line Chart', description: 'Best for trends over time' },
  { value: 'area', label: 'Area Chart', description: 'Best for cumulative data' },
  { value: 'pie', label: 'Pie Chart', description: 'Best for proportions' },
  { value: 'composed', label: 'Composed Chart', description: 'Combines bars and lines' },
  { value: 'scatter', label: 'Scatter Plot', description: 'Best for correlations' },
]

export default function ProjectVisualizationPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string
  const { sidebarCollapsed, chatCollapsed } = useLayout()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [charts, setCharts] = useState<Chart[]>([])
  const [chartData, setChartData] = useState<Record<string, any>>({})
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingChart, setEditingChart] = useState<Chart | null>(null)
  const [indicators, setIndicators] = useState<any[]>([])
  const [linkCopied, setLinkCopied] = useState(false)
  const [resizingChart, setResizingChart] = useState<string | null>(null)
  const [shareLinks, setShareLinks] = useState<Array<{ shareId: string; shareUrl: string; createdAt: string }>>([])
  const [showShareLinks, setShowShareLinks] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (projectId) {
      fetchProject()
      loadCharts().catch(console.error)
      fetchShareLinks().catch(console.error)
    }
  }, [projectId, router])

  useEffect(() => {
    if (project && charts.length > 0) {
      fetchAllChartData()
    }
  }, [project, charts])

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`)
      setProject(response.data)
      setIndicators(response.data.indicators || [])
    } catch (error) {
      console.error('Failed to fetch project:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCharts = async () => {
    if (typeof window === 'undefined') return
    
    // Check if this is a shared link (URL contains /share/)
    const pathParts = window.location.pathname.split('/')
    const shareIndex = pathParts.indexOf('share')
    
    if (shareIndex !== -1 && pathParts[shareIndex + 1]) {
      const shareId = pathParts[shareIndex + 1]
      try {
        // Fetch shared configuration from backend (public endpoint)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/dashboard/share/${shareId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.config && data.config.charts && Array.isArray(data.config.charts)) {
            const chartsWithDefaults = data.config.charts.map((chart: Chart, index: number) => ({
              ...chart,
              order: chart.order ?? index,
              width: chart.width ?? 6,
              height: chart.height ?? 400,
            }))
            setCharts(chartsWithDefaults.sort((a: Chart, b: Chart) => (a.order ?? 0) - (b.order ?? 0)))
            return
          }
        }
      } catch (e) {
        console.error('Failed to load shared config:', e)
      }
    }
    
    // Check URL params for legacy shared configuration
    const searchParams = new URLSearchParams(window.location.search)
    const sharedConfig = searchParams.get('config')
    
    if (sharedConfig) {
      try {
        const decoded = decodeURIComponent(sharedConfig)
        const config = JSON.parse(decoded)
        if (config.charts && Array.isArray(config.charts)) {
          const chartsWithDefaults = config.charts.map((chart: Chart, index: number) => ({
            ...chart,
            order: chart.order ?? index,
            width: chart.width ?? 6,
            height: chart.height ?? 400,
          }))
          setCharts(chartsWithDefaults.sort((a: Chart, b: Chart) => (a.order ?? 0) - (b.order ?? 0)))
          return
        }
      } catch (e) {
        console.error('Failed to parse shared config:', e)
      }
    }
    
    // Fallback to localStorage
    const saved = localStorage.getItem(`charts_${projectId}`)
    if (saved) {
      try {
        const parsedCharts = JSON.parse(saved)
        const chartsWithDefaults = parsedCharts.map((chart: Chart, index: number) => ({
          ...chart,
          order: chart.order ?? index,
          width: chart.width ?? 6,
          height: chart.height ?? 400,
        }))
        setCharts(chartsWithDefaults.sort((a: Chart, b: Chart) => (a.order ?? 0) - (b.order ?? 0)))
      } catch (e) {
        console.error('Failed to load charts:', e)
      }
    }
  }

  const saveCharts = (newCharts: Chart[]) => {
    // Ensure all charts have order, width, height before saving
    const chartsWithDefaults = newCharts.map((chart, index) => ({
      ...chart,
      order: chart.order ?? index,
      width: chart.width ?? 6,
      height: chart.height ?? 400,
    }))
    setCharts(chartsWithDefaults)
    localStorage.setItem(`charts_${projectId}`, JSON.stringify(chartsWithDefaults))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const oldIndex = charts.findIndex((item) => item.id === active.id)
      const newIndex = charts.findIndex((item) => item.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newCharts = arrayMove(charts, oldIndex, newIndex)
        // Update order property
        const reorderedCharts = newCharts.map((chart, index) => ({
          ...chart,
          order: index,
        }))
        saveCharts(reorderedCharts)
      }
    }
  }

  const updateChartSize = (chartId: string, width: number, height: number) => {
    setCharts((prevCharts) => {
      const updated = prevCharts.map((chart) =>
        chart.id === chartId
          ? { ...chart, width: Math.max(3, Math.min(12, width)), height: Math.max(300, Math.min(800, height)) }
          : chart
      )
      saveCharts(updated)
      return updated
    })
  }

  const generateShareLink = async () => {
    try {
      const config = {
        charts: charts.map(({ id, title, chartType, displayType, indicatorId, color, targetColor, width, height, order }) => ({
          id,
          title,
          chartType,
          displayType,
          indicatorId,
          color,
          targetColor,
          width,
          height,
          order,
        })),
      }
      
      // Create share link via backend
      const response = await api.post(`/dashboard/projects/${projectId}/share`, { config })
      return response.data.shareUrl
    } catch (error) {
      console.error('Failed to generate share link:', error)
      throw error
    }
  }

  const fetchShareLinks = async () => {
    try {
      const response = await api.get(`/dashboard/projects/${projectId}/share`)
      setShareLinks(response.data || [])
    } catch (error) {
      console.error('Failed to fetch share links:', error)
    }
  }

  const copyShareLink = async () => {
    try {
      const link = await generateShareLink()
      await navigator.clipboard.writeText(link)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
      // Refresh share links list and show the panel
      await fetchShareLinks()
      setShowShareLinks(true) // Auto-open the share links panel to show the new link
    } catch (error) {
      console.error('Failed to copy link:', error)
      alert('Failed to generate share link. Please try again.')
    }
  }

  const deleteShareLink = async (shareId: string) => {
    if (!confirm('Are you sure you want to delete this share link?')) return
    
    try {
      await api.delete(`/dashboard/share/${shareId}`)
      await fetchShareLinks()
    } catch (error) {
      console.error('Failed to delete share link:', error)
      alert('Failed to delete share link. Please try again.')
    }
  }

  const fetchAllChartData = async () => {
    for (const chart of charts) {
      await fetchChartData(chart)
    }
  }

  const fetchChartData = async (chart: Chart) => {
    try {
      let data: any
      
      switch (chart.chartType) {
        case 'indicator-progress':
          if (chart.indicatorId) {
            const response = await api.get(
              `/dashboard/projects/${projectId}/indicators/${chart.indicatorId}/progress`
            )
            data = response.data
          }
          break
        case 'progress-summary':
        case 'indicator-performance':
        case 'progress-trend':
        case 'completion-status':
          const summaryResponse = await api.get(
            `/dashboard/projects/${projectId}/progress-summary`
          )
          data = summaryResponse.data
          break
        case 'target-vs-actual':
          const comparisonResponse = await api.get(
            `/dashboard/projects/${projectId}/target-vs-actual`
          )
          data = comparisonResponse.data
          break
        case 'reports-timeline':
        case 'monthly-comparison':
          const timelineResponse = await api.get(
            `/dashboard/projects/${projectId}/reports-timeline${chart.indicatorId ? `?indicatorId=${chart.indicatorId}` : ''}`
          )
          data = timelineResponse.data
          break
      }
      
      setChartData(prev => ({ ...prev, [chart.id]: data }))
    } catch (error) {
      console.error(`Failed to fetch data for chart ${chart.id}:`, error)
    }
  }

  const addChart = (chart: Chart) => {
    const newChart = { 
      ...chart, 
      id: Date.now().toString(),
      order: charts.length,
      width: chart.width ?? 6,
      height: chart.height ?? 400,
    }
    saveCharts([...charts, newChart])
    fetchChartData(newChart)
    setShowAddDialog(false)
  }

  const updateChart = (updatedChart: Chart) => {
    const newCharts = charts.map(chart => 
      chart.id === updatedChart.id ? updatedChart : chart
    )
    saveCharts(newCharts)
    // Clear old chart data to force re-render with new style
    setChartData(prev => {
      const newData = { ...prev }
      delete newData[updatedChart.id]
      return newData
    })
    // Re-fetch chart data with updated configuration
    fetchChartData(updatedChart)
    setEditingChart(null)
  }

  const deleteChart = (id: string) => {
    if (confirm('Are you sure you want to delete this chart?')) {
      saveCharts(charts.filter(chart => chart.id !== id))
      const newData = { ...chartData }
      delete newData[id]
      setChartData(newData)
    }
  }

  const renderChart = (chart: Chart) => {
    const data = chartData[chart.id]
    if (!data) {
      return (
        <div className="flex items-center justify-center text-muted-foreground border border-border rounded-lg bg-muted/20" style={{ height: chart.height || 400 }}>
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )
    }

    const commonProps = { width: '100%', height: chart.height || 400 }

    switch (chart.chartType) {
      case 'indicator-progress':
        return renderIndicatorProgress(data, chart)
      case 'progress-summary':
        return renderProgressSummary(data, chart)
      case 'target-vs-actual':
        return renderTargetVsActual(data, chart)
      case 'reports-timeline':
        return renderReportsTimeline(data, chart)
      case 'indicator-performance':
        return renderIndicatorPerformance(data, chart)
      case 'progress-trend':
        return renderProgressTrend(data, chart)
      case 'completion-status':
        return renderCompletionStatus(data, chart)
      case 'monthly-comparison':
        return renderMonthlyComparison(data, chart)
      default:
        return <div className="text-muted-foreground text-center py-8">Chart type not implemented yet</div>
    }
  }

  const renderIndicatorProgress = (data: any, chart: Chart) => {
    // Combine targets and reports for line/area charts
    const combinedData: any[] = []
    const targetMap = new Map(data.targets.map((t: any) => [t.date, t.value]))
    const reportMap = new Map(data.reports.map((r: any) => [r.date, r.value]))
    const allDates = new Set([...data.targets.map((t: any) => t.date), ...data.reports.map((r: any) => r.date)])
    
    Array.from(allDates).sort().forEach(date => {
      combinedData.push({
        date: new Date(date).toLocaleDateString(),
        target: targetMap.get(date) || null,
        actual: reportMap.get(date) || null,
      })
    })

    const commonProps = { width: '100%', height: chart.height || 400 }
    const targetColor = chart.targetColor || TARGET_COLOR
    const progressColor = chart.color || PROGRESS_COLOR

    if (chart.displayType === 'line' || chart.displayType === 'area') {
      const ChartComponent = chart.displayType === 'line' ? LineChart : AreaChart
      const DataComponent = chart.displayType === 'line' ? Line : Area
      
      return (
        <div>
          <div className="mb-4 flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full border-2 border-dashed" style={{ borderColor: targetColor }}></div>
              <span className="text-muted-foreground">Target</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: progressColor }}></div>
              <span className="text-muted-foreground">Actual Progress</span>
            </div>
          </div>
          <ResponsiveContainer {...commonProps}>
            <ChartComponent data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <DataComponent 
                type="monotone" 
                dataKey="target" 
                stroke={targetColor} 
                strokeWidth={2}
                strokeDasharray="8 4" 
                name="Target" 
                dot={{ fill: targetColor, r: 4 }}
              />
              <DataComponent 
                type="monotone" 
                dataKey="actual" 
                stroke={progressColor} 
                strokeWidth={3}
                fill={progressColor} 
                fillOpacity={0.3} 
                name="Actual Progress"
                dot={{ fill: progressColor, r: 5 }}
              />
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      )
    }

    // Bar chart with distinct colors
    return (
      <div>
        <div className="mb-4 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-8 rounded" style={{ backgroundColor: targetColor, opacity: 0.7 }}></div>
            <span className="text-muted-foreground">Target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-8 rounded" style={{ backgroundColor: progressColor }}></div>
            <span className="text-muted-foreground">Actual Progress</span>
          </div>
        </div>
        <ResponsiveContainer {...commonProps}>
          <BarChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="date" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Bar dataKey="target" fill={targetColor} fillOpacity={0.6} name="Target" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" fill={progressColor} name="Actual Progress" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderProgressSummary = (data: any, chart: Chart) => {
    const chartData = data.indicators.map((ind: any) => ({
      name: ind.name.length > 20 ? ind.name.substring(0, 20) + '...' : ind.name,
      fullName: ind.name,
      progress: Math.round(ind.progress),
      status: ind.status,
      target: ind.targetValue,
      current: ind.currentValue,
    }))

    const commonProps = { width: '100%', height: chart.height || 400 }

    if (chart.displayType === 'pie') {
      return (
        <ResponsiveContainer {...commonProps}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, progress }) => `${name}: ${progress}%`}
              outerRadius={Math.min(120, (chart.height || 400) / 3)}
              dataKey="progress"
            >
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    if (chart.displayType === 'line' || chart.displayType === 'area') {
      const ChartComponent = chart.displayType === 'line' ? LineChart : AreaChart
      const DataComponent = chart.displayType === 'line' ? Line : Area
      
      return (
        <ResponsiveContainer {...commonProps}>
          <ChartComponent data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#888" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: any) => [`${value}%`, 'Progress']}
            />
            <Legend />
            <DataComponent type="monotone" dataKey="progress" stroke={chart.color} fill={chart.color} fillOpacity={0.6} />
          </ChartComponent>
        </ResponsiveContainer>
      )
    }

    if (chart.displayType === 'composed') {
      return (
        <ResponsiveContainer {...commonProps}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#888" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Bar dataKey="progress" fill={chart.color} radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="progress" stroke={chart.color} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      )
    }

    if (chart.displayType === 'scatter') {
      return (
        <ResponsiveContainer {...commonProps}>
          <ScatterChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#888" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Scatter dataKey="progress" fill={chart.color} />
          </ScatterChart>
        </ResponsiveContainer>
      )
    }

    // Default: Bar chart
    return (
      <div>
        <div className="mb-4 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-8 rounded" style={{ backgroundColor: chart.color }}></div>
            <span className="text-muted-foreground">Progress %</span>
          </div>
        </div>
        <ResponsiveContainer {...commonProps}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis 
              dataKey="name" 
              stroke="#888"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#888" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: any) => [`${value}%`, 'Progress']}
              labelFormatter={(label) => {
                const item = chartData.find(d => d.name === label)
                return item?.fullName || label
              }}
            />
            <Legend />
            <Bar dataKey="progress" fill={chart.color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderTargetVsActual = (data: any, chart: Chart) => {
    const chartData = data.comparison.map((comp: any) => ({
      name: comp.indicatorName.length > 20 ? comp.indicatorName.substring(0, 20) + '...' : comp.indicatorName,
      fullName: comp.indicatorName,
      target: comp.target,
      actual: comp.actual,
      difference: comp.difference,
      percentage: Math.round(comp.percentage),
    }))

    const commonProps = { width: '100%', height: chart.height || 400 }
    const targetColor = chart.targetColor || TARGET_COLOR
    const progressColor = chart.color || PROGRESS_COLOR

    if (chart.displayType === 'composed') {
      return (
        <div>
          <div className="mb-4 flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-8 rounded" style={{ backgroundColor: targetColor, opacity: 0.7 }}></div>
              <span className="text-muted-foreground">Target</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-8 rounded" style={{ backgroundColor: progressColor }}></div>
              <span className="text-muted-foreground">Actual Progress</span>
            </div>
          </div>
          <ResponsiveContainer {...commonProps}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
              <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Bar dataKey="target" fill={targetColor} fillOpacity={0.7} name="Target" />
              <Line type="monotone" dataKey="actual" stroke={progressColor} strokeWidth={2} name="Actual Progress" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )
    }

    // Default: Bar chart
    return (
      <div>
        <div className="mb-4 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-8 rounded" style={{ backgroundColor: targetColor, opacity: 0.7 }}></div>
            <span className="text-muted-foreground">Target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-8 rounded" style={{ backgroundColor: progressColor }}></div>
            <span className="text-muted-foreground">Actual Progress</span>
          </div>
        </div>
        <ResponsiveContainer {...commonProps}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis 
              dataKey="name" 
              stroke="#888"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: any, name: string, props: any) => {
                if (name === 'Target' || name === 'Actual Progress') {
                  return [value, name]
                }
                return value
              }}
              labelFormatter={(label) => {
                const item = chartData.find(d => d.name === label)
                return item?.fullName || label
              }}
            />
            <Legend />
            <Bar dataKey="target" fill={targetColor} fillOpacity={0.7} name="Target" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" fill={progressColor} name="Actual Progress" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderReportsTimeline = (data: any, chart: Chart) => {
    const chartData = data.timeline.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString(),
      value: item.value,
      indicator: item.indicatorName,
    }))

    const commonProps = { width: '100%', height: chart.height || 400 }

    if (chart.displayType === 'line' || chart.displayType === 'area') {
      const ChartComponent = chart.displayType === 'line' ? LineChart : AreaChart
      const DataComponent = chart.displayType === 'line' ? Line : Area
      
      return (
        <ResponsiveContainer {...commonProps}>
          <ChartComponent data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="date" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <DataComponent type="monotone" dataKey="value" stroke={chart.color} fill={chart.color} fillOpacity={0.6} />
          </ChartComponent>
        </ResponsiveContainer>
      )
    }

    if (chart.displayType === 'scatter') {
      return (
        <ResponsiveContainer {...commonProps}>
          <ScatterChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="date" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Scatter dataKey="value" fill={chart.color} />
          </ScatterChart>
        </ResponsiveContainer>
      )
    }

    if (chart.displayType === 'composed') {
      return (
        <ResponsiveContainer {...commonProps}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="date" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Bar dataKey="value" fill={chart.color} fillOpacity={0.6} />
            <Line type="monotone" dataKey="value" stroke={chart.color} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      )
    }

    // Default: Bar chart
    return (
      <ResponsiveContainer {...commonProps}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
          <XAxis dataKey="date" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend />
          <Bar dataKey="value" fill={chart.color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const renderIndicatorPerformance = (data: any, chart: Chart) => {
    const chartData = data.indicators.map((ind: any) => {
      let status = 'on_track'
      if (ind.progress < 50) status = 'behind'
      else if (ind.progress >= 100) status = 'completed'
      else if (ind.progress >= 75) status = 'on_track'
      else status = 'at_risk'
      
      return {
        name: ind.name.length > 15 ? ind.name.substring(0, 15) + '...' : ind.name,
        fullName: ind.name,
        progress: Math.round(ind.progress),
        status,
      }
    })

    const statusColors: Record<string, string> = {
      completed: '#10b981',
      on_track: '#3b82f6',
      at_risk: '#f59e0b',
      behind: '#ef4444',
    }

    const commonProps = { width: '100%', height: chart.height || 400 }

    if (chart.displayType === 'pie') {
      return (
        <ResponsiveContainer {...commonProps}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, progress }) => `${name}: ${progress}%`}
              outerRadius={Math.min(120, (chart.height || 400) / 3)}
              dataKey="progress"
            >
              {chartData.map((entry: any) => (
                <Cell key={`cell-${entry.name}`} fill={statusColors[entry.status] || chart.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    if (chart.displayType === 'line' || chart.displayType === 'area') {
      const ChartComponent = chart.displayType === 'line' ? LineChart : AreaChart
      const DataComponent = chart.displayType === 'line' ? Line : Area
      
      return (
        <ResponsiveContainer {...commonProps}>
          <ChartComponent data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#888" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <DataComponent type="monotone" dataKey="progress" stroke={chart.color} fill={chart.color} fillOpacity={0.6} />
          </ChartComponent>
        </ResponsiveContainer>
      )
    }

    if (chart.displayType === 'composed') {
      return (
        <ResponsiveContainer {...commonProps}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#888" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={statusColors[entry.status] || chart.color} />
              ))}
            </Bar>
            <Line type="monotone" dataKey="progress" stroke={chart.color} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      )
    }

    if (chart.displayType === 'scatter') {
      return (
        <ResponsiveContainer {...commonProps}>
          <ScatterChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#888" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Scatter dataKey="progress" fill={chart.color} />
          </ScatterChart>
        </ResponsiveContainer>
      )
    }

    // Default: Bar chart
    return (
      <ResponsiveContainer {...commonProps}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
          <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend />
          <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
            {chartData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={statusColors[entry.status] || chart.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const renderProgressTrend = (data: any, chart: Chart) => {
    // Use progress summary data but show trend over time
    const chartData = data.indicators.map((ind: any) => ({
      name: ind.name.length > 15 ? ind.name.substring(0, 15) + '...' : ind.name,
      fullName: ind.name,
      progress: Math.round(ind.progress),
    }))

    const commonProps = { width: '100%', height: chart.height || 400 }

    if (chart.displayType === 'line' || chart.displayType === 'area') {
      const ChartComponent = chart.displayType === 'line' ? LineChart : AreaChart
      const DataComponent = chart.displayType === 'line' ? Line : Area
      
      return (
        <ResponsiveContainer {...commonProps}>
          <ChartComponent data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#888" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <DataComponent type="monotone" dataKey="progress" stroke={chart.color} fill={chart.color} fillOpacity={0.6} />
          </ChartComponent>
        </ResponsiveContainer>
      )
    }

    if (chart.displayType === 'bar') {
      return (
        <ResponsiveContainer {...commonProps}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#888" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Bar dataKey="progress" fill={chart.color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    if (chart.displayType === 'composed') {
      return (
        <ResponsiveContainer {...commonProps}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#888" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Bar dataKey="progress" fill={chart.color} fillOpacity={0.6} radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="progress" stroke={chart.color} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      )
    }

    if (chart.displayType === 'scatter') {
      return (
        <ResponsiveContainer {...commonProps}>
          <ScatterChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#888" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Scatter dataKey="progress" fill={chart.color} />
          </ScatterChart>
        </ResponsiveContainer>
      )
    }

    // Default: Area chart
    return (
      <ResponsiveContainer {...commonProps}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
          <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
          <YAxis stroke="#888" domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend />
          <Area type="monotone" dataKey="progress" stroke={chart.color} fill={chart.color} fillOpacity={0.6} />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  const renderCompletionStatus = (data: any, chart: Chart) => {
    const statusCounts = data.indicators.reduce((acc: any, ind: any) => {
      let status = 'on_track'
      if (ind.progress < 50) status = 'behind'
      else if (ind.progress >= 100) status = 'completed'
      else if (ind.progress >= 75) status = 'on_track'
      else status = 'at_risk'
      
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    const chartData = [
      { name: 'Completed', value: statusCounts.completed || 0, color: '#10b981' },
      { name: 'On Track', value: statusCounts.on_track || 0, color: '#3b82f6' },
      { name: 'At Risk', value: statusCounts.at_risk || 0, color: '#f59e0b' },
      { name: 'Behind', value: statusCounts.behind || 0, color: '#ef4444' },
    ].filter(item => item.value > 0)

    const commonProps = { width: '100%', height: chart.height || 400 }

    if (chart.displayType === 'pie') {
      return (
        <ResponsiveContainer {...commonProps}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={Math.min(120, (chart.height || 400) / 3)}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    if (chart.displayType === 'bar') {
      return (
        <ResponsiveContainer {...commonProps}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="name" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )
    }

    // Default: Pie chart (best for status distribution)
    return (
      <ResponsiveContainer {...commonProps}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={Math.min(120, (chart.height || 400) / 3)}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  const renderMonthlyComparison = (data: any, chart: Chart) => {
    // Group reports by month
    const monthlyData: Record<string, number[]> = {}
    
    if (data.timeline) {
      data.timeline.forEach((item: any) => {
        const month = new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        if (!monthlyData[month]) {
          monthlyData[month] = []
        }
        if (item.value !== null) {
          monthlyData[month].push(item.value)
        }
      })
    }

    const chartData = Object.entries(monthlyData).map(([month, values]) => ({
      month,
      average: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      total: values.reduce((a, b) => a + b, 0),
      count: values.length,
    })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

    const commonProps = { width: '100%', height: chart.height || 400 }

    if (chart.displayType === 'line' || chart.displayType === 'area') {
      const ChartComponent = chart.displayType === 'line' ? LineChart : AreaChart
      const DataComponent = chart.displayType === 'line' ? Line : Area
      
      return (
        <ResponsiveContainer {...commonProps}>
          <ChartComponent data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="month" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <DataComponent type="monotone" dataKey="average" stroke={chart.color} fill={chart.color} fillOpacity={0.6} name="Average Value" />
          </ChartComponent>
        </ResponsiveContainer>
      )
    }

    if (chart.displayType === 'composed') {
      return (
        <ResponsiveContainer {...commonProps}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="month" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Bar dataKey="average" fill={chart.color} fillOpacity={0.6} name="Average Value" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="average" stroke={chart.color} strokeWidth={2} name="Trend" />
          </ComposedChart>
        </ResponsiveContainer>
      )
    }

    if (chart.displayType === 'scatter') {
      return (
        <ResponsiveContainer {...commonProps}>
          <ScatterChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey="month" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Scatter dataKey="average" fill={chart.color} name="Average Value" />
          </ScatterChart>
        </ResponsiveContainer>
      )
    }

    // Default: Bar chart
    return (
      <ResponsiveContainer {...commonProps}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
          <XAxis dataKey="month" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend />
          <Bar dataKey="average" fill={chart.color} name="Average Value" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
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
          <Header title="Project Visualization" />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
        <TeamChat />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300",
          sidebarCollapsed ? "ml-20" : "ml-64",
          chatCollapsed ? "mr-12" : "mr-80"
        )}>
          <Header title="Project Visualization" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground">Project not found</div>
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
        <Header title={`Visualization: ${project.name}`} />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Link
                href="/visualization"
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to All Visualizations</span>
              </Link>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowShareLinks(!showShareLinks)}
                  className="border-border"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Links ({shareLinks.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={copyShareLink}
                  className="border-border"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Share Link
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Chart
                </Button>
              </div>
            </div>

            {showShareLinks && (
              <div className="mb-6 bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Share Links</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowShareLinks(false)}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {shareLinks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No share links created yet</p>
                ) : (
                  <div className="space-y-3">
                    {shareLinks.map((link) => (
                      <div key={link.shareId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono text-foreground truncate">{link.shareUrl}</p>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(link.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(link.shareUrl)
                              setLinkCopied(true)
                              setTimeout(() => setLinkCopied(false), 2000)
                            }}
                            className="h-8 w-8"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteShareLink(link.shareId)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {charts.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <p className="text-muted-foreground mb-4">No charts created yet</p>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Chart
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={charts.map(chart => chart.id)}
                >
                  <div className="grid grid-cols-12 gap-6 auto-rows-min">
                    {charts.map((chart) => (
                      <SortableChartItem
                        key={chart.id}
                        chart={chart}
                        onEdit={() => setEditingChart(chart)}
                        onDelete={() => deleteChart(chart.id)}
                        onResize={(width, height) => updateChartSize(chart.id, width, height)}
                        renderChart={renderChart}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      <TeamChat />

      {/* Add/Edit Chart Sheet */}
      <ChartBuilderSheet
        open={showAddDialog || !!editingChart}
        onClose={() => {
          setShowAddDialog(false)
          setEditingChart(null)
        }}
        onSave={editingChart ? updateChart : addChart}
        chart={editingChart || undefined}
        indicators={indicators}
      />
    </div>
  )
}

interface ChartBuilderSheetProps {
  open: boolean
  onClose: () => void
  onSave: (chart: Chart) => void
  chart?: Chart
  indicators: any[]
}

function ChartBuilderSheet({ open, onClose, onSave, chart, indicators }: ChartBuilderSheetProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [title, setTitle] = useState(chart?.title || '')
  const [chartType, setChartType] = useState<Chart['chartType']>(chart?.chartType || 'progress-summary')
  const [displayType, setDisplayType] = useState<Chart['displayType']>(chart?.displayType || 'bar')
  const [indicatorId, setIndicatorId] = useState(chart?.indicatorId ? chart.indicatorId : '__all__')
  const [color, setColor] = useState(chart?.color || CHART_COLORS[0])
  const [targetColor, setTargetColor] = useState(chart?.targetColor || TARGET_COLOR)

  // Update form state when chart prop changes
  useEffect(() => {
    if (chart) {
      setTitle(chart.title || '')
      setChartType(chart.chartType || 'progress-summary')
      setDisplayType(chart.displayType || 'bar')
      setIndicatorId(chart.indicatorId || '__all__')
      setColor(chart.color || CHART_COLORS[0])
      setTargetColor(chart.targetColor || TARGET_COLOR)
      setActiveTab('basic')
    } else {
      // Reset form when creating new chart
      setTitle('')
      setChartType('progress-summary')
      setDisplayType('bar')
      setIndicatorId('__all__')
      setColor(CHART_COLORS[0])
      setTargetColor(TARGET_COLOR)
      setActiveTab('basic')
    }
  }, [chart])

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a chart title')
      return
    }

    const newChart: Chart = {
      id: chart?.id || Date.now().toString(),
      title: title.trim(),
      chartType,
      displayType,
      indicatorId: (chartType === 'indicator-progress' || chartType === 'reports-timeline') && indicatorId && indicatorId !== '__all__' ? indicatorId : undefined,
      color,
      targetColor,
    }

    onSave(newChart)
  }

  const selectedChartType = CHART_TYPES.find(t => t.value === chartType)

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">
            {chart ? 'Edit Chart' : 'Create New Chart'}
          </SheetTitle>
          <SheetDescription>
            Build powerful visualizations to track your project progress and performance
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Chart Information</CardTitle>
                <CardDescription>Give your chart a meaningful title and select the data source</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Chart Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Project Progress Overview"
                    className="bg-background border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Chart Type *</Label>
                  <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue>
                        {selectedChartType && (() => {
                          const IconComponent = selectedChartType.icon
                          return (
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4 text-primary" />
                              <span>{selectedChartType.label}</span>
                            </div>
                          )
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CHART_TYPES.map((type) => {
                        const IconComponent = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2 py-1">
                              <IconComponent className="w-4 h-4 text-primary" />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {selectedChartType && (() => {
                    const IconComponent = selectedChartType.icon
                    return (
                      <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <IconComponent className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">{selectedChartType.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedChartType.description}
                        </p>
                      </div>
                    )
                  })()}
                </div>

                {(chartType === 'indicator-progress' || chartType === 'reports-timeline') && (
                  <div className="space-y-2">
                    <Label>Indicator (optional)</Label>
                    <Select 
                      value={indicatorId || '__all__'} 
                      onValueChange={(value) => setIndicatorId(value === '__all__' ? '' : value)}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="All indicators" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Indicators</SelectItem>
                        {indicators.map((ind) => (
                          <SelectItem key={ind.id} value={ind.id}>
                            {ind.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visualization" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Visualization Style</CardTitle>
                <CardDescription>Choose how your data should be displayed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Display Type *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {DISPLAY_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setDisplayType(type.value as any)}
                        className={cn(
                          "p-4 border rounded-lg text-left transition-all",
                          displayType === type.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="font-medium text-foreground">{type.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Color Customization</CardTitle>
                <CardDescription>Customize colors to match your brand or preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Progress Color</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-16 h-10 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="#D4A017"
                      className="flex-1 bg-background border-border text-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Color for actual progress data</p>
                </div>

                {(chartType === 'indicator-progress' || chartType === 'target-vs-actual') && (
                  <div className="space-y-2">
                    <Label>Target Color</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={targetColor}
                        onChange={(e) => setTargetColor(e.target.value)}
                        className="w-16 h-10 rounded border border-border cursor-pointer"
                      />
                      <Input
                        value={targetColor}
                        onChange={(e) => setTargetColor(e.target.value)}
                        placeholder="#ef4444"
                        className="flex-1 bg-background border-border text-foreground"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Color for target/goal lines</p>
                  </div>
                )}

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Color Preview</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded" style={{ backgroundColor: color }}></div>
                      <span className="text-xs text-muted-foreground">Progress</span>
                    </div>
                    {(chartType === 'indicator-progress' || chartType === 'target-vs-actual') && (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded border-2 border-dashed" style={{ borderColor: targetColor }}></div>
                        <span className="text-xs text-muted-foreground">Target</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-6 pt-6 border-t border-border">
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {chart ? 'Update Chart' : 'Create Chart'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// Sortable Chart Item Component
interface SortableChartItemProps {
  chart: Chart
  onEdit: () => void
  onDelete: () => void
  onResize: (width: number, height: number) => void
  renderChart: (chart: Chart) => React.ReactNode
}

function SortableChartItem({ chart, onEdit, onDelete, onResize, renderChart }: SortableChartItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chart.id })

  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleMouseDown = (e: React.MouseEvent, corner: 'se' | 'sw' | 'ne' | 'nw') => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: chart.width || 6,
      height: chart.height || 400,
    })
  }

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y
      
      // Calculate grid units (each unit is ~8.33% of 12 columns)
      // Account for container padding and gaps
      const container = document.querySelector('.grid.grid-cols-12')
      if (container) {
        const containerRect = container.getBoundingClientRect()
        const gridUnit = (containerRect.width - (11 * 24)) / 12 // 11 gaps of 24px (gap-6)
        const widthDelta = Math.round(deltaX / gridUnit)
        const newWidth = Math.max(3, Math.min(12, resizeStart.width + widthDelta))
        
        // Height in pixels - allow vertical resizing
        const newHeight = Math.max(300, Math.min(800, resizeStart.height + deltaY))
        
        onResize(newWidth, newHeight)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizeStart, onResize])

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        gridColumn: `span ${chart.width || 6}`,
      }}
      className={cn(
        "bg-card border border-border rounded-lg p-6 relative group",
        isDragging && "z-50"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground ml-6">{chart.title}</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chart Content */}
      <div className="relative">
        {renderChart(chart)}
        
        {/* Resize Handle - Bottom Right */}
        <div
          onMouseDown={(e) => handleMouseDown(e, 'se')}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 hover:bg-primary/40 rounded-tl-lg"
          style={{ marginBottom: '-2px', marginRight: '-2px' }}
        >
          <div className="w-full h-full flex items-end justify-end p-1">
            <div className="w-2 h-2 border-r-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
