'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Indicator } from '@/lib/types'

interface SubmissionValueInputProps {
  indicator: Indicator | null
  valueNumber: string
  valueText: string
  onValueNumberChange: (value: string) => void
  onValueTextChange: (value: string) => void
  disabled?: boolean
}

export function SubmissionValueInput({
  indicator,
  valueNumber,
  valueText,
  onValueNumberChange,
  onValueTextChange,
  disabled,
}: SubmissionValueInputProps) {
  if (!indicator) return null

  // Handle unit as object or string
  const unitDisplay = typeof indicator.unit === 'object' && indicator.unit
    ? indicator.unit.name || indicator.unit.symbol || 'unit'
    : indicator.unit || 'unit'
  const isTextIndicator = indicator.type === 'qualitative' || unitDisplay === 'text'

  return (
    <div className="space-y-2">
      <Label htmlFor="value" className="text-foreground">
        Value * ({unitDisplay})
      </Label>
      {isTextIndicator ? (
        <textarea
          id="value"
          value={valueText}
          onChange={(e) => onValueTextChange(e.target.value)}
          placeholder="Enter qualitative description or text value..."
          rows={3}
          required={!valueNumber}
          disabled={disabled}
          className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
        />
      ) : (
        <Input
          id="value"
          type="number"
          step="0.01"
          min="0"
          value={valueNumber}
          onChange={(e) => onValueNumberChange(e.target.value)}
          placeholder="0"
          required={!valueText}
          disabled={disabled}
          className="bg-background border-border text-foreground disabled:opacity-50"
        />
      )}
      {(indicator.definition || indicator.description) && (
        <p className="text-xs text-muted-foreground">{indicator.definition || indicator.description}</p>
      )}
    </div>
  )
}
