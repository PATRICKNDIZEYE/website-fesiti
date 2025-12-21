'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { TeamChat } from '@/components/TeamChat'
import { useLayout } from '@/contexts/LayoutContext'
import { cn } from '@/lib/utils'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UnifiedChartRenderer } from '@/components/visualizations/UnifiedChartRenderer'
import { ChartType, ChartConfig, AggregationType } from '@/components/visualizations/types'
import { aggregateData } from '@/utils/aggregations'
import api from '@/lib/api'
import Link from 'next/link'

export default function VisualizeDatasetPage() {
  const params = useParams()
  const router = useRouter()
  const datasetId = params.datasetId as string
  const { sidebarCollapsed, chatCollapsed } = useLayout()

  const [dataset, setDataset] = useState<any>(null)
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [config, setConfig] = useState<ChartConfig>({
    aggregation: 'sum',
  })
  const [columns, setColumns] = useState<string[]>([])
  const [numericColumns, setNumericColumns] = useState<string[]>([])

  useEffect(() => {
    if (datasetId) {
      fetchDataset()
      fetchData()
    }
  }, [datasetId])

  const fetchDataset = async () => {
    try {
      const response = await api.get(`/data-import/datasets/${datasetId}`)
      setDataset(response.data)
      if (response.data.schemas && response.data.schemas[0]) {
        const cols = response.data.schemas[0].columns.map((c: any) => c.name)
        const numericCols = response.data.schemas[0].columns
          .filter((c: any) => ['number', 'currency', 'percentage'].includes(c.type))
          .map((c: any) => c.name)
        
        setColumns(cols)
        setNumericColumns(numericCols)
        
        // Set default config based on available columns
        if (cols.length > 0) {
          setConfig({
            xAxis: cols[0],
            yAxis: cols.length > 1 ? cols[1] : cols[0],
            value: numericCols.length > 0 ? numericCols[0] : cols[0],
            groupBy: cols[0],
            aggregation: 'sum',
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch dataset:', error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/data-import/datasets/${datasetId}/data`, {
        params: { limit: 1000 },
      })
      setData(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await api.post('/data-import/visualizations', {
        datasetId,
        chartType,
        config,
      })
      alert('Visualization saved successfully!')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save visualization')
    }
  }

  const transformDataForChart = (): any[] => {
    if (!data || data.length === 0) return []

    let processedData = [...data]

    // Apply aggregation if configured
    if (config.groupBy && config.value && config.aggregation && config.aggregation !== 'none') {
      processedData = aggregateData(
        processedData,
        config.groupBy,
        config.value,
        config.aggregation as AggregationType,
      )
    }

    // Transform for specific chart types
    switch (chartType) {
      case 'bar':
      case 'line':
      case 'area':
      case 'composed':
        return processedData.map((row) => ({
          name: String(row[config.xAxis || config.groupBy || ''] || ''),
          value: Number(row[config.value || 'value'] || 0),
        }))

      case 'pie':
        return processedData.map((row) => ({
          name: String(row[config.xAxis || config.groupBy || ''] || ''),
          value: Number(row[config.value || 'value'] || 0),
        }))

      case 'scatter':
        return processedData.map((row) => ({
          x: Number(row[config.xAxis || ''] || 0),
          y: Number(row[config.yAxis || ''] || 0),
          value: Number(row[config.value || ''] || 0),
        }))

      case 'heatmap':
        const heatmapMap: Record<string, number> = {}
        processedData.forEach((row) => {
          const x = String(row[config.xAxis || ''] || '')
          const y = String(row[config.yAxis || ''] || '')
          const value = Number(row[config.value || ''] || 0)
          const key = `${x}|${y}`
          heatmapMap[key] = (heatmapMap[key] || 0) + value
        })
        return Object.entries(heatmapMap).map(([key, value]) => {
          const [x, y] = key.split('|')
          return { x, y, value }
        })

      case 'treemap':
        return processedData.map((row) => ({
          label: String(row[config.xAxis || config.groupBy || ''] || ''),
          parent: '',
          value: Number(row[config.value || 'value'] || 0),
        }))

      case 'sankey':
        return processedData.map((row) => ({
          source: String(row[config.source || ''] || ''),
          target: String(row[config.target || ''] || ''),
          value: Number(row[config.value || ''] || 0),
        }))

      case 'scatter3d':
        return processedData.map((row) => ({
          x: Number(row[config.xAxis || ''] || 0),
          y: Number(row[config.yAxis || ''] || 0),
          z: Number(row[config.value || ''] || 0),
        }))

      default:
        return processedData
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
        <Header title={dataset?.name || 'Visualize Dataset'} />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Link
              href="/data-import"
              className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Data Import</span>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Chart Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Chart Type</Label>
                      <Select
                        value={chartType}
                        onValueChange={(value) => setChartType(value as ChartType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="pie">Pie Chart</SelectItem>
                          <SelectItem value="area">Area Chart</SelectItem>
                          <SelectItem value="scatter">Scatter Plot</SelectItem>
                          <SelectItem value="composed">Composed Chart</SelectItem>
                          <SelectItem value="heatmap">Heatmap (Advanced)</SelectItem>
                          <SelectItem value="treemap">Treemap (Advanced)</SelectItem>
                          <SelectItem value="sankey">Sankey Diagram (Advanced)</SelectItem>
                          <SelectItem value="scatter3d">3D Scatter (Advanced)</SelectItem>
                          <SelectItem value="surface">Surface (Advanced)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {columns.length > 0 && (
                      <>
                        {/* Aggregation Settings */}
                        {(chartType === 'bar' || chartType === 'line' || chartType === 'pie' || chartType === 'area' || chartType === 'composed') && (
                          <>
                            <div>
                              <Label>Group By</Label>
                              <Select
                                value={config.groupBy || ''}
                                onValueChange={(value) =>
                                  setConfig({ ...config, groupBy: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select column" />
                                </SelectTrigger>
                                <SelectContent>
                                  {columns.map((col) => (
                                    <SelectItem key={col} value={col}>
                                      {col}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Value Column</Label>
                              <Select
                                value={config.value || ''}
                                onValueChange={(value) =>
                                  setConfig({ ...config, value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select column" />
                                </SelectTrigger>
                                <SelectContent>
                                  {numericColumns.map((col) => (
                                    <SelectItem key={col} value={col}>
                                      {col}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Aggregation</Label>
                              <Select
                                value={config.aggregation || 'sum'}
                                onValueChange={(value) =>
                                  setConfig({ ...config, aggregation: value as AggregationType })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sum">Sum</SelectItem>
                                  <SelectItem value="avg">Average</SelectItem>
                                  <SelectItem value="count">Count</SelectItem>
                                  <SelectItem value="min">Minimum</SelectItem>
                                  <SelectItem value="max">Maximum</SelectItem>
                                  <SelectItem value="none">None (Raw Data)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Color</Label>
                              <Input
                                type="color"
                                value={config.color || '#D4A017'}
                                onChange={(e) =>
                                  setConfig({ ...config, color: e.target.value })
                                }
                              />
                            </div>
                          </>
                        )}

                        {chartType === 'scatter' && (
                          <>
                            <div>
                              <Label>X Axis</Label>
                              <Select
                                value={config.xAxis || ''}
                                onValueChange={(value) =>
                                  setConfig({ ...config, xAxis: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {numericColumns.map((col) => (
                                    <SelectItem key={col} value={col}>
                                      {col}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Y Axis</Label>
                              <Select
                                value={config.yAxis || ''}
                                onValueChange={(value) =>
                                  setConfig({ ...config, yAxis: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {numericColumns.map((col) => (
                                    <SelectItem key={col} value={col}>
                                      {col}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Value (Size)</Label>
                              <Select
                                value={config.value || ''}
                                onValueChange={(value) =>
                                  setConfig({ ...config, value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {numericColumns.map((col) => (
                                    <SelectItem key={col} value={col}>
                                      {col}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}

                        {chartType === 'heatmap' && (
                          <>
                            <div>
                              <Label>X Axis</Label>
                              <Select
                                value={config.xAxis || ''}
                                onValueChange={(value) =>
                                  setConfig({ ...config, xAxis: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {columns.map((col) => (
                                    <SelectItem key={col} value={col}>
                                      {col}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Y Axis</Label>
                              <Select
                                value={config.yAxis || ''}
                                onValueChange={(value) =>
                                  setConfig({ ...config, yAxis: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {columns.map((col) => (
                                    <SelectItem key={col} value={col}>
                                      {col}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Value</Label>
                              <Select
                                value={config.value || ''}
                                onValueChange={(value) =>
                                  setConfig({ ...config, value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {columns.map((col) => (
                                    <SelectItem key={col} value={col}>
                                      {col}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}

                        {chartType === 'sankey' && (
                          <>
                            <div>
                              <Label>Source</Label>
                              <Select
                                value={config.source || ''}
                                onValueChange={(value) =>
                                  setConfig({ ...config, source: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {columns.map((col) => (
                                    <SelectItem key={col} value={col}>
                                      {col}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Target</Label>
                              <Select
                                value={config.target || ''}
                                onValueChange={(value) =>
                                  setConfig({ ...config, target: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {columns.map((col) => (
                                    <SelectItem key={col} value={col}>
                                      {col}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Value</Label>
                              <Select
                                value={config.value || ''}
                                onValueChange={(value) =>
                                  setConfig({ ...config, value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {columns.map((col) => (
                                    <SelectItem key={col} value={col}>
                                      {col}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    <Button onClick={handleSave} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Save Visualization
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Chart Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.length > 0 ? (
                      <UnifiedChartRenderer
                        data={transformDataForChart()}
                        chartType={chartType}
                        config={config}
                        height={600}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TeamChat />
    </div>
  )
}

