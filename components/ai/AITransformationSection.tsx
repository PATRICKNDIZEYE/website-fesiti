'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'

export function AITransformationSection() {
  const transformations = [
    {
      icon: Brain,
      title: '1. Automated Evidence Synthesis',
      description:
        'AI processes thousands of evaluation reports, extracting key findings, themes, and patterns across multiple projects. This enables organizations to learn from past experiences at scale, identifying what works and what doesn\'t across different contexts.',
    },
    {
      icon: TrendingUp,
      title: '2. Predictive Analytics',
      description:
        'Machine learning models analyze historical project data to forecast outcomes, completion dates, and resource needs. This allows managers to intervene early when projects are at risk, optimizing resource allocation before problems escalate.',
    },
    {
      icon: AlertTriangle,
      title: '3. Real-Time Risk Detection',
      description:
        'Continuous monitoring of data streams identifies anomalies, deviations from expected patterns, and early warning signals. AI flags potential issues before they become critical, enabling proactive rather than reactive management.',
    },
    {
      icon: Lightbulb,
      title: '4. Intelligent Recommendations',
      description:
        'Based on analysis of similar projects and best practices, AI generates actionable recommendations for improving program performance, optimizing workflows, and enhancing impact.',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>How AI Transforms M&E</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transformations.map((item, idx) => {
            const Icon = item.icon
            return (
              <div key={idx} className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  {item.title}
                </h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
