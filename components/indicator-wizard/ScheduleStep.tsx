'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IndicatorFrequency, CalendarType } from '@/lib/types'

interface ScheduleStepProps {
  data: {
    frequency: IndicatorFrequency
    calendarType: CalendarType
    dueDaysAfterPeriodEnd: number
    graceDays: number
    isOpenOnCreate: boolean
  }
  onChange: (field: string, value: any) => void
}

export function ScheduleStep({ data, onChange }: ScheduleStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-foreground">Reporting Frequency *</Label>
        <select
          value={data.frequency}
          onChange={(e) => onChange('frequency', e.target.value as IndicatorFrequency)}
          className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Calendar Type</Label>
        <select
          value={data.calendarType}
          onChange={(e) => onChange('calendarType', e.target.value as CalendarType)}
          className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
        >
          <option value="gregorian">Gregorian</option>
          <option value="fiscal">Fiscal</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">Due Days After Period End</Label>
          <Input
            type="number"
            min="0"
            value={data.dueDaysAfterPeriodEnd}
            onChange={(e) => onChange('dueDaysAfterPeriodEnd', parseInt(e.target.value) || 0)}
            className="bg-background border-border text-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Grace Days</Label>
          <Input
            type="number"
            min="0"
            value={data.graceDays}
            onChange={(e) => onChange('graceDays', parseInt(e.target.value) || 0)}
            className="bg-background border-border text-foreground"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isOpenOnCreate"
          checked={data.isOpenOnCreate}
          onChange={(e) => onChange('isOpenOnCreate', e.target.checked)}
          className="w-4 h-4 rounded border-border text-primary"
        />
        <Label htmlFor="isOpenOnCreate" className="cursor-pointer">
          Automatically open periods when created
        </Label>
      </div>
    </div>
  )
}
