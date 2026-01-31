'use client'

import { useState, useEffect } from 'react'
import { Loader2, FileSpreadsheet, ChevronDown, ChevronRight, Download } from 'lucide-react'
import { reportsApi } from '@/lib/api-helpers'
import { cn } from '@/lib/utils'
import { exportPittToExcel } from '@/utils/pittToExcel'
import { Button } from '@/components/ui/button'

interface PittPeriodRow {
  periodId: string
  periodKey: string
  startDate: string
  endDate: string
  year: number
  quarter?: number
  target?: number
  actual?: number
  deviationPercent?: number | null
  narrative?: string
}

interface PittAnnualTotal {
  year: number
  target?: number
  actual?: number
  deviationPercent?: number | null
}

interface PittIndicator {
  id: string
  name: string
  definition?: string | null
  unit?: string | null
  unitSymbol?: string | null
  frequency: string
  baseline?: number | null
  baselineDate?: string | null
  periods: PittPeriodRow[]
  annualTotalsByYear: PittAnnualTotal[]
  lifeOfProject?: { target?: number; actual?: number; deviationPercent?: number | null }
}

interface PittObjective {
  id: string
  title: string
  description?: string | null
  sortOrder: number
  indicators: PittIndicator[]
}

interface PittResponse {
  project: { id: string; name: string }
  years: number[]
  objectives: PittObjective[]
}

export function PittView({ orgId, projectId }: { orgId: string; projectId: string }) {
  const [data, setData] = useState<PittResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    reportsApi
      .getPitt(orgId, projectId)
      .then((res) => {
        if (!cancelled) {
          setData(res.data)
          setExpandedObjectives(new Set((res.data?.objectives ?? []).map((o) => o.id)))
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load PITT data')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orgId, projectId])

  const toggleObjective = (id: string) => {
    setExpandedObjectives((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    )
  }

  if (!data) {
    return <div className="text-muted-foreground">No data</div>
  }

  const { project, years, objectives } = data
  const unitLabel = (ind: PittIndicator) => ind.unitSymbol || ind.unit || ''

  const handleExport = () => {
    if (!data) return
    exportPittToExcel(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Performance Indicator Tracking Table (PITT)</h1>
            <p className="text-muted-foreground">{project.name}</p>
          </div>
        </div>
        <Button onClick={handleExport} variant="outline" className="shrink-0">
          <Download className="w-4 h-4 mr-2" />
          Export PITT (Excel)
        </Button>
      </div>

      {objectives.length === 0 ? (
        <p className="text-muted-foreground">No objectives or indicators yet. Add indicators and link them to results (objectives) to see the PITT.</p>
      ) : (
        <div className="space-y-4">
          {objectives.map((obj) => {
            const isExpanded = expandedObjectives.has(obj.id)
            return (
              <div key={obj.id} className="rounded-lg border border-border bg-card overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center gap-2 p-4 text-left font-semibold text-foreground hover:bg-muted/50"
                  onClick={() => toggleObjective(obj.id)}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {obj.title}
                </button>
                {isExpanded && (
                  <div className="border-t border-border">
                    {obj.indicators.map((ind) => (
                      <div key={ind.id} className="border-b border-border last:border-b-0">
                        <div className="p-4 bg-muted/20">
                          <p className="font-medium text-foreground">{ind.name}</p>
                          {ind.definition && <p className="text-sm text-muted-foreground mt-1">{ind.definition}</p>}
                          <p className="text-xs text-muted-foreground mt-1">
                            Frequency: {ind.frequency}
                            {ind.baseline != null && ` · Baseline: ${ind.baseline}${unitLabel(ind) ? ` ${unitLabel(ind)}` : ''}`}
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-muted/50">
                                <th className="text-left p-2 border-b border-border font-medium">Period</th>
                                <th className="text-right p-2 border-b border-border font-medium">Target</th>
                                <th className="text-right p-2 border-b border-border font-medium">Actual</th>
                                <th className="text-right p-2 border-b border-border font-medium">Deviation %</th>
                                <th className="text-left p-2 border-b border-border font-medium max-w-[200px]">Comment</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ind.periods.map((row) => (
                                <tr key={row.periodId} className="border-b border-border/50 hover:bg-muted/20">
                                  <td className="p-2">{row.periodKey}</td>
                                  <td className="p-2 text-right">{row.target != null ? row.target : '—'}</td>
                                  <td className="p-2 text-right">{row.actual != null ? row.actual : '—'}</td>
                                  <td className={cn('p-2 text-right', row.deviationPercent != null && row.deviationPercent < 0 && 'text-destructive', row.deviationPercent != null && row.deviationPercent > 0 && 'text-green-600')}>
                                    {row.deviationPercent != null ? `${row.deviationPercent > 0 ? '+' : ''}${row.deviationPercent}%` : '—'}
                                  </td>
                                  <td className="p-2 text-muted-foreground max-w-[200px] truncate" title={row.narrative}>{row.narrative || '—'}</td>
                                </tr>
                              ))}
                              {ind.annualTotalsByYear.length > 0 && (
                                <>
                                  {ind.annualTotalsByYear.map((a) => (
                                    <tr key={a.year} className="border-b border-border/50 bg-muted/30 font-medium">
                                      <td className="p-2">FY {a.year} (Annual)</td>
                                      <td className="p-2 text-right">{a.target != null ? a.target : '—'}</td>
                                      <td className="p-2 text-right">{a.actual != null ? a.actual : '—'}</td>
                                      <td className={cn('p-2 text-right', a.deviationPercent != null && a.deviationPercent < 0 && 'text-destructive', a.deviationPercent != null && a.deviationPercent > 0 && 'text-green-600')}>
                                        {a.deviationPercent != null ? `${a.deviationPercent > 0 ? '+' : ''}${a.deviationPercent}%` : '—'}
                                      </td>
                                      <td className="p-2">—</td>
                                    </tr>
                                  ))}
                                </>
                              )}
                              {ind.lifeOfProject && (
                                <tr className="bg-primary/10 font-semibold">
                                  <td className="p-2">Life of Project</td>
                                  <td className="p-2 text-right">{ind.lifeOfProject.target != null ? ind.lifeOfProject.target : '—'}</td>
                                  <td className="p-2 text-right">{ind.lifeOfProject.actual != null ? ind.lifeOfProject.actual : '—'}</td>
                                  <td className={cn('p-2 text-right', ind.lifeOfProject.deviationPercent != null && ind.lifeOfProject.deviationPercent < 0 && 'text-destructive', ind.lifeOfProject.deviationPercent != null && ind.lifeOfProject.deviationPercent > 0 && 'text-green-600')}>
                                    {ind.lifeOfProject.deviationPercent != null ? `${ind.lifeOfProject.deviationPercent > 0 ? '+' : ''}${ind.lifeOfProject.deviationPercent}%` : '—'}
                                  </td>
                                  <td className="p-2">—</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
