'use client'

import { Button } from '@/components/ui/button'
import { Loader2, Send } from 'lucide-react'
import { Submission } from '@/lib/types'

interface SubmissionFormActionsProps {
  submission: Submission | null
  saving: boolean
  submitting: boolean
  canEdit: boolean
  onCancel?: () => void
  onFinalSubmit: () => void
}

export function SubmissionFormActions({
  submission,
  saving,
  submitting,
  canEdit,
  onCancel,
  onFinalSubmit,
}: SubmissionFormActionsProps) {
  const canSubmit = submission && (submission.status === 'draft' || submission.status === 'returned')

  return (
    <div className="flex justify-end space-x-2">
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel} className="border-border">
          Cancel
        </Button>
      )}
      {canEdit && (
        <Button
          type="submit"
          disabled={saving || submitting}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Draft'
          )}
        </Button>
      )}
      {canSubmit && (
        <Button
          type="button"
          onClick={onFinalSubmit}
          disabled={submitting || saving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit for Approval
            </>
          )}
        </Button>
      )}
    </div>
  )
}
