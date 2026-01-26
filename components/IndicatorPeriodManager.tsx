'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, X, Calendar, Target, AlertCircle, Loader2, Lock, Unlock } from 'lucide-react'
import { orgApi, indicatorPeriodsApi } from '@/lib/api-helpers'
import { IndicatorPeriod, Indicator } from '@/lib/types'
import { ConfirmationModal } from '@/components/ConfirmationModal'

interface IndicatorPeriodManagerProps {
  indicatorId: string
  orgId: string
  onUpdate?: () => void
}

export function IndicatorPeriodManager({ indicatorId, orgId, onUpdate }: IndicatorPeriodManagerProps) {
  const [periods, setPeriods] = useState<IndicatorPeriod[]>([])
  const [indicator, setIndicator] = useState<Indicator | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchIndicatorAndPeriods()
  }, [indicatorId, orgId])

  const fetchIndicatorAndPeriods = async () => {
    try {
      setLoading(true)
      const response = await orgApi.get(orgId, `indicators/${indicatorId}`)
      setIndicator(response.data)
      setPeriods(response.data.periods || [])
    } catch (error) {
      console.error('Failed to fetch indicator periods:', error)
      setError('Failed to load periods')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (periodId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN'
      await indicatorPeriodsApi.updateStatus(orgId, periodId, newStatus as 'OPEN' | 'CLOSED')
      fetchIndicatorAndPeriods()
      onUpdate?.()
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update period status')
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Reporting Periods</h3>
          {indicator && (
            <p className="text-sm text-muted-foreground mt-1">{indicator.name}</p>
          )}
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant="outline"
          size="sm"
          className="border-border"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Period
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showAddForm && (
        <PeriodCreator
          indicatorId={indicatorId}
          orgId={orgId}
          onSuccess={() => {
            setShowAddForm(false)
            fetchIndicatorAndPeriods()
            onUpdate?.()
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {periods.length === 0 && !showAddForm ? (
        <div className="text-center py-8 border border-border rounded-lg bg-card">
          <p className="text-muted-foreground mb-4">No periods yet</p>
          <Button
            onClick={() => setShowAddForm(true)}
            variant="outline"
            size="sm"
            className="border-border"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Period
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {periods.map((period) => (
            <PeriodCard
              key={period.id}
              period={period}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PeriodCard({
  period,
  onToggleStatus,
}: {
  period: IndicatorPeriod
  onToggleStatus: (id: string, status: string) => void
}) {
  const [toggling, setToggling] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    try {
      await onToggleStatus(period.id, period.status)
    } finally {
      setToggling(false)
    }
  }

  const startDate = new Date(period.startDate).toLocaleDateString()
  const endDate = new Date(period.endDate).toLocaleDateString()
  const dueDate = period.dueDate ? new Date(period.dueDate).toLocaleDateString() : null
  const submissionCount = period.submissions?.length || 0

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-semibold text-foreground">{period.periodKey}</h4>
            <span
              className={`text-xs px-2 py-1 rounded ${
                period.status === 'OPEN'
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
              }`}
            >
              {period.status}
            </span>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <span className="font-medium">Period:</span> {startDate} - {endDate}
            </p>
            {dueDate && (
              <p>
                <span className="font-medium">Due:</span> {dueDate}
              </p>
            )}
            {submissionCount > 0 && (
              <p>
                <span className="font-medium">Submissions:</span> {submissionCount}
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={handleToggle}
          disabled={toggling}
          variant="outline"
          size="sm"
          className="border-border"
        >
          {toggling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : period.status === 'OPEN' ? (
            <>
              <Lock className="w-4 h-4 mr-1" />
              Close
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4 mr-1" />
              Open
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function PeriodCreator({
  indicatorId,
  orgId,
  onSuccess,
  onCancel,
}: {
  indicatorId: string
  orgId: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    periodKey: '',
    startDate: '',
    endDate: '',
    dueDate: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.periodKey.trim()) {
        throw new Error('Period key is required (e.g., Q1 2024)')
      }
      if (!formData.startDate || !formData.endDate) {
        throw new Error('Start date and end date are required')
      }
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        throw new Error('End date must be after start date')
      }

      await indicatorPeriodsApi.create(orgId, {
        indicatorId,
        periodKey: formData.periodKey.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        dueDate: formData.dueDate || undefined,
      })

      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create period')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <h4 className="font-medium text-foreground mb-4">Create New Period</h4>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-foreground">Period Key *</Label>
          <Input
            value={formData.periodKey}
            onChange={(e) => setFormData({ ...formData, periodKey: e.target.value })}
            placeholder="e.g., Q1 2024, January 2024"
            required
            className="bg-background border-border text-foreground"
          />
          <p className="text-xs text-muted-foreground">
            A unique identifier for this reporting period
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">Start Date *</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              className="bg-background border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">End Date *</Label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
              className="bg-background border-border text-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Due Date (Optional)</Label>
          <Input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="bg-background border-border text-foreground"
          />
          <p className="text-xs text-muted-foreground">
            When submissions for this period are due
          </p>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} className="border-border">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Period'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
