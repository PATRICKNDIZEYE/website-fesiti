'use client'

import dynamic from 'next/dynamic'
import { ChartType } from './types'

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(
  () => import('react-plotly.js').then((mod) => mod.default),
  { ssr: false }
)

interface AdvancedChartRendererProps {
  data: any[]
  chartType: ChartType
  config: Record<string, any>
  height?: number
}

export function AdvancedChartRenderer({
  data,
  chartType,
  config,
  height = 500,
}: AdvancedChartRendererProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ width: '100%', height: `${height}px` }} className="flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    )
  }

  let plotData: any
  let layout: any = {
    ...config.layout,
    height,
    margin: { l: 50, r: 50, t: 50, b: 50 },
    autosize: true,
  }

  switch (chartType) {
    case 'heatmap':
      // For heatmap, we need to create a 2D array
      const xValues = Array.from(new Set(data.map((d) => d.x || d.xAxis))).sort()
      const yValues = Array.from(new Set(data.map((d) => d.y || d.yAxis))).sort()
      const zMatrix: number[][] = yValues.map(() => xValues.map(() => 0))
      
      data.forEach((d) => {
        const xIdx = xValues.indexOf(d.x || d.xAxis)
        const yIdx = yValues.indexOf(d.y || d.yAxis)
        if (xIdx >= 0 && yIdx >= 0) {
          zMatrix[yIdx][xIdx] = (zMatrix[yIdx][xIdx] || 0) + (d.value || 0)
        }
      })

      plotData = [
        {
          z: zMatrix,
          x: xValues,
          y: yValues,
          type: 'heatmap',
          colorscale: config.colorscale || 'Viridis',
        },
      ]
      break

    case 'treemap':
      plotData = [
        {
          type: 'treemap',
          labels: data.map((d) => d.label || d.name || ''),
          parents: data.map((d) => d.parent || ''),
          values: data.map((d) => d.value || 0),
          textinfo: 'label+value',
        },
      ]
      break

    case 'sankey':
      // Extract unique nodes
      const allNodes = new Set<string>()
      data.forEach((d) => {
        allNodes.add(String(d.source || ''))
        allNodes.add(String(d.target || ''))
      })
      const nodeLabels = Array.from(allNodes)
      
      plotData = [
        {
          type: 'sankey',
          node: {
            label: nodeLabels,
            color: config.nodeColors || [],
          },
          link: {
            source: data.map((d) => nodeLabels.indexOf(String(d.source || ''))),
            target: data.map((d) => nodeLabels.indexOf(String(d.target || ''))),
            value: data.map((d) => d.value || 0),
          },
        },
      ]
      break

    case 'scatter3d':
      plotData = [
        {
          x: data.map((d) => d.x || 0),
          y: data.map((d) => d.y || 0),
          z: data.map((d) => d.z || 0),
          mode: 'markers',
          type: 'scatter3d',
          marker: {
            size: data.map((d) => d.size || 5),
            color: data.map((d) => d.color || 'blue'),
          },
        },
      ]
      break

    case 'surface':
      // Surface needs a 2D z array
      const zData = data.map((d) => (Array.isArray(d.z) ? d.z : [d.value || 0]))
      plotData = [
        {
          z: zData,
          type: 'surface',
          colorscale: config.colorscale || 'Viridis',
        },
      ]
      break

    default:
      plotData = []
  }

  return (
    <Plot
      data={plotData}
      layout={layout}
      style={{ width: '100%', height: `${height}px` }}
      config={{
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        displaylogo: false, // Remove Plotly logo
      }}
    />
  )
}

