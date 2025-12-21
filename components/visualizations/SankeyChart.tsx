'use client'

import { AdvancedChartRenderer } from './AdvancedChartRenderer'
import { ChartConfig } from './types'

interface SankeyChartProps {
  data: any[]
  config: ChartConfig
  height?: number
}

export function SankeyChart({ data, config, height = 500 }: SankeyChartProps) {
  return (
    <AdvancedChartRenderer
      data={data}
      chartType="sankey"
      config={config}
      height={height}
    />
  )
}

