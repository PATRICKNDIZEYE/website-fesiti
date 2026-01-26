'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Zap, Brain, Activity } from 'lucide-react'

export function AIWhySection() {
  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/20">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Why AI in Monitoring & Evaluation?</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Transforming M&E from reactive reporting to proactive intelligence
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-foreground">10x Faster Analysis</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Process millions of data points in seconds, not weeks. AI accelerates evidence synthesis,
              qualitative analysis, and report generation.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-foreground">Predictive Intelligence</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Forecast project outcomes, identify risks before they materialize, and optimize resource
              allocation based on data-driven predictions.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-foreground">Real-Time Monitoring</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Continuous analysis of data streams enables proactive intervention instead of discovering
              problems after opportunities pass.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
