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
import { Plus, Trash2, Edit2, Loader2, ArrowLeft, Palette } from 'lucide-react'
import api from '@/lib/api'
import { Project } from '@/lib/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Chart {
  id: string
  title: string
  chartType: 'indicator-progress' | 'progress-summary' | 'target-vs-actual' | 'reports-timeline'
  displayType: 'bar' | 'line' | 'area' | 'pie'
  indicatorId?: string // For indicator-specific charts
  color: string
}

const CHART_COLORS = [
  '#D4A017', '#C41E3A', '#525252', '#10b981',
  '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899',
]

const CHART_TYPES = [
  { value: 'indicator-progress', label: 'Indicator Progress Over Time' },
  { value: 'progress-summary', label: 'Project Progress Summary' },
  { value: 'target-vs-actual', label: 'Target vs Actual Comparison' },
  { value: 'reports-timeline', label: 'Reports Timeline' },
]

const DISPLAY_TYPES = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'area', label: 'Area Chart' },
  { value: 'pie', label: 'Pie Chart' },
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

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (projectId) {
      fetchProject()
      loadCharts()
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

  const loadCharts = () => {
    const saved = localStorage.getItem(`charts_${projectId}`)
    if (saved) {
      try {
        setCharts(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load charts:', e)
      }
    }
  }

  const saveCharts = (newCharts: Chart[]) => {
    setCharts(newCharts)
    localStorage.setItem(`charts_${projectId}`, JSON.stringify(newCharts))
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
    const newChart = { ...chart, id: Date.now().toString() }
    saveCharts([...charts, newChart])
    fetchChartData(newChart)
    setShowAddDialog(false)
  }

  const updateChart = (updatedChart: Chart) => {
    const newCharts = charts.map(chart => 
      chart.id === updatedChart.id ? updatedChart : chart
    )
    saveCharts(newCharts)
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
        <div className="h-[400px] flex items-center justify-center text-muted-foreground border border-border rounded-lg bg-muted/20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )
    }

    const commonProps = { width: '100%', height: 400 }

    switch (chart.chartType) {
      case 'indicator-progress':
        return renderIndicatorProgress(data, chart)
      case 'progress-summary':
        return renderProgressSummary(data, chart)
      case 'target-vs-actual':
        return renderTargetVsActual(data, chart)
      case 'reports-timeline':
        return renderReportsTimeline(data, chart)
      default:
        return <div>Unknown chart type</div>
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

    if (chart.displayType === 'line' || chart.displayType === 'area') {
      const ChartComponent = chart.displayType === 'line' ? LineChart : AreaChart
      const DataComponent = chart.displayType === 'line' ? Line : Area
      
      return (
        <ResponsiveContainer {...commonProps}>
          <ChartComponent data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <DataComponent type="monotone" dataKey="target" stroke={chart.color} strokeDasharray="5 5" name="Target" />
            <DataComponent type="monotone" dataKey="actual" stroke={chart.color} fill={chart.color} fillOpacity={0.6} name="Actual" />
          </ChartComponent>
        </ResponsiveContainer>
      )
    }

    // Bar chart fallback
    return (
      <ResponsiveContainer {...commonProps}>
        <BarChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="target" fill={chart.color} fillOpacity={0.6} name="Target" />
          <Bar dataKey="actual" fill={chart.color} name="Actual" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const renderProgressSummary = (data: any, chart: Chart) => {
    const chartData = data.indicators.map((ind: any) => ({
      name: ind.name,
      progress: Math.round(ind.progress),
      status: ind.status,
    }))

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
              outerRadius={120}
              fill={chart.color}
              dataKey="progress"
            >
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    // Bar chart
    return (
      <ResponsiveContainer {...commonProps}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="progress" fill={chart.color} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const renderTargetVsActual = (data: any, chart: Chart) => {
    const chartData = data.comparison.map((comp: any) => ({
      name: comp.indicatorName,
      target: comp.target,
      actual: comp.actual,
    }))

    return (
      <ResponsiveContainer {...commonProps}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="target" fill={chart.color} fillOpacity={0.6} name="Target" />
          <Bar dataKey="actual" fill={chart.color} name="Actual" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const renderReportsTimeline = (data: any, chart: Chart) => {
    const chartData = data.timeline.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString(),
      value: item.value,
      indicator: item.indicatorName,
    }))

    if (chart.displayType === 'line' || chart.displayType === 'area') {
      const ChartComponent = chart.displayType === 'line' ? LineChart : AreaChart
      const DataComponent = chart.displayType === 'line' ? Line : Area
      
      return (
        <ResponsiveContainer {...commonProps}>
          <ChartComponent data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <DataComponent type="monotone" dataKey="value" stroke={chart.color} fill={chart.color} fillOpacity={0.6} />
          </ChartComponent>
        </ResponsiveContainer>
      )
    }

    // Bar chart fallback
    return (
      <ResponsiveContainer {...commonProps}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill={chart.color} />
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
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Chart
              </Button>
            </div>

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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {charts.map((chart) => (
                  <div key={chart.id} className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">{chart.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingChart(chart)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteChart(chart.id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {renderChart(chart)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <TeamChat />

      {/* Add/Edit Chart Dialog */}
      {(showAddDialog || editingChart) && (
        <ChartDialog
          open={showAddDialog || !!editingChart}
          onClose={() => {
            setShowAddDialog(false)
            setEditingChart(null)
          }}
          onSave={editingChart ? updateChart : addChart}
          chart={editingChart || undefined}
          indicators={indicators}
        />
      )}
    </div>
  )
}

interface ChartDialogProps {
  open: boolean
  onClose: () => void
  onSave: (chart: Chart) => void
  chart?: Chart
  indicators: any[]
}

function ChartDialog({ open, onClose, onSave, chart, indicators }: ChartDialogProps) {
  const [title, setTitle] = useState(chart?.title || '')
  const [chartType, setChartType] = useState<Chart['chartType']>(chart?.chartType || 'progress-summary')
  const [displayType, setDisplayType] = useState<Chart['displayType']>(chart?.displayType || 'bar')
  const [indicatorId, setIndicatorId] = useState(chart?.indicatorId || '')
  const [color, setColor] = useState(chart?.color || CHART_COLORS[0])

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
      indicatorId: chartType === 'indicator-progress' || chartType === 'reports-timeline' ? indicatorId : undefined,
      color,
    }

    onSave(newChart)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{chart ? 'Edit Chart' : 'Add New Chart'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHART_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(chartType === 'indicator-progress' || chartType === 'reports-timeline') && (
            <div className="space-y-2">
              <Label>Indicator (optional)</Label>
              <Select value={indicatorId} onValueChange={setIndicatorId}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="All indicators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Indicators</SelectItem>
                  {indicators.map((ind) => (
                    <SelectItem key={ind.id} value={ind.id}>
                      {ind.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Display Type *</Label>
            <Select value={displayType} onValueChange={(value: any) => setDisplayType(value)}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISPLAY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-10 rounded border border-border"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#D4A017"
                className="flex-1 bg-background border-border text-foreground"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {chart ? 'Update Chart' : 'Add Chart'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

