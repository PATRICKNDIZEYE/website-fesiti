'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface PredictionData {
  month: string
  predicted: number
  actual: number
  variance: number
}

interface AIPredictionsChartProps {
  data: PredictionData[]
}

export function AIPredictionsChart({ data }: AIPredictionsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Outcome Predictions</CardTitle>
        <p className="text-sm text-muted-foreground">
          AI-powered forecasts based on historical data and current project metrics
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="predicted" fill="#3b82f6" name="AI Prediction" />
            <Bar dataKey="actual" fill="#10b981" name="Actual Results" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
