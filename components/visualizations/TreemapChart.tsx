'use client'

import { AdvancedChartRenderer } from './AdvancedChartRenderer'
import { ChartConfig } from './types'

interface TreemapChartProps {
  data: any[]
  config: ChartConfig
  height?: number
}

export function TreemapChart({ data, config, height = 500 }: TreemapChartProps) {
  return (
    <AdvancedChartRenderer
      data={data}
      chartType="treemap"
      config={config}
      height={height}
    />
  )
}

