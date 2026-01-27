'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Plus, X, Loader2 } from 'lucide-react'
import { Unit } from '@/lib/types'
import { orgApi } from '@/lib/api-helpers'

interface IndicatorDetailsStepProps {
  data: {
    name: string
    definition: string
    unitId: string
    direction: 'increase' | 'decrease'
    aggregationRule: 'sum' | 'avg' | 'latest' | 'formula'
    formulaExpr: string
    baselineValue: string
    baselineDate: string
    requiresReview: boolean
    isActive: boolean
  }
  units: Unit[]
  unitsLoading: boolean
  orgId: string
  onChange: (field: string, value: any) => void
  onUnitsRefresh: () => Promise<void>
}

export function IndicatorDetailsStep({ data, units, unitsLoading, orgId, onChange, onUnitsRefresh }: IndicatorDetailsStepProps) {
  // Ensure units is always an array
  const safeUnits = Array.isArray(units) ? units : []
  const selectedUnit = safeUnits.find(u => u.id === data.unitId)
  const [showCreateUnit, setShowCreateUnit] = useState(false)
  const [newUnit, setNewUnit] = useState({ name: '', symbol: '', unitType: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const handleCreateUnit = async () => {
    if (!newUnit.name.trim()) {
      setCreateError('Unit name is required')
      return
    }

    setCreating(true)
    setCreateError('')

    try {
      const response = await orgApi.post(orgId, 'units', {
        name: newUnit.name.trim(),
        symbol: newUnit.symbol.trim() || undefined,
        unitType: newUnit.unitType.trim() || undefined,
      })

      // Refresh units list
      await onUnitsRefresh()

      // Auto-select the newly created unit
      onChange('unitId', response.data.id)

      // Reset and close
      setNewUnit({ name: '', symbol: '', unitType: '' })
      setShowCreateUnit(false)
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create unit')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-foreground">Indicator Name *</Label>
        <Input
          value={data.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g., Cost per beneficiary (USD)"
          required
          className="bg-background border-border text-foreground"
        />
        <p className="text-xs text-muted-foreground">
          Include the unit in the name for clarity (e.g., "Cost per beneficiary (USD)")
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-foreground">Unit of Measurement *</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateUnit(true)}
            className="text-primary hover:text-primary/80 h-auto py-1 px-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            Create new unit
          </Button>
        </div>

        {/* Create Unit Inline Modal */}
        {showCreateUnit && (
          <div className="border border-primary/30 rounded-lg p-4 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">Create New Unit</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateUnit(false)
                  setCreateError('')
                  setNewUnit({ name: '', symbol: '', unitType: '' })
                }}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {createError && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Name *</Label>
                <Input
                  value={newUnit.name}
                  onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                  placeholder="e.g., USD per beneficiary"
                  className="bg-background border-border text-foreground h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Symbol</Label>
                <Input
                  value={newUnit.symbol}
                  onChange={(e) => setNewUnit({ ...newUnit, symbol: e.target.value })}
                  placeholder="e.g., USD/ben"
                  className="bg-background border-border text-foreground h-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Type (optional)</Label>
              <select
                value={newUnit.unitType}
                onChange={(e) => setNewUnit({ ...newUnit, unitType: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm h-9"
              >
                <option value="">Select type...</option>
                <option value="currency">Currency</option>
                <option value="count">Count/Number</option>
                <option value="percentage">Percentage</option>
                <option value="ratio">Ratio</option>
                <option value="time">Time</option>
                <option value="distance">Distance</option>
                <option value="weight">Weight</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateUnit(false)
                  setCreateError('')
                  setNewUnit({ name: '', symbol: '', unitType: '' })
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCreateUnit}
                disabled={creating || !newUnit.name.trim()}
              >
                {creating ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 mr-1" />
                    Create Unit
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {!showCreateUnit && (
          <>
            <select
              value={data.unitId}
              onChange={(e) => onChange('unitId', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              required
            >
              <option value="">Select a unit...</option>
              {unitsLoading ? (
                <option disabled>Loading units...</option>
              ) : safeUnits.length === 0 ? (
                <option disabled>No units available - create one above</option>
              ) : (
                safeUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} {unit.symbol ? `(${unit.symbol})` : ''}
                  </option>
                ))
              )}
            </select>
            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-700 dark:text-amber-400">
                A value without units is meaningless. Every indicator must have a unit of measurement.
              </AlertDescription>
            </Alert>
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Definition</Label>
        <textarea
          value={data.definition}
          onChange={(e) => onChange('definition', e.target.value)}
          placeholder="Describe what this indicator measures and how it's calculated..."
          rows={3}
          className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">Direction *</Label>
          <select
            value={data.direction}
            onChange={(e) => onChange('direction', e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
          >
            <option value="increase">Increase (higher is better)</option>
            <option value="decrease">Decrease (lower is better)</option>
          </select>
          <p className="text-xs text-muted-foreground">
            {data.direction === 'decrease' 
              ? 'Progress: On track if actual ≤ target' 
              : 'Progress: On track if actual ≥ target'}
          </p>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Aggregation Rule *</Label>
          <select
            value={data.aggregationRule}
            onChange={(e) => onChange('aggregationRule', e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
          >
            <option value="sum">Sum</option>
            <option value="avg">Average</option>
            <option value="latest">Latest</option>
            <option value="formula">Formula</option>
          </select>
        </div>
      </div>

      {data.aggregationRule === 'formula' && (
        <div className="space-y-2">
          <Label className="text-foreground">Formula Expression *</Label>
          <Input
            value={data.formulaExpr}
            onChange={(e) => onChange('formulaExpr', e.target.value)}
            placeholder="e.g., total_cost / beneficiaries"
            className="bg-background border-border text-foreground"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">
            Baseline Value {selectedUnit?.symbol ? `(${selectedUnit.symbol})` : ''}
          </Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={data.baselineValue}
            onChange={(e) => onChange('baselineValue', e.target.value)}
            placeholder="0"
            className="bg-background border-border text-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Baseline Date</Label>
          <Input
            type="date"
            value={data.baselineDate}
            onChange={(e) => onChange('baselineDate', e.target.value)}
            className="bg-background border-border text-foreground"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="requiresReview"
            checked={data.requiresReview}
            onChange={(e) => onChange('requiresReview', e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary"
          />
          <Label htmlFor="requiresReview" className="cursor-pointer">Requires Review</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            checked={data.isActive}
            onChange={(e) => onChange('isActive', e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary"
          />
          <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
        </div>
      </div>
    </div>
  )
}
