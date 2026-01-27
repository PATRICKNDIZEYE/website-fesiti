'use client'
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, Send } from 'lucide-react'
import { orgApi } from '@/lib/api-helpers'
import { Indicator } from '@/lib/types'

interface ReportSubmissionFormProps {
  projectId: string
  indicatorId?: string
  onSuccess?: () => void
  orgId?: string
}

export function ReportSubmissionForm({ projectId, indicatorId, onSuccess, orgId }: ReportSubmissionFormProps) {
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    indicatorId: indicatorId || '',
    value: '',
    reportDate: new Date().toISOString().split('T')[0],
    notes: '',
  })

  // Reset value when indicator changes
  useEffect(() => {
    if (formData.indicatorId) {
      setFormData(prev => ({ ...prev, value: '' }))
    }
  }, [formData.indicatorId])

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
      if (indicatorId) {
        setFormData(prev => ({ ...prev, indicatorId }))
      }
    } catch (error) {
      console.error('Failed to fetch indicators:', error)
      setError('Failed to load indicators')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSubmitting(true)

    try {
      if (!formData.indicatorId) {
        throw new Error('Please select an indicator')
      }
      if (!formData.value || formData.value.trim() === '') {
        throw new Error('Please enter a value')
      }
      
      // Validate numeric values for non-text indicators
      if (selectedIndicator && selectedIndicator.type !== 'qualitative' && selectedIndicator.unit !== 'text') {
        const numValue = parseFloat(formData.value)
        if (isNaN(numValue) || numValue < 0) {
          throw new Error('Please enter a valid numeric value')
        }
      }
      if (!formData.reportDate) {
        throw new Error('Please select a report date')
      }

      // For qualitative/text indicators, use textValue field
      // For quantitative indicators, use the numeric value field
      const isTextIndicator = selectedIndicator && (selectedIndicator.type === 'qualitative' || selectedIndicator.unit === 'text')
      
      if (!orgId) {
        console.error('Organization ID is required')
        return
      }
      await orgApi.post(orgId, 'reports', {
        indicatorId: formData.indicatorId,
        projectId,
        value: isTextIndicator ? undefined : parseFloat(formData.value),
        textValue: isTextIndicator ? formData.value : undefined,
        reportDate: formData.reportDate,
        notes: formData.notes || undefined,
        status: 'submitted',
      })

      setSuccess(true)
      setFormData({
        indicatorId: indicatorId || '',
        value: '',
        reportDate: new Date().toISOString().split('T')[0],
        notes: '',
      })

      setTimeout(() => {
        setSuccess(false)
        onSuccess?.()
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedIndicator = indicators.find(i => i.id === formData.indicatorId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (indicators.length === 0) {
    return (
      <div className="text-center py-8 border border-border rounded-lg bg-card">
        <p className="text-muted-foreground mb-2">No indicators available for this project</p>
        <p className="text-sm text-muted-foreground">Add indicators to start tracking progress</p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg p-6 bg-card">
      <h3 className="text-lg font-semibold text-foreground mb-4">Submit Progress Report</h3>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-primary/10 border-primary/20">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">Report submitted successfully!</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="indicator" className="text-foreground">Indicator *</Label>
          <select
            id="indicator"
            value={formData.indicatorId}
            onChange={(e) => setFormData({ ...formData, indicatorId: e.target.value })}
            required
            disabled={!!indicatorId}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          >
            <option value="">Select an indicator</option>
            {indicators.map((indicator) => {
              const unitDisplay = typeof indicator.unit === 'object' && indicator.unit
                ? indicator.unit.name || indicator.unit.symbol
                : indicator.unit || 'unit'
              return (
                <option key={indicator.id} value={indicator.id}>
                  {indicator.name} ({indicator.type}, {unitDisplay})
                </option>
              )
            })}
          </select>
          {selectedIndicator && (
            <p className="text-xs text-muted-foreground">{selectedIndicator.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="value" className="text-foreground">
              Value * ({selectedIndicator?.unit || 'unit'})
            </Label>
            {selectedIndicator?.type === 'qualitative' || selectedIndicator?.unit === 'text' ? (
              <textarea
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Enter qualitative description or text value..."
                rows={3}
                required
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            ) : (
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="0"
                required
                className="bg-background border-border text-foreground"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reportDate" className="text-foreground">Report Date *</Label>
            <Input
              id="reportDate"
              type="date"
              value={formData.reportDate}
              onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
              required
              className="bg-background border-border text-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-foreground">Notes</Label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add any additional notes or context..."
            rows={3}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting || success}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : success ? (
            'Submitted!'
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Report
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
