'use client'

import { Unit } from '@/lib/types'
import type { ResultsNode } from '@/lib/types'

interface ReviewStepProps {
  indicatorData: {
    name: string
    unitId: string
    resultsNodeId?: string
    direction: string
    aggregationRule: string
    baselineValue: string
  }
  scheduleData: {
    frequency: string
    calendarType: string
  }
  periodsCount: number
  units: Unit[]
  resultsNodes?: ResultsNode[]
}

export function ReviewStep({ indicatorData, scheduleData, periodsCount, units, resultsNodes = [] }: ReviewStepProps) {
  // Ensure units is always an array
  const safeUnits = Array.isArray(units) ? units : []
  const selectedUnit = safeUnits.find(u => u.id === indicatorData.unitId)
  const selectedObjective = resultsNodes.find(n => n.id === indicatorData.resultsNodeId)

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg p-4 bg-card">
        <h4 className="font-semibold text-foreground mb-3">Indicator Details</h4>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Name:</span>{' '}
            <span className="ml-2 font-medium">{indicatorData.name}</span>
          </div>
          {selectedObjective && (
            <div>
              <span className="text-muted-foreground">Project objective:</span>{' '}
              <span className="ml-2">{selectedObjective.title}{selectedObjective.code ? ` (${selectedObjective.code})` : ''}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Unit:</span>{' '}
            <span className="ml-2 font-medium text-primary">
              {selectedUnit ? `${selectedUnit.name} ${selectedUnit.symbol ? `(${selectedUnit.symbol})` : ''}` : 'Not selected'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Direction:</span>{' '}
            <span className="ml-2 capitalize">{indicatorData.direction}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              ({indicatorData.direction === 'decrease' ? 'lower is better' : 'higher is better'})
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Aggregation:</span>{' '}
            <span className="ml-2 capitalize">{indicatorData.aggregationRule}</span>
          </div>
          {indicatorData.baselineValue && (
            <div>
              <span className="text-muted-foreground">Baseline:</span>{' '}
              <span className="ml-2">{indicatorData.baselineValue} {selectedUnit?.symbol || ''}</span>
            </div>
          )}
        </div>
      </div>

      <div className="border border-border rounded-lg p-4 bg-card">
        <h4 className="font-semibold text-foreground mb-3">Schedule</h4>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Frequency:</span>{' '}
            <span className="ml-2 capitalize">{scheduleData.frequency}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Calendar:</span>{' '}
            <span className="ml-2 capitalize">{scheduleData.calendarType}</span>
          </div>
        </div>
      </div>

      <div className="border border-border rounded-lg p-4 bg-card">
        <h4 className="font-semibold text-foreground mb-3">Periods</h4>
        <p className="text-sm text-muted-foreground">
          {periodsCount} reporting period(s) will be created
        </p>
      </div>
    </div>
  )
}
