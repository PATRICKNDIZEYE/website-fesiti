'use client'
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getTheme, setTheme, initTheme } from '@/lib/theme'
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
import { Loader2, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Chart {
  id: string
  title: string
  chartType: 'indicator-progress' | 'progress-summary' | 'target-vs-actual' | 'reports-timeline' | 'indicator-performance' | 'progress-trend' | 'completion-status' | 'monthly-comparison'
  displayType: 'bar' | 'line' | 'area' | 'pie' | 'composed' | 'scatter'
  indicatorId?: string
  color: string
  targetColor?: string
  width?: number
  height?: number
  order?: number
}

const CHART_COLORS = [
  '#D4A017', '#C41E3A', '#525252', '#10b981',
  '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899',
]

const TARGET_COLOR = '#ef4444'
const PROGRESS_COLOR = '#10b981'

export default function SharedVisualizationPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const shareId = params.shareId as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [charts, setCharts] = useState<Chart[]>([])
  const [chartData, setChartData] = useState<Record<string, any>>({})
  const [projectName, setProjectName] = useState<string>('')
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Initialize theme
    initTheme()
    setThemeState(getTheme())
    
    if (projectId && shareId) {
      loadSharedCharts()
    }
  }, [projectId, shareId])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    setThemeState(newTheme)
  }

  const loadSharedCharts = async () => {
    try {
      setLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      
      // Fetch both config and data in parallel
      const [configResponse, dataResponse] = await Promise.all([
        fetch(`${apiUrl}/dashboard/share/${shareId}`),
        fetch(`${apiUrl}/dashboard/share/${shareId}/data`)
      ])
      
      if (!configResponse.ok) {
        if (configResponse.status === 404) {
          setError('Share link not found or has expired')
        } else {
          setError('Failed to load shared visualization')
        }
        return
      }

      const configData = await configResponse.json()
      
      if (configData.config && configData.config.charts && Array.isArray(configData.config.charts)) {
        const chartsWithDefaults = configData.config.charts.map((chart: Chart, index: number) => ({
          ...chart,
          order: chart.order ?? index,
          width: chart.width ?? 6,
          height: chart.height ?? 400,
        }))
        setCharts(chartsWithDefaults.sort((a: Chart, b: Chart) => (a.order ?? 0) - (b.order ?? 0)))
        setProjectName(configData.projectName || 'Shared Project')
      } else {
        setError('Invalid share link configuration')
        return
      }

      // Load chart data if available
      if (dataResponse.ok) {
        const dataResult = await dataResponse.json()
        if (dataResult.charts) {
          setChartData(dataResult.charts)
        }
      }
    } catch (error) {
      console.error('Failed to load shared charts:', error)
      setError('Failed to load shared visualization')
    } finally {
      setLoading(false)
    }
  }

  // Import all render functions from the main page
  // For now, I'll create simplified versions that work for public access
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

  // Chart rendering functions (simplified versions)
  const renderIndicatorProgress = (data: any, chart: Chart) => {
    const combinedData: any[] = []
    const targetMap = new Map(data.targets?.map((t: any) => [t.date, t.value]) || [])
    const reportMap = new Map(data.reports?.map((r: any) => [r.date, r.value]) || [])
    const allDates = new Set([...(data.targets || []).map((t: any) => t.date), ...(data.reports || []).map((r: any) => r.date)])
    
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
      const isLine = chart.displayType === 'line'
      
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
              {isLine ? (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke={targetColor} 
                    strokeWidth={2}
                    strokeDasharray="8 4" 
                    name="Target" 
                    dot={{ fill: targetColor, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke={progressColor} 
                    strokeWidth={3}
                    fill={progressColor} 
                    fillOpacity={0.3} 
                    name="Actual Progress"
                    dot={{ fill: progressColor, r: 5 }}
                  />
                </>
              ) : (
                <>
                  <Area 
                    type="monotone" 
                    dataKey="target" 
                    stroke={targetColor} 
                    strokeWidth={2}
                    strokeDasharray="8 4" 
                    name="Target" 
                    dot={{ fill: targetColor, r: 4 }}
                    fill={targetColor}
                    fillOpacity={0.1}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    stroke={progressColor} 
                    strokeWidth={3}
                    fill={progressColor} 
                    fillOpacity={0.3} 
                    name="Actual Progress"
                    dot={{ fill: progressColor, r: 5 }}
                  />
                </>
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      )
    }

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
    const chartData = (data.indicators || []).map((ind: any) => ({
      name: ind.name?.length > 20 ? ind.name.substring(0, 20) + '...' : ind.name,
      fullName: ind.name,
      progress: Math.round(ind.progress || 0),
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
      const isLine = chart.displayType === 'line'
      
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
            {isLine ? (
              <Line type="monotone" dataKey="progress" stroke={chart.color} fill={chart.color} fillOpacity={0.6} />
            ) : (
              <Area type="monotone" dataKey="progress" stroke={chart.color} fill={chart.color} fillOpacity={0.6} />
            )}
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
            />
            <Legend />
            <Bar dataKey="progress" fill={chart.color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderTargetVsActual = (data: any, chart: Chart) => {
    const chartData = (data.comparison || []).map((comp: any) => ({
      name: comp.indicatorName?.length > 20 ? comp.indicatorName.substring(0, 20) + '...' : comp.indicatorName,
      fullName: comp.indicatorName,
      target: comp.target || 0,
      actual: comp.actual || 0,
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
    const chartData = (data.timeline || []).map((item: any) => ({
      date: new Date(item.date).toLocaleDateString(),
      value: item.value,
      indicator: item.indicatorName,
    }))

    const commonProps = { width: '100%', height: chart.height || 400 }

    if (chart.displayType === 'line' || chart.displayType === 'area') {
      const ChartComponent = chart.displayType === 'line' ? LineChart : AreaChart
      const isLine = chart.displayType === 'line'
      
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
            {isLine ? (
              <Line type="monotone" dataKey="value" stroke={chart.color} fill={chart.color} fillOpacity={0.6} />
            ) : (
              <Area type="monotone" dataKey="value" stroke={chart.color} fill={chart.color} fillOpacity={0.6} />
            )}
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
    const chartData = (data.indicators || []).map((ind: any) => {
      let status = 'on_track'
      const progress = Math.round(ind.progress || 0)
      if (progress < 50) status = 'behind'
      else if (progress >= 100) status = 'completed'
      else if (progress >= 75) status = 'on_track'
      else status = 'at_risk'
      
      return {
        name: ind.name?.length > 15 ? ind.name.substring(0, 15) + '...' : ind.name,
        fullName: ind.name,
        progress,
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
      const isLine = chart.displayType === 'line'
      
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
            {isLine ? (
              <Line type="monotone" dataKey="progress" stroke={chart.color} fill={chart.color} fillOpacity={0.6} />
            ) : (
              <Area type="monotone" dataKey="progress" stroke={chart.color} fill={chart.color} fillOpacity={0.6} />
            )}
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
    const chartData = (data.indicators || []).map((ind: any) => ({
      name: ind.name?.length > 15 ? ind.name.substring(0, 15) + '...' : ind.name,
      fullName: ind.name,
      progress: Math.round(ind.progress || 0),
    }))

    const commonProps = { width: '100%', height: chart.height || 400 }

    if (chart.displayType === 'line' || chart.displayType === 'area') {
      const ChartComponent = chart.displayType === 'line' ? LineChart : AreaChart
      const isLine = chart.displayType === 'line'
      
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
            {isLine ? (
              <Line type="monotone" dataKey="progress" stroke={chart.color} fill={chart.color} fillOpacity={0.6} />
            ) : (
              <Area type="monotone" dataKey="progress" stroke={chart.color} fill={chart.color} fillOpacity={0.6} />
            )}
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
    const statusCounts = (data.indicators || []).reduce((acc: any, ind: any) => {
      let status = 'on_track'
      const progress = Math.round(ind.progress || 0)
      if (progress < 50) status = 'behind'
      else if (progress >= 100) status = 'completed'
      else if (progress >= 75) status = 'on_track'
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
      const isLine = chart.displayType === 'line'
      
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
            {isLine ? (
              <Line type="monotone" dataKey="average" stroke={chart.color} fill={chart.color} fillOpacity={0.6} name="Average Value" />
            ) : (
              <Area type="monotone" dataKey="average" stroke={chart.color} fill={chart.color} fillOpacity={0.6} name="Average Value" />
            )}
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared visualization...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4">Error Loading Visualization</h1>
          <p className="text-destructive text-lg mb-6">{error}</p>
          <p className="text-muted-foreground text-sm">This link may have expired or is invalid.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Theme Toggle Button - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={toggleTheme}
          variant="outline"
          size="icon"
          className="bg-background border-border hover:bg-accent"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-foreground" />
          ) : (
            <Moon className="h-5 w-5 text-foreground" />
          )}
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8">
        {projectName && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">{projectName}</h1>
            <p className="text-muted-foreground mt-2">Shared Visualization</p>
          </div>
        )}

        {charts.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground">No charts in this shared visualization</p>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6 auto-rows-min">
            {charts.map((chart) => (
              <div
                key={chart.id}
                style={{
                  gridColumn: `span ${chart.width || 6}`,
                }}
                className="bg-card border border-border rounded-lg p-6"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground">{chart.title}</h3>
                </div>
                {renderChart(chart)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
