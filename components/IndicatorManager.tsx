'use client'
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, X, Edit2, Trash2, Target, AlertCircle, Loader2 } from 'lucide-react'
import { orgApi } from '@/lib/api-helpers'
import { Indicator, Target as TargetType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ConfirmationModal } from '@/components/ConfirmationModal'

interface IndicatorManagerProps {
  projectId: string
  onUpdate?: () => void
  orgId?: string
}

export function IndicatorManager({ projectId, onUpdate, orgId }: IndicatorManagerProps) {
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

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
          onClick={() => setShowAddForm(!showAddForm)}
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

      {showAddForm && (
        <AddIndicatorForm
          projectId={projectId}
          orgId={orgId}
          onSuccess={() => {
            setShowAddForm(false)
            fetchIndicators()
            onUpdate?.()
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

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
              onDelete={handleDelete}
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
  onDelete,
  onUpdate,
  orgId,
}: {
  indicator: Indicator
  onDelete: (id: string) => void
  onUpdate: () => void
  orgId?: string
}) {
  const [showTargetForm, setShowTargetForm] = useState(false)
  const [targets, setTargets] = useState<TargetType[]>([])

  useEffect(() => {
    if (indicator.targets) {
      setTargets(indicator.targets)
    }
  }, [indicator])

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{indicator.name}</h4>
          {indicator.description && (
            <p className="text-sm text-muted-foreground mt-1">{indicator.description}</p>
          )}
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-xs px-2 py-1 bg-muted rounded">{indicator.type}</span>
            <span className="text-xs px-2 py-1 bg-muted rounded">{indicator.unit}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            onClick={() => setShowTargetForm(!showTargetForm)}
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80"
          >
            <Target className="w-4 h-4 mr-1" />
            Targets
          </Button>
          <Button
            onClick={() => onDelete(indicator.id)}
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive/80"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

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

      {targets.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Targets:</p>
          <div className="space-y-1">
            {targets.map((target) => (
              <div key={target.id} className="text-xs text-muted-foreground">
                {target.value} by {new Date(target.targetDate).toLocaleDateString()}
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
  const [targets, setTargets] = useState<TargetType[]>([])
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
      await orgApi.delete(orgId, `indicators/${indicatorId}/targets/${targetToDelete}`)
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
                <span className="font-medium text-foreground">{target.value}</span>
                <span className="text-muted-foreground ml-2">
                  by {new Date(target.targetDate).toLocaleDateString()}
                </span>
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
      await orgApi.post(orgId, `indicators/${indicatorId}/targets`, {
        value: parseFloat(formData.value),
        targetDate: formData.targetDate,
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
