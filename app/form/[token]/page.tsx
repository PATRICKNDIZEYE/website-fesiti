'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, CheckCircle, Send, ClipboardList, FileCheck, Plus, Trash2, MapPin } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface DisaggregationValue {
  id: string
  valueLabel: string
  valueCode?: string
  sortOrder: number
}

interface DisaggregationDef {
  id: string
  name: string
  values?: DisaggregationValue[]
}

interface IndicatorDisaggregation {
  id: string
  definition?: DisaggregationDef
}

interface Unit {
  id: string
  name: string
  symbol?: string
}

interface Indicator {
  id: string
  name: string
  definition?: string
  description?: string
  type: string
  unit?: string | Unit
  direction?: string
  calcType?: 'direct' | 'formula'
  formulaExpr?: string | null
  disaggregations?: IndicatorDisaggregation[]
  inputs?: IndicatorInput[]
}

interface IndicatorInput {
  id: string
  name: string
  description?: string
  unit?: string | Unit
  isRequired: boolean
  disaggregations?: IndicatorDisaggregation[]
}

interface Period {
  id: string
  periodKey: string
  startDate: string
  endDate: string
  dueDate?: string
}

interface FormData {
  id: string
  title: string
  description?: string
  welcomeMessage?: string
  thankYouMessage?: string
  requireName: boolean
  requireEmail: boolean
  requirePhone: boolean
  reportingUnitLabel?: string | null
  indicator: Indicator
  indicatorPeriod: Period
}

// One record payload (same shape as submit API); stored in drafts and sent on Submit all
interface DraftRecord {
  respondentName?: string
  respondentEmail?: string
  respondentPhone?: string
  valueNumber?: number
  valueText?: string
  disaggregationValues?: string[]
  isEstimated?: boolean
  notes?: string
  latitude?: number
  longitude?: number
  inputValues?: {
    inputId: string
    valueNumber?: number
    valueText?: string
    disaggregationValues?: string[]
    isEstimated?: boolean
    notes?: string
  }[]
}

const DRAFT_STORAGE_KEY = (t: string) => `fesiti-form-drafts-${t}`
type Step = 'form' | 'review-one' | 'add-another' | 'review-all' | 'submitted'

export default function PublicFormPage() {
  const params = useParams()
  const token = params.token as string
  
  const [formData, setFormData] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [draftRecords, setDraftRecords] = useState<DraftRecord[]>([])
  const [pendingRecord, setPendingRecord] = useState<DraftRecord | null>(null)
  
  // Form values
  const [respondentName, setRespondentName] = useState('')
  const [respondentEmail, setRespondentEmail] = useState('')
  const [respondentPhone, setRespondentPhone] = useState('')
  const [valueNumber, setValueNumber] = useState('')
  const [valueText, setValueText] = useState('')
  const [selectedDisaggregations, setSelectedDisaggregations] = useState<Record<string, string>>({})
  const [isEstimated, setIsEstimated] = useState(false)
  const [notes, setNotes] = useState('')
  const [formulaDataQualityEstimated, setFormulaDataQualityEstimated] = useState(false)
  const [formulaDataQualityNotes, setFormulaDataQualityNotes] = useState('')
  const [inputValues, setInputValues] = useState<Record<string, { valueNumber: string; valueText: string; selectedDisaggregations: Record<string, string> }>>({})
  const [capturedLat, setCapturedLat] = useState<number | null>(null)
  const [capturedLng, setCapturedLng] = useState<number | null>(null)
  const [capturingLocation, setCapturingLocation] = useState(false)
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    fetchForm()
  }, [token])

  // Load drafts from localStorage when form is ready
  useEffect(() => {
    if (!token || !formData) return
    try {
      const raw = typeof window !== 'undefined' && localStorage.getItem(DRAFT_STORAGE_KEY(token))
      if (raw) {
        const parsed = JSON.parse(raw) as DraftRecord[]
        if (Array.isArray(parsed)) setDraftRecords(parsed)
      }
    } catch {
      // ignore invalid stored data
    }
  }, [token, formData])

  // Persist drafts to localStorage whenever they change
  useEffect(() => {
    if (!token) return
    try {
      if (draftRecords.length > 0) {
        localStorage.setItem(DRAFT_STORAGE_KEY(token), JSON.stringify(draftRecords))
      } else {
        localStorage.removeItem(DRAFT_STORAGE_KEY(token))
      }
    } catch {
      // ignore quota or other errors
    }
  }, [token, draftRecords])

  const fetchForm = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get(`/data-collection/public/form/${token}`)
      setFormData(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Form not found or no longer accepting responses')
    } finally {
      setLoading(false)
    }
  }

  const getUnitDisplay = () => {
    if (!formData?.indicator?.unit) return 'unit'
    const unit = formData.indicator.unit
    if (typeof unit === 'object') {
      return unit.symbol || unit.name || 'unit'
    }
    return unit
  }

  // Human-readable period (e.g. "Academic Year 2025–2026", "Reporting as of: January 2026")
  const formatPeriodDisplay = (period: Period | undefined) => {
    if (!period) return ''
    const start = period.startDate ? new Date(period.startDate) : null
    const end = period.endDate ? new Date(period.endDate) : null
    const key = period.periodKey || ''
    const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    if (start && end) {
      const sameYear = start.getFullYear() === end.getFullYear()
      if (key.match(/^\d{4}-\d{4}$/) || (sameYear && end.getMonth() - start.getMonth() >= 10)) {
        return `Academic Year ${start.getFullYear()}–${end.getFullYear()} (${formatDate(start)} – ${formatDate(end)})`
      }
      if (key.match(/T\d/i)) {
        const termNum = key.replace(/^.*T(\d).*$/i, '$1')
        return `Term ${termNum} ${start.getFullYear()} (${formatDate(start)} – ${formatDate(end)})`
      }
      if (key.match(/Q\d/i)) {
        return `Quarter ${key} (${formatDate(start)} – ${formatDate(end)})`
      }
      return `${formatDate(start)} – ${formatDate(end)} (${key})`
    }
    return key
  }

  const reportingAsOf = () => {
    const now = new Date()
    return now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  }

  // Subject-oriented label for disaggregation (data about learners/schools, not "about you")
  const disaggregationLabelForSubject = (name: string) => {
    const n = (name || '').toLowerCase()
    if (n.includes('gender') || n === 'sex') return `${name} (of learners)`
    if (n.includes('grade') || n.includes('class')) return `${name} (class level)`
    if (n.includes('school')) return `${name} (reporting for)`
    return name
  }

  const isGradeLikeDisaggregation = (name: string) => {
    const n = (name || '').toLowerCase()
    return n.includes('grade') || n.includes('class')
  }

  const getDisaggregations = (): DisaggregationDef[] => {
    if (!formData?.indicator?.disaggregations) return []
    return formData.indicator.disaggregations
      .map(d => d.definition)
      .filter((d): d is DisaggregationDef => !!d && !!d.values && d.values.length > 0)
  }

  const getInputDisaggregations = (input: IndicatorInput): DisaggregationDef[] => {
    if (!input.disaggregations) return []
    return input.disaggregations
      .map(d => d.definition)
      .filter((d): d is DisaggregationDef => !!d && !!d.values && d.values.length > 0)
  }

  const getInputUnitDisplay = (input: IndicatorInput) => {
    const unit = input.unit
    if (!unit) return 'unit'
    if (typeof unit === 'object') {
      return unit.symbol || unit.name || 'unit'
    }
    return unit
  }

  const updateInputEntry = (inputId: string, updates: Partial<{ valueNumber: string; valueText: string; selectedDisaggregations: Record<string, string> }>) => {
    setInputValues(prev => {
      const current = prev[inputId] || { valueNumber: '', valueText: '', selectedDisaggregations: {} }
      return {
        ...prev,
        [inputId]: { ...current, ...updates },
      }
    })
  }

  const isFormula = formData?.indicator?.calcType === 'formula'
  const isTextIndicator = formData?.indicator?.type === 'qualitative'

  function buildRecordPayload(): DraftRecord {
    const disaggValues = Object.values(selectedDisaggregations).filter(Boolean)
    const inputPayload = isFormula
      ? (formData?.indicator?.inputs || []).map(input => {
          const entry = inputValues[input.id] || { valueNumber: '', valueText: '', selectedDisaggregations: {} }
          return {
            inputId: input.id,
            valueNumber: entry.valueNumber ? parseFloat(entry.valueNumber) : undefined,
            valueText: entry.valueText || undefined,
            disaggregationValues: Object.values(entry.selectedDisaggregations).filter(Boolean).length > 0 ? Object.values(entry.selectedDisaggregations).filter(Boolean) : undefined,
            isEstimated: formulaDataQualityEstimated,
            notes: formulaDataQualityNotes || undefined,
          }
        })
      : undefined
    return {
      respondentName: respondentName || undefined,
      respondentEmail: respondentEmail || undefined,
      respondentPhone: respondentPhone || undefined,
      valueNumber: !isFormula && valueNumber ? parseFloat(valueNumber) : undefined,
      valueText: !isFormula ? valueText || undefined : undefined,
      disaggregationValues: !isFormula && disaggValues.length > 0 ? disaggValues : undefined,
      isEstimated: !isFormula ? isEstimated : formulaDataQualityEstimated,
      notes: !isFormula ? notes || undefined : formulaDataQualityNotes || undefined,
      latitude: capturedLat != null ? capturedLat : undefined,
      longitude: capturedLng != null ? capturedLng : undefined,
      inputValues: isFormula ? inputPayload : undefined,
    }
  }

  function validateCurrentRecord(): string | null {
    if (formData?.requireName && !respondentName.trim()) return 'Please enter your name'
    if (formData?.requireEmail && !respondentEmail.trim()) return 'Please enter your email'
    if (formData?.requirePhone && !respondentPhone.trim()) return 'Please enter your phone number'
    if (!isFormula) {
      if (!isTextIndicator && !valueNumber) return 'Please enter a value'
      if (isTextIndicator && !valueText.trim()) return 'Please enter a response'
      const disaggregations = getDisaggregations()
      for (const disagg of disaggregations) {
        if (!selectedDisaggregations[disagg.id]) return `Please select ${disaggregationLabelForSubject(disagg.name)}`
      }
      if (isEstimated && !notes.trim()) return 'Please explain the source or reason for the estimate when using "Estimated".'
    } else {
      const inputs = formData?.indicator?.inputs || []
      for (const input of inputs) {
        const entry = inputValues[input.id]
        if (input.isRequired && (!entry || (!isTextIndicator && !entry.valueNumber) || (isTextIndicator && !entry.valueText?.trim()))) return `Please enter a value for ${input.name}`
        const inputDisaggs = getInputDisaggregations(input)
        for (const disagg of inputDisaggs) {
          if (!entry?.selectedDisaggregations[disagg.id]) return `Please select ${disaggregationLabelForSubject(disagg.name)} for ${input.name}`
        }
      }
      if (formulaDataQualityEstimated && !formulaDataQualityNotes.trim()) return 'Please explain the source or reason for the estimate when using "Estimated".'
    }
    return null
  }

  function clearFormDataForNewRecord() {
    setValueNumber('')
    setValueText('')
    setSelectedDisaggregations({})
    setIsEstimated(false)
    setNotes('')
    setFormulaDataQualityEstimated(false)
    setFormulaDataQualityNotes('')
    setInputValues({})
    setError('')
  }

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }
    setCapturingLocation(true)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCapturedLat(pos.coords.latitude)
        setCapturedLng(pos.coords.longitude)
        setCapturingLocation(false)
      },
      () => {
        setLocationError('Could not get location. Check permissions or try again.')
        setCapturingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateCurrentRecord()
    if (err) {
      setError(err)
      return
    }
    setError('')
    setPendingRecord(buildRecordPayload())
    setStep('review-one')
  }

  const handleConfirmAddToList = () => {
    if (!pendingRecord) return
    setDraftRecords(prev => [...prev, pendingRecord])
    setPendingRecord(null)
    clearFormDataForNewRecord()
    setStep('add-another')
  }

  const handleRemoveDraft = (index: number) => {
    setDraftRecords(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmitAll = async () => {
    if (draftRecords.length === 0) return
    try {
      setSubmitting(true)
      setError('')
      for (const record of draftRecords) {
        await api.post(`/data-collection/public/form/${token}/submit`, record)
      }
      setDraftRecords([])
      setStep('submitted')
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY(token))
      } catch {}
      setSubmitted(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit one or more records')
    } finally {
      setSubmitting(false)
    }
  }

  function getDisaggregationValueLabel(valueId: string): string {
    const checkDefs = (list: { definition?: DisaggregationDef }[] | undefined) => {
      if (!list) return null
      for (const d of list) {
        const def = d.definition
        if (!def?.values) continue
        const v = def.values.find(x => x.id === valueId)
        if (v) return v.valueLabel
      }
      return null
    }
    const fromIndicator = checkDefs(formData?.indicator?.disaggregations)
    if (fromIndicator) return fromIndicator
    for (const input of formData?.indicator?.inputs || []) {
      const fromInput = checkDefs(input.disaggregations)
      if (fromInput) return fromInput
    }
    return valueId
  }

  function getInputName(inputId: string): string {
    return formData?.indicator?.inputs?.find(i => i.id === inputId)?.name || inputId
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && !formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Form Not Available</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600">{formData?.thankYouMessage || 'Your response has been recorded.'}</p>
        </div>
      </div>
    )
  }

  // --- Step: Review this record (before adding to list) ---
  if (step === 'review-one' && pendingRecord) {
    const rec = pendingRecord
    const isFormulaRec = !!(rec.inputValues && rec.inputValues.length > 0)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" />
                Review this record
              </h2>
              <p className="text-sm text-gray-600 mt-1">Confirm the data below is correct before adding it to your list.</p>
            </div>
            <div className="p-6 space-y-4">
              {!isFormulaRec && rec.disaggregationValues && rec.disaggregationValues.length > 0 && (
                <div>
                  <span className="text-xs text-gray-500 uppercase">Breakdown</span>
                  <p className="font-medium text-gray-900">{rec.disaggregationValues.map(getDisaggregationValueLabel).join(' · ')}</p>
                </div>
              )}
              {!isFormulaRec && (
                <>
                  {rec.valueNumber != null && <p><span className="text-gray-500">Value:</span> <strong>{rec.valueNumber}</strong></p>}
                  {rec.valueText && <p><span className="text-gray-500">Response:</span> {rec.valueText}</p>}
                </>
              )}
              {isFormulaRec && rec.inputValues?.map((iv) => (
                <div key={iv.inputId}>
                  <span className="text-xs text-gray-500">{getInputName(iv.inputId)}</span>
                  <p className="font-medium text-gray-900">
                    {iv.valueNumber != null && iv.valueNumber}
                    {iv.valueText != null && iv.valueText}
                    {iv.disaggregationValues && iv.disaggregationValues.length > 0 && ` (${iv.disaggregationValues.map(getDisaggregationValueLabel).join(', ')})`}
                  </p>
                </div>
              ))}
              {(rec.isEstimated || rec.notes) && (
                <div className="pt-2 border-t text-sm">
                  {rec.isEstimated && <p className="text-amber-700">Marked as estimated</p>}
                  {rec.notes && <p className="text-gray-600">{rec.notes}</p>}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('form')}>
              Edit
            </Button>
            <Button type="button" className="flex-1" onClick={handleConfirmAddToList}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm & add to list
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // --- Step: Add another or finish ---
  if (step === 'add-another') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Record saved</h2>
            <p className="text-gray-600 mb-6">This record is saved locally. You can add more or submit all when ready.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button type="button" variant="outline" onClick={() => setStep('form')}>
                <Plus className="w-4 h-4 mr-2" />
                Add another record
              </Button>
              <Button type="button" onClick={() => setStep('review-all')}>
                <ClipboardList className="w-4 h-4 mr-2" />
                I&apos;m done — review all & submit
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- Step: Review all records, then submit ---
  if (step === 'review-all') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Review all records before submitting
              </h2>
              <p className="text-sm text-gray-600 mt-1">Check everything below. Submit only when you are sure the data is correct.</p>
            </div>
            <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
              {draftRecords.map((rec, index) => {
                const isFormulaRec = !!(rec.inputValues && rec.inputValues.length > 0)
                return (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50/50">
                    <span className="text-xs font-medium text-gray-500 shrink-0">#{index + 1}</span>
                    <div className="flex-1 min-w-0 text-sm">
                      {!isFormulaRec && rec.disaggregationValues && rec.disaggregationValues.length > 0 && (
                        <p className="font-medium text-gray-900">{rec.disaggregationValues.map(getDisaggregationValueLabel).join(' · ')}</p>
                      )}
                      {!isFormulaRec && (rec.valueNumber != null || rec.valueText) && (
                        <p>{rec.valueNumber != null ? rec.valueNumber : rec.valueText}</p>
                      )}
                      {isFormulaRec && rec.inputValues?.map((iv) => (
                        <p key={iv.inputId}>{getInputName(iv.inputId)}: {iv.valueNumber ?? iv.valueText ?? '—'}</p>
                      ))}
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="shrink-0 text-red-600 hover:text-red-700" onClick={() => handleRemoveDraft(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
            <p className="px-4 pb-4 text-sm text-gray-500">{draftRecords.length} record(s) — submitted together when you click below.</p>
          </div>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="button" variant="outline" onClick={() => setStep('form')}>
              <Plus className="w-4 h-4 mr-2" />
              Add another record
            </Button>
            <Button type="button" disabled={draftRecords.length === 0 || submitting} onClick={handleSubmitAll}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit all {draftRecords.length} record(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const disaggregations = getDisaggregations()
  const isFormulaIndicator = formData?.indicator?.calcType === 'formula' && (formData?.indicator?.inputs?.length || 0) > 0
  const inputs = formData?.indicator?.inputs || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <ClipboardList className="w-8 h-8" />
              <h1 className="text-2xl font-bold">{formData?.title}</h1>
            </div>
            {formData?.description && (
              <p className="text-white/90">{formData.description}</p>
            )}
          </div>
          
          {formData?.welcomeMessage && (
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <p className="text-blue-800 text-sm">{formData.welcomeMessage}</p>
            </div>
          )}
          
          <div className="p-4 bg-gray-50 border-b space-y-3">
            <div>
              <span className="text-gray-500 text-xs uppercase tracking-wide">Indicator</span>
              <p className="font-semibold text-gray-900 mt-0.5">{formData?.indicator?.name}</p>
            </div>
            {(formData?.indicator?.definition || formData?.indicator?.description) && (
              <div>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Definition</span>
                <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">
                  {formData.indicator.definition || formData.indicator.description}
                </p>
              </div>
            )}
            <div>
              <span className="text-gray-500 text-xs uppercase tracking-wide">Reporting period</span>
              <p className="font-medium text-gray-900 mt-0.5">{formatPeriodDisplay(formData?.indicatorPeriod)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Reporting as of: {reportingAsOf()}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs uppercase tracking-wide">Reporting unit</span>
              <p className="font-medium text-gray-900 mt-0.5">{formData?.reportingUnitLabel || 'School-level data'}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveRecord} className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Respondent Info */}
          {(formData?.requireName || formData?.requireEmail || formData?.requirePhone) && (
            <div className="space-y-4 pb-6 border-b">
              <h2 className="font-semibold text-gray-900">Your Information</h2>
              
              {formData?.requireName && (
                <div className="space-y-2">
                  <Label className="text-gray-700">Name *</Label>
                  <Input
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-white border-gray-300"
                  />
                </div>
              )}
              
              {formData?.requireEmail && (
                <div className="space-y-2">
                  <Label className="text-gray-700">Email *</Label>
                  <Input
                    type="email"
                    value={respondentEmail}
                    onChange={(e) => setRespondentEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-white border-gray-300"
                  />
                </div>
              )}
              
              {formData?.requirePhone && (
                <div className="space-y-2">
                  <Label className="text-gray-700">Phone *</Label>
                  <Input
                    type="tel"
                    value={respondentPhone}
                    onChange={(e) => setRespondentPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="bg-white border-gray-300"
                  />
                </div>
              )}
            </div>
          )}

          {/* Disaggregation (reporting by) */}
          {!isFormulaIndicator && disaggregations.length > 0 && (
            <div className="space-y-6 pb-6 border-b">
              <h2 className="font-semibold text-gray-900">Breakdown (reporting by)</h2>
              
              {disaggregations.map((disagg) => (
                <div key={disagg.id} className="space-y-3">
                  <Label className="text-gray-700 text-base">{disaggregationLabelForSubject(disagg.name)} *</Label>
                  {isGradeLikeDisaggregation(disagg.name) && (
                    <p className="text-xs text-gray-500">Select grade level (e.g. P1–P6).</p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(disagg.values || [])
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((value) => (
                        <label
                          key={value.id}
                          className={cn(
                            "flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all text-center",
                            selectedDisaggregations[disagg.id] === value.id
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          )}
                        >
                          <input
                            type="radio"
                            name={`disagg-${disagg.id}`}
                            value={value.id}
                            checked={selectedDisaggregations[disagg.id] === value.id}
                            onChange={() => setSelectedDisaggregations(prev => ({
                              ...prev,
                              [disagg.id]: value.id
                            }))}
                            className="sr-only"
                          />
                          <span className="font-medium">{value.valueLabel}</span>
                        </label>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Value Input */}
          {!isFormulaIndicator ? (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">Data inputs</h2>
              
              <div className="space-y-2">
                <Label className="text-gray-700 text-base">
                  {isTextIndicator ? 'Your Response' : `Value (${getUnitDisplay()})`} *
                </Label>
                
                {isTextIndicator ? (
                  <textarea
                    value={valueText}
                    onChange={(e) => setValueText(e.target.value)}
                    placeholder="Enter your response..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                ) : (
                  <Input
                    type="number"
                    step="0.01"
                    value={valueNumber}
                    onChange={(e) => setValueNumber(e.target.value)}
                    placeholder="Enter a number..."
                    className="bg-white border-gray-300 text-lg py-6"
                  />
                )}
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-100">
                <span className="text-sm font-medium text-gray-700">Data quality</span>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="dataQuality"
                      checked={!isEstimated}
                      onChange={() => { setIsEstimated(false); setNotes((n) => (n && n.trim() ? n : '')); }}
                      className="border-gray-300"
                    />
                    <span className="text-gray-700">Verified with school register</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="dataQuality"
                      checked={isEstimated}
                      onChange={() => setIsEstimated(true)}
                      className="border-gray-300"
                    />
                    <span className="text-gray-700">Estimated (explain below)</span>
                  </label>
                </div>
                {isEstimated && (
                  <div className="space-y-1">
                    <Label className="text-gray-600 text-sm">Additional notes (required if estimated)</Label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Explain source or reason for estimate..."
                      rows={2}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    />
                  </div>
                )}
                {!isEstimated && (
                  <div className="space-y-1">
                    <Label className="text-gray-600 text-sm">Additional notes (optional)</Label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional context..."
                      rows={2}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Optional: Capture location (GPS) */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="text-sm font-medium text-gray-700">Optional: Location</span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCaptureLocation}
                    disabled={capturingLocation}
                    className="gap-2"
                  >
                    {capturingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                    {capturedLat != null && capturedLng != null
                      ? `Location captured (${capturedLat.toFixed(4)}, ${capturedLng.toFixed(4)})`
                      : 'Capture location (GPS)'}
                  </Button>
                  {capturedLat != null && capturedLng != null && (
                    <button
                      type="button"
                      onClick={() => { setCapturedLat(null); setCapturedLng(null); setLocationError(''); }}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {locationError && <p className="text-sm text-amber-600">{locationError}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="font-semibold text-gray-900">Data inputs (raw data — no math by you)</h2>
              <p className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Enter raw numbers from records. Do not calculate the rate yourself.
              </p>

              {inputs.map((input) => {
                const inputDisaggs = getInputDisaggregations(input)
                const entry = inputValues[input.id] || {
                  valueNumber: '',
                  valueText: '',
                  selectedDisaggregations: {},
                }
                return (
                  <div key={input.id} className="border border-gray-200 rounded-xl p-4 space-y-4">
                    <div>
                      <p className="font-medium text-gray-900">{input.name}</p>
                      {input.description && <p className="text-xs text-gray-500 mt-0.5">{input.description}</p>}
                      <p className="text-xs text-gray-500">Unit: {getInputUnitDisplay(input)}</p>
                    </div>

                    {inputDisaggs.length > 0 && (
                      <div className="space-y-3">
                        {inputDisaggs.map((disagg) => (
                          <div key={disagg.id} className="space-y-2">
                            <Label className="text-gray-700">{disaggregationLabelForSubject(disagg.name)} *</Label>
                            {isGradeLikeDisaggregation(disagg.name) && (
                              <p className="text-xs text-gray-500">Select grade level (e.g. P1–P6).</p>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {(disagg.values || [])
                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                .map((value) => (
                                  <label
                                    key={value.id}
                                    className={cn(
                                      "flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all text-center",
                                      entry.selectedDisaggregations[disagg.id] === value.id
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                                    )}
                                  >
                                    <input
                                      type="radio"
                                      name={`input-${input.id}-disagg-${disagg.id}`}
                                      value={value.id}
                                      checked={entry.selectedDisaggregations[disagg.id] === value.id}
                                      onChange={() => updateInputEntry(input.id, {
                                        selectedDisaggregations: {
                                          ...entry.selectedDisaggregations,
                                          [disagg.id]: value.id,
                                        },
                                      })}
                                      className="sr-only"
                                    />
                                    <span className="font-medium">{value.valueLabel}</span>
                                  </label>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-gray-700 text-base">
                        {isTextIndicator ? 'Your Response' : `Value (${getInputUnitDisplay(input)})`} {input.isRequired ? '*' : ''}
                      </Label>
                      
                      {isTextIndicator ? (
                        <textarea
                          value={entry.valueText}
                          onChange={(e) => updateInputEntry(input.id, { valueText: e.target.value })}
                          placeholder="Enter your response..."
                          rows={3}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      ) : (
                        <Input
                          type="number"
                          step="any"
                          min={0}
                          value={entry.valueNumber}
                          onChange={(e) => updateInputEntry(input.id, { valueNumber: e.target.value })}
                          placeholder="Enter a number from records..."
                          className="bg-white border-gray-300 text-lg py-4"
                        />
                      )}
                    </div>
                  </div>
                )
              })}

              {/* System-calculated field (read-only); formula is never entered by respondent */}
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">System-calculated</span>
                <p className="font-medium text-gray-800 mt-1">
                  {formData?.indicator?.formulaExpr
                    ? formData.indicator.formulaExpr
                    : `${formData?.indicator?.name} will be calculated from your entries.`}
                </p>
                <p className="text-xs text-gray-500 mt-1">Read-only — no input required.</p>
              </div>

              {/* Data quality (one block for whole formula response) */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <span className="text-sm font-medium text-gray-700">Data quality</span>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="formulaDataQuality"
                      checked={!formulaDataQualityEstimated}
                      onChange={() => { setFormulaDataQualityEstimated(false); setFormulaDataQualityNotes(''); }}
                      className="border-gray-300"
                    />
                    <span className="text-gray-700">Verified with school register</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="formulaDataQuality"
                      checked={formulaDataQualityEstimated}
                      onChange={() => setFormulaDataQualityEstimated(true)}
                      className="border-gray-300"
                    />
                    <span className="text-gray-700">Estimated (explain below)</span>
                  </label>
                </div>
                {formulaDataQualityEstimated && (
                  <div className="space-y-1">
                    <Label className="text-gray-600 text-sm">Additional notes (required if estimated)</Label>
                    <textarea
                      value={formulaDataQualityNotes}
                      onChange={(e) => setFormulaDataQualityNotes(e.target.value)}
                      placeholder="Explain source or reason for estimate..."
                      rows={2}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    />
                  </div>
                )}
                {!formulaDataQualityEstimated && (
                  <div className="space-y-1">
                    <Label className="text-gray-600 text-sm">Additional notes (optional)</Label>
                    <textarea
                      value={formulaDataQualityNotes}
                      onChange={(e) => setFormulaDataQualityNotes(e.target.value)}
                      placeholder="Any additional context..."
                      rows={2}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Optional: Capture location (GPS) — same for formula indicators */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="text-sm font-medium text-gray-700">Optional: Location</span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCaptureLocation}
                    disabled={capturingLocation}
                    className="gap-2"
                  >
                    {capturingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                    {capturedLat != null && capturedLng != null
                      ? `Location captured (${capturedLat.toFixed(4)}, ${capturedLng.toFixed(4)})`
                      : 'Capture location (GPS)'}
                  </Button>
                  {capturedLat != null && capturedLng != null && (
                    <button
                      type="button"
                      onClick={() => { setCapturedLat(null); setCapturedLng(null); setLocationError(''); }}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {locationError && <p className="text-sm text-amber-600">{locationError}</p>}
              </div>
            </div>
          )}

          {draftRecords.length > 0 && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm text-gray-700">
              <strong>{draftRecords.length} record(s)</strong> saved locally. After saving this one, you can review all and submit together.
              <Button type="button" variant="link" className="p-0 h-auto ml-2 text-primary" onClick={() => setStep('review-all')}>
                Review saved records
              </Button>
            </div>
          )}

          {/* Save this record → review → add to list (submit all later) */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full py-6 text-lg"
          >
            <FileCheck className="w-5 h-5 mr-2" />
            Save this record & review
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Powered by FESITI M&E Platform
        </p>
      </div>
    </div>
  )
}
