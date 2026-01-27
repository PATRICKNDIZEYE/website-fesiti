'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { IndicatorPeriodManager } from '@/components/IndicatorPeriodManager'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { orgApi } from '@/lib/api-helpers'
import { Indicator, Project } from '@/lib/types'
import Link from 'next/link'

export default function ProjectPeriodsPage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (!orgId || !projectId) {
      console.error('Organization ID or Project ID not found in route')
      return
    }

    fetchData()
  }, [projectId, orgId, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [projectRes, indicatorsRes] = await Promise.all([
        orgApi.get(orgId, `projects/${projectId}`),
        orgApi.get(orgId, `indicators?projectId=${projectId}`),
      ])
      setProject(projectRes.data)
      setIndicators(indicatorsRes.data || [])
      if (indicatorsRes.data && indicatorsRes.data.length > 0) {
        setSelectedIndicatorId(indicatorsRes.data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground">Project not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header 
        title="Reporting Periods" 
        subtitle={`Manage reporting periods for indicators in ${project.name}`}
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/org/${orgId}/projects/${projectId}`}
            className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Program</span>
          </Link>
        </div>

        <div className="bg-card rounded-2xl border border-border/70 p-6">
          {indicators.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No indicators found for this project.</p>
              <Link
                href={`/org/${orgId}/projects/${projectId}`}
                className="text-primary hover:underline"
              >
                Create an indicator first
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Select Indicator</label>
                <select
                  value={selectedIndicatorId}
                  onChange={(e) => setSelectedIndicatorId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {indicators.map((indicator) => (
                    <option key={indicator.id} value={indicator.id}>
                      {indicator.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedIndicatorId && (
                <div className="mt-6">
                  <IndicatorPeriodManager
                    indicatorId={selectedIndicatorId}
                    orgId={orgId}
                    onUpdate={fetchData}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
