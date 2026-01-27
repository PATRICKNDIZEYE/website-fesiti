'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, CheckCircle, Send, ClipboardList } from 'lucide-react'
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
  indicator: Indicator
  indicatorPeriod: Period
}

export default function PublicFormPage() {
  const params = useParams()
  const token = params.token as string
  
  const [formData, setFormData] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  
  // Form values
  const [respondentName, setRespondentName] = useState('')
  const [respondentEmail, setRespondentEmail] = useState('')
  const [respondentPhone, setRespondentPhone] = useState('')
  const [valueNumber, setValueNumber] = useState('')
  const [valueText, setValueText] = useState('')
  const [selectedDisaggregations, setSelectedDisaggregations] = useState<Record<string, string>>({})
  const [isEstimated, setIsEstimated] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchForm()
  }, [token])

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

  const getDisaggregations = (): DisaggregationDef[] => {
    if (!formData?.indicator?.disaggregations) return []
    return formData.indicator.disaggregations
      .map(d => d.definition)
      .filter((d): d is DisaggregationDef => !!d && !!d.values && d.values.length > 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (formData?.requireName && !respondentName.trim()) {
      setError('Please enter your name')
      return
    }
    if (formData?.requireEmail && !respondentEmail.trim()) {
      setError('Please enter your email')
      return
    }
    if (formData?.requirePhone && !respondentPhone.trim()) {
      setError('Please enter your phone number')
      return
    }
    
    // Validate value
    const isTextIndicator = formData?.indicator?.type === 'qualitative'
    if (!isTextIndicator && !valueNumber) {
      setError('Please enter a value')
      return
    }
    if (isTextIndicator && !valueText.trim()) {
      setError('Please enter a response')
      return
    }

    // Validate disaggregation selections
    const disaggregations = getDisaggregations()
    for (const disagg of disaggregations) {
      if (!selectedDisaggregations[disagg.id]) {
        setError(`Please select your ${disagg.name}`)
        return
      }
    }

    try {
      setSubmitting(true)
      setError('')
      
      const disaggValues = Object.values(selectedDisaggregations).filter(Boolean)
      
      await api.post(`/data-collection/public/form/${token}/submit`, {
        respondentName: respondentName || undefined,
        respondentEmail: respondentEmail || undefined,
        respondentPhone: respondentPhone || undefined,
        valueNumber: valueNumber ? parseFloat(valueNumber) : undefined,
        valueText: valueText || undefined,
        disaggregationValues: disaggValues.length > 0 ? disaggValues : undefined,
        isEstimated,
        notes: notes || undefined,
      })
      
      setSubmitted(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit response')
    } finally {
      setSubmitting(false)
    }
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

  const disaggregations = getDisaggregations()
  const isTextIndicator = formData?.indicator?.type === 'qualitative'

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
          
          <div className="p-4 bg-gray-50 border-b">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Indicator:</span>
                <p className="font-medium text-gray-900">{formData?.indicator?.name}</p>
              </div>
              <div>
                <span className="text-gray-500">Period:</span>
                <p className="font-medium text-gray-900">{formData?.indicatorPeriod?.periodKey}</p>
              </div>
            </div>
            {(formData?.indicator?.definition || formData?.indicator?.description) && (
              <p className="text-sm text-gray-600 mt-2">
                {formData.indicator.definition || formData.indicator.description}
              </p>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
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

          {/* Disaggregation Questions */}
          {disaggregations.length > 0 && (
            <div className="space-y-6 pb-6 border-b">
              <h2 className="font-semibold text-gray-900">About You</h2>
              
              {disaggregations.map((disagg) => (
                <div key={disagg.id} className="space-y-3">
                  <Label className="text-gray-700 text-base">{disagg.name} *</Label>
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
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Your Data</h2>
            
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

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="estimated"
                checked={isEstimated}
                onChange={(e) => setIsEstimated(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="estimated" className="text-gray-600 cursor-pointer">
                This is an estimate
              </Label>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Additional Notes (optional)</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional context or notes..."
                rows={2}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full py-6 text-lg"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Response
              </>
            )}
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
