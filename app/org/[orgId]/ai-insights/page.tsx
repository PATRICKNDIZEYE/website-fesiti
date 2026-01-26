'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AIWhySection } from '@/components/ai/AIWhySection'
import { AIMetricsCards } from '@/components/ai/AIMetricsCards'
import { AITransformationSection } from '@/components/ai/AITransformationSection'
import { AIChartsSection } from '@/components/ai/AIChartsSection'
import { AIRiskAlerts } from '@/components/ai/AIRiskAlerts'
import { AIRecommendations } from '@/components/ai/AIRecommendations'
import { AIPredictionsChart } from '@/components/ai/AIPredictionsChart'

export default function AIInsightsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const orgId = params.orgId as string
  const activeTab = searchParams.get('tab') || 'overview'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (!orgId) {
      console.error('Organization ID not found in route')
      return
    }

    // Simulate loading AI insights
    setTimeout(() => setLoading(false), 1000)
  }, [router, orgId])

  // Mock AI insights data - in production, this would come from API
  const aiMetrics = {
    timeSaved: '12.5 hours',
    accuracyImprovement: '34%',
    riskDetected: 8,
    recommendationsGenerated: 24,
    dataProcessed: '2.4M',
    insightsGenerated: 156,
  }

  const predictionData = [
    { month: 'Jan', predicted: 65, actual: 62, variance: 3 },
    { month: 'Feb', predicted: 72, actual: 68, variance: 4 },
    { month: 'Mar', predicted: 78, actual: 75, variance: 3 },
    { month: 'Apr', predicted: 85, actual: 82, variance: 3 },
    { month: 'May', predicted: 88, actual: 90, variance: -2 },
    { month: 'Jun', predicted: 92, actual: 89, variance: 3 },
  ]

  const riskDistribution = [
    { name: 'High Risk', value: 8, color: '#ef4444' },
    { name: 'Medium Risk', value: 15, color: '#f59e0b' },
    { name: 'Low Risk', value: 32, color: '#10b981' },
    { name: 'No Risk', value: 45, color: '#6b7280' },
  ]

  const recommendationCategories = [
    { category: 'Resource Allocation', count: 8, priority: 'High' },
    { category: 'Timeline Adjustment', count: 6, priority: 'Medium' },
    { category: 'Quality Improvement', count: 5, priority: 'High' },
    { category: 'Team Optimization', count: 5, priority: 'Medium' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading AI insights...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      <Header
        title="AI Insights"
        subtitle="Intelligent analysis, predictions, and recommendations powered by artificial intelligence."
      />

      <AIWhySection />

      <AIMetricsCards metrics={aiMetrics} />

      <Tabs value={activeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" onClick={() => router.push(`/org/${orgId}/ai-insights`)}>
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="predictions"
            onClick={() => router.push(`/org/${orgId}/ai-insights?tab=predictions`)}
          >
            Predictions
          </TabsTrigger>
          <TabsTrigger value="risks" onClick={() => router.push(`/org/${orgId}/ai-insights?tab=risks`)}>
            Risk Alerts
          </TabsTrigger>
          <TabsTrigger
            value="recommendations"
            onClick={() => router.push(`/org/${orgId}/ai-insights?tab=recommendations`)}
          >
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <AIChartsSection predictionData={predictionData} riskDistribution={riskDistribution} />
          <AITransformationSection />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6 mt-6">
          <AIPredictionsChart data={predictionData} />
        </TabsContent>

        <TabsContent value="risks" className="space-y-6 mt-6">
          <AIRiskAlerts
            risks={[1, 2, 3, 4, 5].map((i) => ({
              id: i,
              projectName: `Project ${i}`,
              riskType: 'Timeline Risk Detected',
              probability: 78,
              priority: 'High' as const,
              description:
                'AI analysis indicates a 78% probability of delay based on current progress rates and resource allocation patterns.',
            }))}
          />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6 mt-6">
          <AIRecommendations categories={recommendationCategories} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
