'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { IndicatorPeriodManager } from '@/components/IndicatorPeriodManager'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { orgApi } from '@/lib/api-helpers'
import { Indicator } from '@/lib/types'
import Link from 'next/link'

export default function IndicatorPeriodsPage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string
  const projectId = params.id as string
  const indicatorId = params.indicatorId as string
  const [indicator, setIndicator] = useState<Indicator | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (!orgId || !indicatorId) {
      console.error('Organization ID or Indicator ID not found in route')
      return
    }

    fetchIndicator()
  }, [indicatorId, orgId, router])

  const fetchIndicator = async () => {
    try {
      const response = await orgApi.get(orgId, `indicators/${indicatorId}`)
      setIndicator(response.data)
    } catch (error) {
      console.error('Failed to fetch indicator:', error)
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

  if (!indicator) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground">Indicator not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/org/${orgId}/projects/${projectId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Reporting Periods</h1>
          <p className="text-muted-foreground mt-1">{indicator.name}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/70 p-6">
        <IndicatorPeriodManager
          indicatorId={indicatorId}
          orgId={orgId}
          onUpdate={fetchIndicator}
        />
      </div>
    </div>
  )
}
