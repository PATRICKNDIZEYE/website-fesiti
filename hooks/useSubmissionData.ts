import { useState, useEffect } from 'react'
import { orgApi } from '@/lib/api-helpers'
import { Project, Indicator, IndicatorPeriod } from '@/lib/types'

export function useSubmissionData(orgId: string, projectId?: string, indicatorId?: string) {
  const [projects, setProjects] = useState<Project[]>([])
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [periods, setPeriods] = useState<IndicatorPeriod[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (orgId) {
      fetchProjects()
    }
  }, [orgId])

  useEffect(() => {
    if (projectId && orgId) {
      fetchIndicators(projectId)
    }
  }, [projectId, orgId])

  useEffect(() => {
    if (indicatorId && orgId) {
      fetchPeriods(indicatorId)
    }
  }, [indicatorId, orgId])

  const fetchProjects = async () => {
    try {
      const response = await orgApi.get(orgId, 'projects')
      setProjects(response.data)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const fetchIndicators = async (projectId: string) => {
    try {
      setLoading(true)
      const response = await orgApi.get(orgId, `indicators?projectId=${projectId}`)
      setIndicators(response.data)
    } catch (error) {
      console.error('Failed to fetch indicators:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPeriods = async (indicatorId: string) => {
    try {
      setLoading(true)
      const response = await orgApi.get(orgId, `indicators/${indicatorId}`)
      const allPeriods = response.data.periods || []
      const openPeriods = allPeriods.filter((p: IndicatorPeriod) => p.status === 'open')
      setPeriods(openPeriods)
    } catch (error) {
      console.error('Failed to fetch periods:', error)
    } finally {
      setLoading(false)
    }
  }

  return { projects, indicators, periods, loading, fetchIndicators, fetchPeriods }
}
