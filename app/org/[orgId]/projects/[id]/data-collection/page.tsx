'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle, Loader2, ClipboardList, Calendar, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { orgApi } from '@/lib/api-helpers'
import { Indicator, IndicatorPeriod, Project, Unit } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DataCollectionForm } from '@/components/DataCollectionForm'
import { Header } from '@/components/Header'

export default function DataCollectionPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const orgId = params.orgId as string
  const projectId = params.id as string
  const selectedIndicatorId = searchParams.get('indicator')
  const selectedPeriodId = searchParams.get('period')
  
  const [project, setProject] = useState<Project | null>(null)
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    fetchData()
    // Get user ID from token/storage
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr)
        setUserId(parsed.id || parsed.userId || parsed.sub || '')
      } catch (e) {
        console.error('Failed to parse user data')
      }
    }
  }, [projectId, orgId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const [projectRes, indicatorsRes] = await Promise.all([
        orgApi.get(orgId, `projects/${projectId}`),
        orgApi.get(orgId, `indicators?projectId=${projectId}`),
      ])
      
      setProject(projectRes.data)
      setIndicators(indicatorsRes.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Filter indicators with open periods
  const indicatorsWithOpenPeriods = indicators.filter(
    ind => ind.periods?.some(p => p.status === 'open')
  )

  // Get open periods for an indicator
  const getOpenPeriods = (indicator: Indicator) => {
    return (indicator.periods || []).filter(p => p.status === 'open')
  }

  // Helper to get unit display
  const getUnitDisplay = (indicator: Indicator) => {
    const unit = indicator.unit as string | Unit | null
    if (unit && typeof unit === 'object') {
      return unit.symbol || unit.name || ''
    }
    return unit || ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  // If indicator and period are selected, show the data collection form
  if (selectedIndicatorId && selectedPeriodId) {
    const selectedIndicator = indicators.find(i => i.id === selectedIndicatorId)
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/org/${orgId}/projects/${projectId}/data-collection`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Selection
          </Button>
        </div>

        <DataCollectionForm
          indicatorId={selectedIndicatorId}
          periodId={selectedPeriodId}
          orgId={orgId}
          projectId={projectId}
          userId={userId}
          onSuccess={() => {
            router.push(`/org/${orgId}/projects/${projectId}/data-collection`)
          }}
          onCancel={() => {
            router.push(`/org/${orgId}/projects/${projectId}/data-collection`)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/org/${orgId}/projects/${projectId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>
        </Link>
      </div>

      <Header 
        title="Data Collection" 
        subtitle={project?.name || 'Select an indicator and period to enter data'}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-card rounded-2xl border border-border/70 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Select Indicator & Period</h3>
            <p className="text-sm text-muted-foreground">Choose which data you want to report</p>
          </div>
        </div>

        {indicatorsWithOpenPeriods.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No open reporting periods</p>
            <p className="text-sm text-muted-foreground">
              All indicators have closed periods or no periods defined.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {indicatorsWithOpenPeriods.map((indicator) => {
              const openPeriods = getOpenPeriods(indicator)
              const hasDisaggregations = indicator.disaggregations && indicator.disaggregations.length > 0
              
              return (
                <div key={indicator.id} className="border border-border rounded-lg overflow-hidden">
                  <div className="p-4 bg-muted/30 border-b border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">{indicator.name}</h4>
                        {(indicator.definition || indicator.description) && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {indicator.definition || indicator.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs px-2 py-1 bg-muted rounded">{indicator.type}</span>
                          {getUnitDisplay(indicator) && (
                            <span className="text-xs px-2 py-1 bg-muted rounded">{getUnitDisplay(indicator)}</span>
                          )}
                          {hasDisaggregations && (
                            <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-600 rounded">
                              {indicator.disaggregations?.length} disaggregation{indicator.disaggregations?.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-border/50">
                    {openPeriods.map((period) => (
                      <Link
                        key={period.id}
                        href={`/org/${orgId}/projects/${projectId}/data-collection?indicator=${indicator.id}&period=${period.id}`}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {period.periodKey}
                            </span>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {period.dueDate && (
                            <span className={cn(
                              "text-xs px-2 py-1 rounded",
                              new Date(period.dueDate) < new Date()
                                ? 'bg-red-500/10 text-red-600'
                                : 'bg-green-500/10 text-green-600'
                            )}>
                              Due: {new Date(period.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
