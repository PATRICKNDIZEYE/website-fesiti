'use client'

import { Label } from '@/components/ui/label'
import { Project, Indicator, IndicatorPeriod } from '@/lib/types'

interface SubmissionSelectorsProps {
  projects: Project[]
  indicators: Indicator[]
  periods: IndicatorPeriod[]
  selectedProjectId: string
  selectedIndicatorId: string
  selectedPeriodId: string
  onProjectChange: (projectId: string) => void
  onIndicatorChange: (indicatorId: string) => void
  onPeriodChange: (periodId: string) => void
  initialProjectId?: string
  initialIndicatorId?: string
  initialPeriodId?: string
  disabled?: boolean
}

export function SubmissionSelectors({
  projects,
  indicators,
  periods,
  selectedProjectId,
  selectedIndicatorId,
  selectedPeriodId,
  onProjectChange,
  onIndicatorChange,
  onPeriodChange,
  initialProjectId,
  initialIndicatorId,
  initialPeriodId,
  disabled,
}: SubmissionSelectorsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="project" className="text-foreground">Project *</Label>
          <select
            id="project"
            value={selectedProjectId}
            onChange={(e) => onProjectChange(e.target.value)}
            required
            disabled={!!initialProjectId || disabled}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="indicator" className="text-foreground">Indicator *</Label>
          <select
            id="indicator"
            value={selectedIndicatorId}
            onChange={(e) => onIndicatorChange(e.target.value)}
            required
            disabled={!selectedProjectId || !!initialIndicatorId || disabled}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          >
            <option value="">Select an indicator</option>
            {indicators.map((indicator) => (
              <option key={indicator.id} value={indicator.id}>
                {indicator.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="period" className="text-foreground">Reporting Period *</Label>
        <select
          id="period"
          value={selectedPeriodId}
          onChange={(e) => onPeriodChange(e.target.value)}
          required
          disabled={!selectedIndicatorId || !!initialPeriodId || disabled}
          className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
        >
          <option value="">Select a period</option>
          {periods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.periodKey} ({new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()})
            </option>
          ))}
        </select>
        {periods.length === 0 && selectedIndicatorId && (
          <p className="text-xs text-muted-foreground">
            No open periods available. Create a period first or select a different indicator.
          </p>
        )}
      </div>
    </>
  )
}
