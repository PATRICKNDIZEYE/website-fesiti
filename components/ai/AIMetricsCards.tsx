'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Clock, Target, AlertTriangle, Lightbulb, BarChart3, Sparkles } from 'lucide-react'

interface AIMetrics {
  timeSaved: string
  accuracyImprovement: string
  riskDetected: number
  recommendationsGenerated: number
  dataProcessed: string
  insightsGenerated: number
}

interface AIMetricsCardsProps {
  metrics: AIMetrics
}

export function AIMetricsCards({ metrics }: AIMetricsCardsProps) {
  const metricItems = [
    {
      icon: Clock,
      label: 'Time Saved',
      value: metrics.timeSaved,
      subtext: 'This week',
    },
    {
      icon: Target,
      label: 'Accuracy',
      value: metrics.accuracyImprovement,
      subtext: 'Improvement',
    },
    {
      icon: AlertTriangle,
      label: 'Risks Detected',
      value: metrics.riskDetected.toString(),
      subtext: 'Active alerts',
      iconColor: 'text-destructive',
    },
    {
      icon: Lightbulb,
      label: 'Recommendations',
      value: metrics.recommendationsGenerated.toString(),
      subtext: 'This month',
    },
    {
      icon: BarChart3,
      label: 'Data Processed',
      value: metrics.dataProcessed,
      subtext: 'Records analyzed',
    },
    {
      icon: Sparkles,
      label: 'Insights',
      value: metrics.insightsGenerated.toString(),
      subtext: 'Generated',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metricItems.map((item, idx) => {
        const Icon = item.icon
        return (
          <Card key={idx} className="bg-card border-border/70">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-5 w-5 ${item.iconColor || 'text-primary'}`} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                {item.label}
              </p>
              <p className="text-2xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.subtext}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
