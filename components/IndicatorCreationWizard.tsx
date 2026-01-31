'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertCircle, Loader2, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { IndicatorFrequency, CalendarType, Unit } from '@/lib/types'
import { IndicatorDetailsStep } from './indicator-wizard/IndicatorDetailsStep'
import { ScheduleStep } from './indicator-wizard/ScheduleStep'
import { PeriodsStep } from './indicator-wizard/PeriodsStep'
import { ReviewStep } from './indicator-wizard/ReviewStep'
import { generatePeriods, type Period } from './indicator-wizard/periodGenerator'
import { validateWizardStep } from './indicator-wizard/wizardValidation'
import { submitIndicatorWizard } from './indicator-wizard/wizardSubmission'
import { orgApi, resultsNodesApi } from '@/lib/api-helpers'
import type { ResultsNode } from '@/lib/types'

interface IndicatorCreationWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  orgId: string
  onSuccess: () => void
}

const WIZARD_STEPS = [
  { id: 1, title: 'Indicator Details', description: 'Basic indicator information and unit' },
  { id: 2, title: 'Schedule', description: 'Reporting frequency and calendar' },
  { id: 3, title: 'Initial Periods', description: 'Create first reporting periods' },
  { id: 4, title: 'Review', description: 'Review and create' },
]

export function IndicatorCreationWizard({
  open,
  onOpenChange,
  projectId,
  orgId,
  onSuccess,
}: IndicatorCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Units for indicator measurement
  const [units, setUnits] = useState<Unit[]>([])
  const [unitsLoading, setUnitsLoading] = useState(false)
  // Project objectives (results nodes) for linking indicator
  const [resultsNodes, setResultsNodes] = useState<ResultsNode[]>([])
  const [resultsNodesLoading, setResultsNodesLoading] = useState(false)

  // Fetch units and results nodes when dialog opens
  useEffect(() => {
    if (open && orgId) {
      fetchUnits()
      fetchResultsNodes()
    }
  }, [open, orgId, projectId])

  const fetchUnits = async () => {
    setUnitsLoading(true)
    try {
      const response = await orgApi.get(orgId, 'units')
      setUnits(response.data || [])
    } catch (err) {
      console.error('Failed to fetch units:', err)
    } finally {
      setUnitsLoading(false)
    }
  }

  const fetchResultsNodes = async () => {
    setResultsNodesLoading(true)
    try {
      const response = await resultsNodesApi.list(orgId, projectId)
      setResultsNodes(response.data || [])
    } catch (err) {
      console.error('Failed to fetch project objectives:', err)
    } finally {
      setResultsNodesLoading(false)
    }
  }

  // Step 1: Indicator details
  const [indicatorData, setIndicatorData] = useState({
    name: '',
    definition: '',
    unitId: '',
    resultsNodeId: '' as string,
    direction: 'increase' as 'increase' | 'decrease',
    aggregationRule: 'sum' as 'sum' | 'avg' | 'latest' | 'formula',
    formulaExpr: '',
    baselineValue: '',
    baselineDate: '',
    requiresReview: false,
    isActive: true,
  })

  // Step 2: Schedule
  const [scheduleData, setScheduleData] = useState({
    frequency: 'monthly' as IndicatorFrequency,
    calendarType: 'gregorian' as CalendarType,
    dueDaysAfterPeriodEnd: 7,
    graceDays: 3,
    isOpenOnCreate: true,
  })

  // Step 3: Initial periods
  const [periodsData, setPeriodsData] = useState<Period[]>([])

  const updateIndicatorData = (field: string, value: any) => {
    setIndicatorData(prev => ({ ...prev, [field]: value }))
  }

  const updateScheduleData = (field: string, value: any) => {
    setScheduleData(prev => ({ ...prev, [field]: value }))
  }

  const handleGeneratePeriods = () => {
    const periods = generatePeriods(scheduleData.frequency, scheduleData.dueDaysAfterPeriodEnd)
    setPeriodsData(periods)
  }

  const validateStep = (step: number): boolean => {
    setError('')
    const validationError = validateWizardStep(step, indicatorData, periodsData)
    if (validationError) {
      setError(validationError)
      return false
    }
    return true
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2) {
        handleGeneratePeriods()
      }
      setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError('')
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return
    }

    setLoading(true)
    setError('')

    try {
      await submitIndicatorWizard(orgId, projectId, indicatorData, scheduleData, periodsData)

      // Reset and close
      setCurrentStep(1)
      setIndicatorData({
        name: '',
        definition: '',
        unitId: '',
        resultsNodeId: '',
        direction: 'increase',
        aggregationRule: 'sum',
        formulaExpr: '',
        baselineValue: '',
        baselineDate: '',
        requiresReview: false,
        isActive: true,
      })
      setScheduleData({
        frequency: 'monthly',
        calendarType: 'gregorian',
        dueDaysAfterPeriodEnd: 7,
        graceDays: 3,
        isOpenOnCreate: true,
      })
      setPeriodsData([])
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create indicator')
    } finally {
      setLoading(false)
    }
  }

  const progress = (currentStep / WIZARD_STEPS.length) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Indicator</DialogTitle>
          <DialogDescription>
            Set up a complete indicator with schedule and reporting periods
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Step {currentStep} of {WIZARD_STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              {WIZARD_STEPS.map((step) => (
                <span key={step.id} className={currentStep >= step.id ? 'text-primary font-medium' : ''}>
                  {step.title}
                </span>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 1 && (
              <IndicatorDetailsStep
                data={indicatorData}
                units={units}
                unitsLoading={unitsLoading}
                resultsNodes={resultsNodes}
                resultsNodesLoading={resultsNodesLoading}
                orgId={orgId}
                onChange={updateIndicatorData}
                onUnitsRefresh={fetchUnits}
              />
            )}

            {currentStep === 2 && (
              <ScheduleStep
                data={scheduleData}
                onChange={updateScheduleData}
              />
            )}

            {currentStep === 3 && (
              <PeriodsStep
                periods={periodsData}
                scheduleFrequency={scheduleData.frequency}
                dueDaysAfterPeriodEnd={scheduleData.dueDaysAfterPeriodEnd}
                onChange={setPeriodsData}
                onRegenerate={handleGeneratePeriods}
              />
            )}

            {currentStep === 4 && (
              <ReviewStep
                indicatorData={indicatorData}
                scheduleData={scheduleData}
                periodsCount={periodsData.length}
                units={units}
                resultsNodes={resultsNodes}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? () => onOpenChange(false) : prevStep}
              className="border-border"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </Button>

            {currentStep < WIZARD_STEPS.length ? (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Create Indicator
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
