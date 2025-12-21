'use client'

import { ChartType } from './types'
import { BasicChartRenderer } from './BasicChartRenderer'
import { AdvancedChartRenderer } from './AdvancedChartRenderer'

interface UnifiedChartRendererProps {
  data: any[]
  chartType: ChartType
  config: any
  height?: number
}

const BASIC_CHARTS: ChartType[] = ['bar', 'line', 'pie', 'area', 'scatter', 'composed']
const ADVANCED_CHARTS: ChartType[] = ['heatmap', 'treemap', 'sankey', 'scatter3d', 'surface']

export function UnifiedChartRenderer(props: UnifiedChartRendererProps) {
  if (BASIC_CHARTS.includes(props.chartType)) {
    return <BasicChartRenderer {...props} />
  } else if (ADVANCED_CHARTS.includes(props.chartType)) {
    return <AdvancedChartRenderer {...props} />
  }
  
  return (
    <div style={{ height: `${props.height || 500}px` }} className="flex items-center justify-center text-muted-foreground">
      Unsupported chart type
    </div>
  )
}

