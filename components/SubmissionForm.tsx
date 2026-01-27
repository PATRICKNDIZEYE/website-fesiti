'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { submissionsApi } from '@/lib/api-helpers'
import { Submission, Indicator, IndicatorPeriod } from '@/lib/types'
import { EvidenceUploader } from './EvidenceUploader'
import { SubmissionSelectors } from './SubmissionSelectors'
import { SubmissionValueInput } from './SubmissionValueInput'
import { SubmissionFormActions } from './SubmissionFormActions'
import { useSubmissionData } from '@/hooks/useSubmissionData'
import { validateSubmissionForm } from '@/lib/submissionValidation'

interface SubmissionFormProps {
  projectId?: string
  indicatorId?: string
  indicatorPeriodId?: string
  orgId: string
  onSuccess?: () => void
  onCancel?: () => void
  submission?: Submission // For editing existing submission
}

export function SubmissionForm({
  projectId: initialProjectId,
  indicatorId: initialIndicatorId,
  indicatorPeriodId: initialPeriodId,
  orgId,
  onSuccess,
  onCancel,
  submission,
}: SubmissionFormProps) {
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '')
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>(initialIndicatorId || '')
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(initialPeriodId || '')
  const [valueNumber, setValueNumber] = useState<string>('')
  const [valueText, setValueText] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(submission || null)

  // Data fetching
  const { projects, indicators, periods } = useSubmissionData(
    orgId,
    selectedProjectId || undefined,
    selectedIndicatorId || undefined
  )

  const selectedIndicator = indicators.find(i => i.id === selectedIndicatorId) || null
  const selectedPeriod = periods.find(p => p.id === selectedPeriodId) || null

  // Reset dependent fields when parent changes
  useEffect(() => {
    if (selectedProjectId) {
      setSelectedIndicatorId('')
      setSelectedPeriodId('')
    }
  }, [selectedProjectId])

  useEffect(() => {
    if (selectedIndicatorId) {
      setSelectedPeriodId('')
    }
  }, [selectedIndicatorId])

  // Load existing submission data if editing
  useEffect(() => {
    if (submission) {
      setCurrentSubmission(submission)
      setSelectedProjectId(submission.projectId)
      setSelectedPeriodId(submission.indicatorPeriodId)
      if (submission.values && submission.values.length > 0) {
        const firstValue = submission.values[0]
        if (firstValue.valueNumber !== undefined && firstValue.valueNumber !== null) {
          setValueNumber(firstValue.valueNumber.toString())
        }
        if (firstValue.valueText) {
          setValueText(firstValue.valueText)
        }
      }
    }
  }, [submission])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const validationError = validateSubmissionForm(
      selectedProjectId,
      selectedIndicatorId,
      selectedPeriodId,
      valueNumber,
      valueText,
      selectedIndicator
    )
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    try {
      // Get current user ID from localStorage
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        throw new Error('User not found. Please log in again.')
      }
      const user = JSON.parse(userStr)
      const submittedById = user.id

      let submissionId: string

      if (currentSubmission) {
        // Editing existing submission
        submissionId = currentSubmission.id
      } else {
        // Create new draft submission
        const createResponse = await submissionsApi.create(orgId, {
          projectId: selectedProjectId,
          indicatorPeriodId: selectedPeriodId,
          submittedById,
        })
        submissionId = createResponse.data.id
        setCurrentSubmission(createResponse.data)
      }

      // Add submission value
      await submissionsApi.addValue(orgId, submissionId, {
        indicatorId: selectedIndicatorId,
        valueNumber: valueNumber ? parseFloat(valueNumber) : undefined,
        valueText: valueText || undefined,
        notes: notes || undefined,
      })

      // Upload evidence files
      for (const file of evidenceFiles) {
        await submissionsApi.attachEvidence(orgId, submissionId, file)
      }

      setSuccess(true)
      onSuccess?.()
      
      // Reset form if not editing
      if (!submission) {
        setTimeout(() => {
          setSelectedProjectId('')
          setSelectedIndicatorId('')
          setSelectedPeriodId('')
          setValueNumber('')
          setValueText('')
          setNotes('')
          setEvidenceFiles([])
          setSuccess(false)
        }, 2000)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create submission')
    } finally {
      setSaving(false)
    }
  }

  const handleFinalSubmit = async () => {
    if (!currentSubmission) {
      setError('No submission to submit')
      return
    }

    if (currentSubmission.status !== 'draft' && currentSubmission.status !== 'returned') {
      setError('Only draft or returned submissions can be submitted')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await submissionsApi.submit(orgId, currentSubmission.id)
      setSuccess(true)
      onSuccess?.()
      if (onCancel) {
        setTimeout(() => onCancel(), 1500)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const isEditing = !!submission
  const canEdit = !submission || submission.status === 'draft' || submission.status === 'returned'
  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'approved' || submission?.status === 'locked'

  return (
    <div className="border border-border rounded-lg p-6 bg-card">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        {isEditing ? 'Edit Submission' : 'Create New Submission'}
      </h3>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-primary/10 border-primary/20">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">
            {isEditing ? 'Submission updated successfully!' : 'Draft submission created successfully!'}
          </AlertDescription>
        </Alert>
      )}

      {submission && submission.status === 'returned' && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This submission was returned. Please review the feedback and make necessary changes.
          </AlertDescription>
        </Alert>
      )}

      <form id="submission-form" onSubmit={handleSubmit} className="space-y-4">
        <SubmissionSelectors
          projects={projects}
          indicators={indicators}
          periods={periods}
          selectedProjectId={selectedProjectId}
          selectedIndicatorId={selectedIndicatorId}
          selectedPeriodId={selectedPeriodId}
          onProjectChange={setSelectedProjectId}
          onIndicatorChange={setSelectedIndicatorId}
          onPeriodChange={setSelectedPeriodId}
          initialProjectId={initialProjectId}
          initialIndicatorId={initialIndicatorId}
          initialPeriodId={initialPeriodId}
          disabled={isSubmitted}
        />

        {selectedIndicator && (
          <SubmissionValueInput
            indicator={selectedIndicator}
            valueNumber={valueNumber}
            valueText={valueText}
            onValueNumberChange={setValueNumber}
            onValueTextChange={setValueText}
            disabled={isSubmitted}
          />
        )}

        <div className="space-y-2">
          <Label className="text-foreground">Evidence Files</Label>
          <EvidenceUploader
            files={evidenceFiles}
            onFilesChange={setEvidenceFiles}
            disabled={isSubmitted}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-foreground">Notes</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes or context..."
            rows={3}
            disabled={isSubmitted}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
        </div>

        <SubmissionFormActions
          submission={currentSubmission}
          saving={saving}
          submitting={submitting}
          canEdit={canEdit}
          onCancel={onCancel}
          onFinalSubmit={handleFinalSubmit}
        />
      </form>
    </div>
  )
}
