'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'

interface RiskAlert {
  id: number
  projectName: string
  riskType: string
  probability: number
  priority: 'High' | 'Medium' | 'Low'
  description: string
}

interface AIRiskAlertsProps {
  risks: RiskAlert[]
}

export function AIRiskAlerts({ risks }: AIRiskAlertsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Risk Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {risks.map((risk) => (
            <div
              key={risk.id}
              className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 flex items-start gap-4"
            >
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-foreground">
                    {risk.projectName}: {risk.riskType}
                  </h4>
                  <Badge
                    variant={risk.priority === 'High' ? 'destructive' : 'secondary'}
                  >
                    {risk.priority} Priority
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  AI analysis indicates a {risk.probability}% probability based on current progress rates
                  and resource allocation patterns.
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
