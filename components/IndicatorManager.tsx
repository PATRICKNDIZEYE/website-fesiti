'use client'
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, X, Eye, ChevronUp, Trash2, Target, AlertCircle, Loader2, Calendar, Pencil, Link2 } from 'lucide-react'
import Link from 'next/link'
import { IndicatorCreationWizard } from './IndicatorCreationWizard'
import { orgApi, disaggregationsApi } from '@/lib/api-helpers'
import { Indicator, IndicatorTarget, Unit, DisaggregationDef } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { ShareableFormManager } from './ShareableFormManager'

interface IndicatorManagerProps {
  projectId: string
  onUpdate?: () => void
  orgId?: string
  initialShowForm?: boolean
  onFormToggle?: (show: boolean) => void
}

export function IndicatorManager({ projectId, onUpdate, orgId, initialShowForm, onFormToggle }: IndicatorManagerProps) {
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(initialShowForm || false)

  useEffect(() => {
    fetchIndicators()
  }, [projectId])

  const fetchIndicators = async () => {
    if (!orgId) {
      console.error('Organization ID is required')
      return
    }
    try {
      setLoading(true)
      const response = await orgApi.get(orgId, `indicators?projectId=${projectId}`)
      setIndicators(response.data)
    } catch (error) {
      console.error('Failed to fetch indicators:', error)
      setError('Failed to load indicators')
    } finally {
      setLoading(false)
    }
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [indicatorToDelete, setIndicatorToDelete] = useState<string | null>(null)

  const handleDeleteClick = (id: string) => {
    setIndicatorToDelete(id)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!indicatorToDelete || !orgId) {
      console.error('Organization ID or indicator ID is required')
      return
    }
    try {
      await orgApi.delete(orgId, `indicators/${indicatorToDelete}`)
      setShowDeleteModal(false)
      setIndicatorToDelete(null)
      fetchIndicators()
      onUpdate?.()
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete indicator')
      setShowDeleteModal(false)
      setIndicatorToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDelete}
        title="Delete Indicator"
        description="Are you sure you want to delete this indicator? This will also delete all associated targets and reports. This action cannot be undone."
        type="delete"
        confirmText="Delete"
        cancelText="Cancel"
      />
      
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Indicators</h3>
        <Button
          onClick={() => {
            const newValue = !showAddForm
            setShowAddForm(newValue)
            onFormToggle?.(newValue)
          }}
          variant="outline"
          size="sm"
          className="border-border"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Indicator
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <IndicatorCreationWizard
        open={showAddForm}
        onOpenChange={(open) => {
          setShowAddForm(open)
          onFormToggle?.(open)
        }}
        projectId={projectId}
        orgId={orgId || ''}
        onSuccess={() => {
          setShowAddForm(false)
          onFormToggle?.(false)
          fetchIndicators()
          onUpdate?.()
        }}
      />

      {indicators.length === 0 && !showAddForm ? (
        <div className="text-center py-8 border border-border rounded-lg bg-card">
          <p className="text-muted-foreground mb-4">No indicators yet</p>
          <Button
            onClick={() => setShowAddForm(true)}
            variant="outline"
            size="sm"
            className="border-border"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Indicator
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {indicators.map((indicator) => (
            <IndicatorCard
              key={indicator.id}
              indicator={indicator}
              onDeleteClick={handleDeleteClick}
              onUpdate={fetchIndicators}
              orgId={orgId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AddIndicatorForm({
  projectId,
  orgId,
  onSuccess,
  onCancel,
}: {
  projectId: string
  orgId?: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'quantitative' as 'quantitative' | 'qualitative' | 'percentage',
    unit: 'number' as 'number' | 'percentage' | 'currency' | 'text',
  })

  const getAvailableUnits = (type: string): string[] => {
    switch (type) {
      case 'quantitative':
        return ['number', 'percentage', 'currency', 'text']
      case 'qualitative':
        return ['text']
      case 'percentage':
        return ['percentage']
      default:
        return ['number', 'percentage', 'currency', 'text']
    }
  }

  const updateFormData = (field: keyof typeof formData, value: string) => {
    const updated = { ...formData, [field]: value }
    
    // If type changes, update unit to match
    if (field === 'type') {
      const type = value as any
      let defaultUnit = 'number'
      
      if (type === 'percentage') {
        defaultUnit = 'percentage'
      } else if (type === 'qualitative') {
        defaultUnit = 'text'
      } else if (type === 'quantitative') {
        defaultUnit = 'number'
      }
      
      updated.unit = defaultUnit as any
    }
    
    setFormData(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.name.trim()) {
        throw new Error('Indicator name is required')
      }

      if (!orgId) {
        console.error('Organization ID is required')
        setError('Organization ID is required')
        return
      }
      await orgApi.post(orgId, 'indicators', {
        ...formData,
        projectId,
      })

      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create indicator')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <h4 className="font-medium text-foreground mb-4">Add New Indicator</h4>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-foreground">Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Number of beneficiaries reached"
            required
            className="bg-background border-border text-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Description</Label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what this indicator measures..."
            rows={2}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-foreground">Type</Label>
                            <select
                              value={formData.type}
                              onChange={(e) => updateFormData('type', e.target.value)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                              <option value="quantitative">Quantitative</option>
                              <option value="qualitative">Qualitative</option>
                              <option value="percentage">Percentage</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-foreground">Unit</Label>
                            <select
                              value={formData.unit}
                              onChange={(e) => updateFormData('unit', e.target.value)}
                              disabled={getAvailableUnits(formData.type).length === 1}
                              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {getAvailableUnits(formData.type).map((unit) => (
                                <option key={unit} value={unit}>
                                  {unit.charAt(0).toUpperCase() + unit.slice(1)}
                                </option>
                              ))}
                            </select>
                            {getAvailableUnits(formData.type).length === 1 && (
                              <p className="text-xs text-muted-foreground">
                                Unit is automatically set for {formData.type} type
                              </p>
                            )}
                          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} className="border-border">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Indicator'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

function IndicatorCard({
  indicator,
  onDeleteClick,
  onUpdate,
  orgId,
}: {
  indicator: Indicator
  onDeleteClick: (id: string) => void
  onUpdate: () => void
  orgId?: string
}) {
  const [showTargetForm, setShowTargetForm] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showShareableForm, setShowShareableForm] = useState(false)
  const [targets, setTargets] = useState<IndicatorTarget[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [unitsLoading, setUnitsLoading] = useState(false)
  
  // Disaggregation state
  const [availableDisaggregations, setAvailableDisaggregations] = useState<DisaggregationDef[]>([])
  const [selectedDisaggregationIds, setSelectedDisaggregationIds] = useState<string[]>(
    indicator.disaggregations?.map(d => d.disaggregationDefId) || []
  )
  const [disaggLoading, setDisaggLoading] = useState(false)
  
  // Get current unit ID
  const getCurrentUnitId = () => {
    const unit = indicator.unit as string | Unit | null
    if (unit && typeof unit === 'object') {
      return unit.id
    }
    return indicator.unitId || ''
  }

  const [editData, setEditData] = useState({
    name: indicator.name,
    description: indicator.definition || indicator.description || '',
    unitId: getCurrentUnitId(),
    direction: indicator.direction || 'increase',
    aggregationRule: indicator.aggregationRule || 'sum',
    formulaExpr: indicator.formulaExpr || '',
    baselineValue: indicator.baselineValue?.toString() || '',
    baselineDate: indicator.baselineDate || '',
    requiresReview: indicator.requiresReview || false,
    isActive: indicator.isActive !== false,
  })
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  useEffect(() => {
    if (indicator.targets) {
      setTargets(indicator.targets)
    }
    // Update selected disaggregations when indicator changes
    setSelectedDisaggregationIds(indicator.disaggregations?.map(d => d.disaggregationDefId) || [])
  }, [indicator])

  useEffect(() => {
    // Reset edit data when indicator changes
    setEditData({
      name: indicator.name,
      description: indicator.definition || indicator.description || '',
      unitId: getCurrentUnitId(),
      direction: indicator.direction || 'increase',
      aggregationRule: indicator.aggregationRule || 'sum',
      formulaExpr: indicator.formulaExpr || '',
      baselineValue: indicator.baselineValue?.toString() || '',
      baselineDate: indicator.baselineDate ? indicator.baselineDate.split('T')[0] : '',
      requiresReview: indicator.requiresReview || false,
      isActive: indicator.isActive !== false,
    })
  }, [indicator])

  // Fetch units and disaggregations when edit form is opened
  useEffect(() => {
    if (showEditForm && orgId) {
      if (units.length === 0) fetchUnits()
      if (availableDisaggregations.length === 0) fetchDisaggregations()
    }
  }, [showEditForm, orgId])

  const fetchUnits = async () => {
    if (!orgId) return
    try {
      setUnitsLoading(true)
      const response = await orgApi.get(orgId, 'units')
      setUnits(response.data || [])
    } catch (err) {
      console.error('Failed to fetch units:', err)
    } finally {
      setUnitsLoading(false)
    }
  }

  const fetchDisaggregations = async () => {
    if (!orgId) return
    try {
      setDisaggLoading(true)
      const response = await disaggregationsApi.listDefinitions(orgId)
      setAvailableDisaggregations(response.data || [])
    } catch (err) {
      console.error('Failed to fetch disaggregations:', err)
    } finally {
      setDisaggLoading(false)
    }
  }

  const toggleDisaggregation = (defId: string) => {
    setSelectedDisaggregationIds(prev => 
      prev.includes(defId) 
        ? prev.filter(id => id !== defId)
        : [...prev, defId]
    )
  }

  // Helper to get unit display
  const getUnitDisplay = () => {
    const unit = indicator.unit as string | Unit | null
    if (unit && typeof unit === 'object') {
      return `${unit.name}${unit.symbol ? ` (${unit.symbol})` : ''}`
    }
    return unit || 'No unit'
  }

  const handleSaveEdit = async () => {
    if (!orgId) return
    if (!editData.name.trim()) {
      setEditError('Name is required')
      return
    }
    if (!editData.unitId) {
      setEditError('Unit is required')
      return
    }
    if (editData.aggregationRule === 'formula' && !editData.formulaExpr.trim()) {
      setEditError('Formula expression is required when using formula aggregation')
      return
    }
    try {
      setSaving(true)
      setEditError('')
      
      // Save indicator data
      await orgApi.patch(orgId, `indicators/${indicator.id}`, {
        name: editData.name,
        definition: editData.description || undefined,
        unitId: editData.unitId,
        direction: editData.direction,
        aggregationRule: editData.aggregationRule,
        formulaExpr: editData.formulaExpr || undefined,
        baselineValue: editData.baselineValue ? parseFloat(editData.baselineValue) : undefined,
        baselineDate: editData.baselineDate || undefined,
        requiresReview: editData.requiresReview,
        isActive: editData.isActive,
      })
      
      // Save disaggregation links
      await disaggregationsApi.linkToIndicator(orgId, indicator.id, selectedDisaggregationIds)
      
      setShowEditForm(false)
      onUpdate()
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update indicator')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
          <h4 className="font-semibold text-foreground hover:text-primary transition-colors">
            {indicator.name}
          </h4>
          {!showDetails && (indicator.definition || indicator.description) && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{indicator.definition || indicator.description}</p>
          )}
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-xs px-2 py-1 bg-muted rounded">{indicator.type}</span>
            <span className="text-xs px-2 py-1 bg-muted rounded">{getUnitDisplay()}</span>
            {indicator.direction && (
              <span className={cn(
                "text-xs px-2 py-1 rounded",
                indicator.direction === 'increase' ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'
              )}>
                {indicator.direction === 'increase' ? '↑ Higher is better' : '↓ Lower is better'}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            title={showDetails ? "Hide details" : "View details"}
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button
            onClick={() => {
              setShowEditForm(!showEditForm)
              if (!showEditForm) setShowDetails(true) // Show details when editing
            }}
            variant="ghost"
            size="sm"
            className={cn(
              "hover:text-primary/80",
              showEditForm ? "text-primary" : "text-muted-foreground"
            )}
            title="Edit indicator"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          {orgId && (
            <Link
              href={`/org/${orgId}/projects/${indicator.projectId}/indicators/${indicator.id}/periods`}
            >
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80"
                title="Manage periods"
              >
                <Calendar className="w-4 h-4" />
              </Button>
            </Link>
          )}
          <Button
            onClick={() => setShowTargetForm(!showTargetForm)}
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80"
            title="Manage targets"
          >
            <Target className="w-4 h-4" />
          </Button>
          {orgId && (
            <Button
              onClick={() => setShowShareableForm(true)}
              variant="ghost"
              size="sm"
              className="text-green-600 hover:text-green-600/80"
              title="Create shareable form"
            >
              <Link2 className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={() => onDeleteClick(indicator.id)}
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive/80"
            title="Delete indicator"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Shareable Form Manager Modal */}
      {showShareableForm && orgId && (
        <ShareableFormManager
          indicator={indicator}
          orgId={orgId}
          onClose={() => setShowShareableForm(false)}
        />
      )}

      {/* Expanded Details View or Edit Form */}
      {showDetails && (
        <div className="mb-4 p-4 bg-muted/30 rounded-lg border border-border/50 space-y-3">
          {showEditForm ? (
            /* Full Edit Form - All Fields */
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground border-b border-border pb-2">Edit Indicator</h4>
              
              {editError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Indicator Name *</Label>
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="bg-background border-border"
                    placeholder="e.g., Number of beneficiaries reached"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Definition / Description</Label>
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground min-h-[80px]"
                    placeholder="Describe what this indicator measures, how it's calculated, and any important notes..."
                  />
                </div>
              </div>

              {/* Unit & Direction */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Unit of Measurement *</Label>
                  <select
                    value={editData.unitId}
                    onChange={(e) => setEditData({ ...editData, unitId: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                  >
                    <option value="">Select a unit...</option>
                    {unitsLoading ? (
                      <option disabled>Loading units...</option>
                    ) : (
                      units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} {unit.symbol ? `(${unit.symbol})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-muted-foreground">A value without units is meaningless</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Direction *</Label>
                  <select
                    value={editData.direction}
                    onChange={(e) => setEditData({ ...editData, direction: e.target.value as 'increase' | 'decrease' })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                  >
                    <option value="increase">Increase (higher is better)</option>
                    <option value="decrease">Decrease (lower is better)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {editData.direction === 'decrease' 
                      ? 'On track when actual ≤ target' 
                      : 'On track when actual ≥ target'}
                  </p>
                </div>
              </div>

              {/* Aggregation */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Aggregation Rule</Label>
                  <select
                    value={editData.aggregationRule}
                    onChange={(e) => setEditData({ ...editData, aggregationRule: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                  >
                    <option value="sum">Sum - Add all values together</option>
                    <option value="avg">Average - Calculate mean value</option>
                    <option value="latest">Latest - Use most recent value</option>
                    <option value="formula">Formula - Custom calculation</option>
                  </select>
                </div>

                {editData.aggregationRule === 'formula' && (
                  <div className="space-y-2">
                    <Label className="text-foreground">Formula Expression *</Label>
                    <Input
                      value={editData.formulaExpr}
                      onChange={(e) => setEditData({ ...editData, formulaExpr: e.target.value })}
                      className="bg-background border-border font-mono"
                      placeholder="e.g., (A + B) / C * 100"
                    />
                  </div>
                )}
              </div>

              {/* Baseline */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Baseline Value</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editData.baselineValue}
                    onChange={(e) => setEditData({ ...editData, baselineValue: e.target.value })}
                    className="bg-background border-border"
                    placeholder="Initial/starting value"
                  />
                  <p className="text-xs text-muted-foreground">The starting point before intervention</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Baseline Date</Label>
                  <Input
                    type="date"
                    value={editData.baselineDate}
                    onChange={(e) => setEditData({ ...editData, baselineDate: e.target.value })}
                    className="bg-background border-border"
                  />
                  <p className="text-xs text-muted-foreground">When baseline was measured</p>
                </div>
              </div>

              {/* Disaggregations */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <Label className="text-foreground">Disaggregation Dimensions</Label>
                <p className="text-xs text-muted-foreground">
                  Select which breakdowns apply to this indicator (e.g., by gender, age group)
                </p>
                {disaggLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading disaggregations...
                  </div>
                ) : availableDisaggregations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No disaggregation dimensions defined yet.{' '}
                    <Link href={`/org/${orgId}/settings/disaggregations`} className="text-primary hover:underline">
                      Create some →
                    </Link>
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableDisaggregations.map((def) => (
                      <label
                        key={def.id}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                          selectedDisaggregationIds.includes(def.id)
                            ? "bg-primary/10 border-primary/50 text-primary"
                            : "bg-muted/30 border-border hover:bg-muted/50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDisaggregationIds.includes(def.id)}
                          onChange={() => toggleDisaggregation(def.id)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{def.name}</span>
                        {def.values && def.values.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({def.values.length} values)
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.requiresReview}
                    onChange={(e) => setEditData({ ...editData, requiresReview: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">Requires Review</span>
                  <span className="text-xs text-muted-foreground">(submissions need approval)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.isActive}
                    onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">Active</span>
                  <span className="text-xs text-muted-foreground">(accepting data)</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditForm(false)
                    setEditError('')
                    // Reset to original values
                    setEditData({
                      name: indicator.name,
                      description: indicator.definition || indicator.description || '',
                      unitId: getCurrentUnitId(),
                      direction: indicator.direction || 'increase',
                      aggregationRule: indicator.aggregationRule || 'sum',
                      formulaExpr: indicator.formulaExpr || '',
                      baselineValue: indicator.baselineValue?.toString() || '',
                      baselineDate: indicator.baselineDate ? indicator.baselineDate.split('T')[0] : '',
                      requiresReview: indicator.requiresReview || false,
                      isActive: indicator.isActive !== false,
                    })
                    // Reset disaggregation selection
                    setSelectedDisaggregationIds(indicator.disaggregations?.map(d => d.disaggregationDefId) || [])
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            /* View Details */
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</p>
                  <p className="text-foreground mt-1">{indicator.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</p>
                  <p className="text-foreground mt-1 capitalize">{indicator.type}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit</p>
                  <p className="text-foreground mt-1">{getUnitDisplay()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Direction</p>
                  <p className="text-foreground mt-1 capitalize">
                    {indicator.direction || 'Not set'} 
                    {indicator.direction && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({indicator.direction === 'increase' ? 'higher is better' : 'lower is better'})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aggregation</p>
                  <p className="text-foreground mt-1 capitalize">{indicator.aggregationRule || 'sum'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Baseline</p>
                  <p className="text-foreground mt-1">
                    {indicator.baselineValue !== undefined && indicator.baselineValue !== null
                      ? `${indicator.baselineValue} ${getUnitDisplay()}`
                      : 'Not set'}
                    {indicator.baselineDate && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (as of {new Date(indicator.baselineDate).toLocaleDateString()})
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {(indicator.definition || indicator.description) && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Definition</p>
                  <p className="text-foreground mt-1 text-sm">{indicator.definition || indicator.description}</p>
                </div>
              )}
              {indicator.formulaExpr && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Formula</p>
                  <code className="text-foreground mt-1 text-sm bg-muted px-2 py-1 rounded block">{indicator.formulaExpr}</code>
                </div>
              )}
              {indicator.disaggregations && indicator.disaggregations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Disaggregations</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {indicator.disaggregations.map((d) => (
                      <span
                        key={d.id}
                        className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20"
                      >
                        {d.definition?.name || 'Unknown'}
                        {d.definition?.values && d.definition.values.length > 0 && (
                          <span className="text-blue-400 ml-1">
                            ({d.definition.values.map(v => v.valueLabel).join(', ')})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 text-xs">
                <span className={cn(
                  "px-2 py-1 rounded",
                  indicator.isActive !== false ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-600'
                )}>
                  {indicator.isActive !== false ? 'Active' : 'Inactive'}
                </span>
                {indicator.requiresReview && (
                  <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-600">
                    Requires Review
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {showTargetForm && (
        <TargetManager
          indicatorId={indicator.id}
          onSuccess={() => {
            setShowTargetForm(false)
            onUpdate()
          }}
          orgId={orgId}
        />
      )}

      {targets.length > 0 && !showDetails && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Targets:</p>
          <div className="space-y-1">
            {targets.map((target) => (
              <div key={target.id} className="text-xs text-muted-foreground">
                {target.targetValue}
                {target.indicatorPeriod && ` (${target.indicatorPeriod.periodKey})`}
                {target.notes && ` - ${target.notes}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TargetManager({
  indicatorId,
  onSuccess,
  orgId,
}: {
  indicatorId: string
  onSuccess: () => void
  orgId?: string
}) {
  const [targets, setTargets] = useState<IndicatorTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [targetToDelete, setTargetToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchTargets()
  }, [indicatorId, orgId])

  const fetchTargets = async () => {
    if (!orgId) {
      console.error('Organization ID is required')
      return
    }
    try {
      setLoading(true)
      const indicator = await orgApi.get(orgId, `indicators/${indicatorId}`)
      setTargets(indicator.data.targets || [])
    } catch (error) {
      console.error('Failed to fetch targets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (targetId: string) => {
    setTargetToDelete(targetId)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!targetToDelete || !orgId) {
      console.error('Organization ID or target ID is required')
      return
    }

    try {
      await orgApi.delete(orgId, `indicators/targets/${targetToDelete}`)
      setShowDeleteModal(false)
      setTargetToDelete(null)
      await fetchTargets()
      onSuccess()
    } catch (error: any) {
      console.error('Failed to delete target:', error)
      alert(error.response?.data?.message || 'Failed to delete target')
      setShowDeleteModal(false)
      setTargetToDelete(null)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDelete}
        title="Delete Target"
        description="Are you sure you want to delete this target? This action cannot be undone."
        type="delete"
        confirmText="Delete"
        cancelText="Cancel"
      />
      
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium text-foreground">Targets</h5>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant="outline"
          size="sm"
          className="border-border"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Target
        </Button>
      </div>

      {showAddForm && (
        <AddTargetForm
          indicatorId={indicatorId}
          onSuccess={() => {
            setShowAddForm(false)
            fetchTargets()
            onSuccess()
          }}
          onCancel={() => setShowAddForm(false)}
          orgId={orgId}
        />
      )}

      {targets.length === 0 ? (
        <p className="text-xs text-muted-foreground">No targets set yet</p>
      ) : (
        <div className="space-y-2">
          {targets.map((target) => (
            <div key={target.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
              <div>
                <span className="font-medium text-foreground">{target.targetValue}</span>
                {target.indicatorPeriod && (
                  <span className="text-muted-foreground ml-2">
                    ({target.indicatorPeriod.periodKey})
                  </span>
                )}
                {target.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{target.notes}</p>
                )}
              </div>
              <Button
                onClick={() => handleDeleteClick(target.id)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AddTargetForm({
  indicatorId,
  onSuccess,
  onCancel,
  orgId,
}: {
  indicatorId: string
  onSuccess: () => void
  onCancel: () => void
  orgId?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    value: '',
    targetDate: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.value || !formData.targetDate) {
        throw new Error('Value and target date are required')
      }

      if (!orgId) {
        console.error('Organization ID is required')
        return
      }
      await orgApi.post(orgId, 'indicators/targets', {
        indicatorId,
        targetValue: parseFloat(formData.value),
        targetDate: formData.targetDate || undefined,
        notes: formData.notes || undefined,
      })

      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create target')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-3 bg-muted/30 rounded border border-border">
      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-foreground">Target Value *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="0"
              required
              className="bg-background border-border text-foreground text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-foreground">Target Date *</Label>
            <Input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              required
              className="bg-background border-border text-foreground text-sm"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-foreground">Notes</Label>
          <Input
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Optional notes..."
            className="bg-background border-border text-foreground text-sm"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
          </Button>
        </div>
      </form>
    </div>
  )
}
