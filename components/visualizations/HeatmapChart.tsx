'use client'

import { AdvancedChartRenderer } from './AdvancedChartRenderer'
import { ChartConfig } from './types'

interface HeatmapChartProps {
  data: any[]
  config: ChartConfig
  height?: number
}

export function HeatmapChart({ data, config, height = 500 }: HeatmapChartProps) {
  return (
    <AdvancedChartRenderer
      data={data}
      chartType="heatmap"
      config={config}
      height={height}
    />
  )
}

