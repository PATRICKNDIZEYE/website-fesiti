'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IndicatorFrequency } from '@/lib/types'
import { Plus, Trash2, RefreshCw } from 'lucide-react'

interface Period {
  periodKey: string
  startDate: string
  endDate: string
  dueDate: string
}

interface PeriodsStepProps {
  periods: Period[]
  scheduleFrequency: IndicatorFrequency
  dueDaysAfterPeriodEnd: number
  onChange: (periods: Period[]) => void
  onRegenerate: () => void
}

export function PeriodsStep({
  periods,
  scheduleFrequency,
  dueDaysAfterPeriodEnd,
  onChange,
  onRegenerate,
}: PeriodsStepProps) {
  const updatePeriod = (index: number, field: keyof Period, value: string) => {
    const updated = [...periods]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const addPeriod = () => {
    const today = new Date()
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const dueDate = new Date(endOfMonth)
    dueDate.setDate(dueDate.getDate() + dueDaysAfterPeriodEnd)

    const newPeriod: Period = {
      periodKey: `Custom-${periods.length + 1}`,
      startDate: today.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
    }
    onChange([...periods, newPeriod])
  }

  const removePeriod = (index: number) => {
    const updated = periods.filter((_, i) => i !== index)
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Review and edit the generated periods. Add or remove as needed.
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            className="border-border"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Regenerate
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPeriod}
            className="border-border text-primary"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Period
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {periods.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No periods created yet.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPeriod}
              className="mt-2"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add First Period
            </Button>
          </div>
        ) : (
          periods.map((period, index) => (
            <div key={index} className="border border-border rounded-lg p-3 bg-card">
              <div className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Period Key</Label>
                    <Input
                      value={period.periodKey}
                      onChange={(e) => updatePeriod(index, 'periodKey', e.target.value)}
                      className="bg-background border-border text-foreground text-sm h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Start Date</Label>
                    <Input
                      type="date"
                      value={period.startDate}
                      onChange={(e) => updatePeriod(index, 'startDate', e.target.value)}
                      className="bg-background border-border text-foreground text-sm h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">End Date</Label>
                    <Input
                      type="date"
                      value={period.endDate}
                      onChange={(e) => updatePeriod(index, 'endDate', e.target.value)}
                      className="bg-background border-border text-foreground text-sm h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Due Date</Label>
                    <Input
                      type="date"
                      value={period.dueDate}
                      onChange={(e) => updatePeriod(index, 'dueDate', e.target.value)}
                      className="bg-background border-border text-foreground text-sm h-8"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePeriod(index)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-5 h-8 w-8 p-0"
                  title="Remove period"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {periods.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {periods.length} period(s) will be created
        </p>
      )}
    </div>
  )
}
