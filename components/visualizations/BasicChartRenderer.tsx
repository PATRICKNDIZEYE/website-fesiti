'use client'

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
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartType, ChartConfig } from './types'

const CHART_COLORS = [
  '#D4A017', '#C41E3A', '#525252', '#10b981',
  '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899',
]

interface BasicChartRendererProps {
  data: any[]
  chartType: ChartType
  config: ChartConfig
  height?: number
}

export function BasicChartRenderer({
  data,
  chartType,
  config,
  height = 500,
}: BasicChartRendererProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: `${height}px` }} className="flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    )
  }

  const commonProps = { width: '100%', height }

  switch (chartType) {
    case 'pie':
      return (
        <ResponsiveContainer {...commonProps}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={Math.min(120, height / 3)}
              dataKey={config.value || 'value'}
              nameKey={config.xAxis || 'name'}
            >
              {data.map((entry, index) => (
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

    case 'line':
      return (
        <ResponsiveContainer {...commonProps}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey={config.xAxis || 'name'} stroke="#888" />
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
            <Line
              type="monotone"
              dataKey={config.value || 'value'}
              stroke={config.color || CHART_COLORS[0]}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      )

    case 'area':
      return (
        <ResponsiveContainer {...commonProps}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey={config.xAxis || 'name'} stroke="#888" />
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
            <Area
              type="monotone"
              dataKey={config.value || 'value'}
              stroke={config.color || CHART_COLORS[0]}
              fill={config.color || CHART_COLORS[0]}
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      )

    case 'scatter':
      return (
        <ResponsiveContainer {...commonProps}>
          <ScatterChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey={config.xAxis || 'x'} stroke="#888" />
            <YAxis dataKey={config.yAxis || 'y'} stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Scatter
              dataKey={config.value || 'value'}
              fill={config.color || CHART_COLORS[0]}
            />
          </ScatterChart>
        </ResponsiveContainer>
      )

    case 'composed':
      return (
        <ResponsiveContainer {...commonProps}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey={config.xAxis || 'name'} stroke="#888" />
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
            <Bar dataKey={config.value || 'value'} fill={config.color || CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey={config.value || 'value'} stroke="#ff7300" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      )

    case 'bar':
    default:
      return (
        <ResponsiveContainer {...commonProps}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.2} />
            <XAxis dataKey={config.xAxis || 'name'} stroke="#888" />
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
            <Bar dataKey={config.value || 'value'} fill={config.color || CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
  }
}

