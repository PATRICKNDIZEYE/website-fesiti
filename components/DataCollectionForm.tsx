'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, Save, Send, Download, Upload, Check, X, FileSpreadsheet, History } from 'lucide-react'
import { orgApi, importHistoryApi } from '@/lib/api-helpers'
import { Indicator, IndicatorInput, IndicatorPeriod, DisaggregationDef, DisaggregationValue, Unit } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { ExcelImportModal } from '@/components/ExcelImportModal'
import { ImportHistoryView } from '@/components/ImportHistoryView'
import { exportDataTemplate, importDataFromExcel, generateDisaggCombinations, getCombinationKey, getInputCombinationKey } from '@/lib/excel-utils'

interface DataCollectionFormProps {
  indicatorId: string
  periodId: string
  orgId: string
  projectId: string
  userId: string
  onSuccess?: () => void
  onCancel?: () => void
}

interface CellValue {
  value: string
  isEstimated: boolean
  notes: string
}

export function DataCollectionForm({
  indicatorId,
  periodId,
  orgId,
  projectId,
  userId: propUserId,
  onSuccess,
  onCancel,
}: DataCollectionFormProps) {
  const [indicator, setIndicator] = useState<Indicator | null>(null)
  const [period, setPeriod] = useState<IndicatorPeriod | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  
  // Get userId from props or localStorage fallback
  const [userId, setUserId] = useState(propUserId)
  
  useEffect(() => {
    if (!propUserId) {
      // Try to get userId from localStorage
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr)
          setUserId(parsed.id || parsed.userId || parsed.sub || '')
        } catch (e) {
          console.error('Failed to parse user from localStorage')
        }
      }
    }
  }, [propUserId])
  
  // Data values - keyed by combination key (or 'total' for no disaggregation)
  const [values, setValues] = useState<Record<string, CellValue>>({})
  const [importing, setImporting] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showImportHistory, setShowImportHistory] = useState(false)
  const [pendingImport, setPendingImport] = useState<{
    fileName: string
    totalRows: number
    mappings: Record<string, string>
  } | null>(null)
  const [pendingImportRows, setPendingImportRows] = useState<
    { inputId?: string; value: number; disaggregationValueIds?: string[]; isEstimated?: boolean; notes?: string }[]
  >([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Extract disaggregations with their values
  const disaggregations = useMemo(() => {
    if (!indicator?.disaggregations) return []
    return indicator.disaggregations
      .map(d => d.definition)
      .filter((d): d is DisaggregationDef => !!d && !!d.values && d.values.length > 0)
  }, [indicator])

  const inputs = useMemo(() => {
    return indicator?.inputs && indicator.inputs.length > 0 ? indicator.inputs : []
  }, [indicator])

  const isFormula = indicator?.calcType === 'formula' && inputs.length > 0

  const getInputDisaggregations = (input: IndicatorInput): DisaggregationDef[] => {
    return (input.disaggregations || [])
      .map(d => d.definition)
      .filter((d): d is DisaggregationDef => !!d && !!d.values && d.values.length > 0)
  }

  const inputCombinations = useMemo(() => {
    const combos: Record<string, DisaggregationValue[][]> = {}
    for (const input of inputs) {
      const disaggs = getInputDisaggregations(input)
      combos[input.id] = generateDisaggCombinations(disaggs)
    }
    return combos
  }, [inputs])
  
  // Generate all combinations
  const combinations = useMemo(() => {
    return generateDisaggCombinations(disaggregations)
  }, [disaggregations])
  
  // Helper to get unit display
  const getUnitDisplay = () => {
    const unit = indicator?.unit as string | Unit | null
    if (unit && typeof unit === 'object') {
      return unit.symbol || unit.name || 'unit'
    }
    return unit || 'unit'
  }

  const getInputUnitDisplay = (input: IndicatorInput) => {
    const unit = input.unit as string | Unit | null | undefined
    if (unit && typeof unit === 'object') {
      return unit.symbol || unit.name || 'unit'
    }
    return unit || 'unit'
  }

  // Generate expected columns for import modal
  const expectedColumns = useMemo(() => {
    const unitDisplay = indicator?.unit 
      ? (typeof indicator.unit === 'object' 
          ? (indicator.unit as Unit).symbol || (indicator.unit as Unit).name || 'unit'
          : indicator.unit)
      : 'unit'
    
    const cols = [
      { key: 'rowKey', label: 'Row Key', required: false, description: 'Unique identifier for updating existing rows' },
    ]

    if (isFormula) {
      cols.push({
        key: 'input',
        label: 'Input',
        required: true,
        description: `Input name (e.g., ${inputs.map(i => i.name).slice(0, 3).join(', ')})`,
      })

      const disaggMap = new Map<string, DisaggregationDef>()
      for (const input of inputs) {
        for (const disagg of getInputDisaggregations(input)) {
          if (!disaggMap.has(disagg.id)) {
            disaggMap.set(disagg.id, disagg)
          }
        }
      }
      for (const disagg of disaggMap.values()) {
        cols.push({
          key: `disagg_${disagg.id}`,
          label: disagg.name,
          required: false,
          description: `Values: ${disagg.values?.map(v => v.valueLabel).join(', ')}`,
        })
      }
    } else {
      // Add disaggregation columns
      for (const disagg of disaggregations) {
        cols.push({
          key: `disagg_${disagg.id}`,
          label: disagg.name,
          required: true,
          description: `Values: ${disagg.values?.map(v => v.valueLabel).join(', ')}`,
        })
      }
    }
    
    // Add value columns
    cols.push(
      { key: 'value', label: 'Value', required: true, description: isFormula ? 'Numeric value' : `Numeric value in ${unitDisplay}` },
      { key: 'isEstimated', label: 'Is Estimated', required: false, description: 'TRUE/FALSE' },
      { key: 'notes', label: 'Notes', required: false, description: 'Additional notes' },
    )
    
    return cols
  }, [disaggregations, indicator, inputs, isFormula])

  useEffect(() => {
    fetchData()
  }, [indicatorId, periodId, orgId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch indicator with disaggregations
      const indResponse = await orgApi.get(orgId, `indicators/${indicatorId}`)
      setIndicator(indResponse.data)
      
      // Find the period
      const periodData = indResponse.data.periods?.find((p: IndicatorPeriod) => p.id === periodId)
      setPeriod(periodData || null)
      
      // Initialize values based on disaggregations
      // TODO: Load existing submission values if editing
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load indicator data')
    } finally {
      setLoading(false)
    }
  }

  const updateValue = (key: string, field: keyof CellValue, value: string | boolean) => {
    setValues(prev => ({
      ...prev,
      [key]: {
        ...prev[key] || { value: '', isEstimated: false, notes: '' },
        [field]: value,
      }
    }))
  }

  const handleExportTemplate = () => {
    if (!indicator || !period) {
      setError('Select an indicator and period to export a template.')
      return
    }
    try {
      setError('')
      exportDataTemplate({
        indicator,
        period,
        disaggregations,
        combinations,
        values,
      })
      setSuccess('Template downloaded. Fill in the sheet and use Import Data to upload.')
    } catch (err: any) {
      setError(err?.message || 'Failed to export template. Try again or use a different browser.')
      setSuccess('')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleAdvancedImport = async (data: Record<string, any>[], mappings: Record<string, string>, fileName?: string) => {
    try {
      setImporting(true)
      setError('')
      setSuccess('')

      const newValues: Record<string, CellValue> = {}
      const rowsForBackend: { inputId?: string; value: number; disaggregationValueIds?: string[]; isEstimated?: boolean; notes?: string }[] = []

      const inputByName = new Map(inputs.map(i => [i.name.toLowerCase(), i]))

      for (const row of data) {
        const value = row.value
        if (value === undefined || value === null || value === '') continue

        if (isFormula) {
          const inputName = String(row.input || '').trim()
          const input = inputByName.get(inputName.toLowerCase())
          if (!input) continue

          const inputDisaggs = getInputDisaggregations(input)
          const matchedValues: DisaggregationValue[] = []
          for (const disagg of inputDisaggs) {
            const disaggColValue = row[`disagg_${disagg.id}`]
            if (!disaggColValue) continue
            const matchedValue = disagg.values?.find(v =>
              v.valueLabel.toLowerCase() === String(disaggColValue).toLowerCase()
            )
            if (matchedValue) {
              matchedValues.push(matchedValue)
            }
          }
          if (inputDisaggs.length > 0 && matchedValues.length !== inputDisaggs.length) {
            continue
          }

          const valueKey = getInputCombinationKey(input.id, matchedValues)

          newValues[valueKey] = {
            value: String(value),
            isEstimated: row.isEstimated === true || String(row.isEstimated).toLowerCase() === 'true',
            notes: row.notes || '',
          }

          rowsForBackend.push({
            inputId: input.id,
            value: Number(value),
            disaggregationValueIds: matchedValues.length ? matchedValues.map(v => v.id) : undefined,
            isEstimated: row.isEstimated === true || String(row.isEstimated).toLowerCase() === 'true',
            notes: row.notes || '',
          })
        } else {
          // Build the combination key from disaggregation values
          let key = 'total'
          
          let disaggregationValueIds: string[] | undefined

          if (disaggregations.length > 0) {
            const matchedValues: DisaggregationValue[] = []
            
            for (const disagg of disaggregations) {
              const disaggColValue = row[`disagg_${disagg.id}`]
              if (!disaggColValue) continue
              
              // Find matching value by label
              const matchedValue = disagg.values?.find(v => 
                v.valueLabel.toLowerCase() === String(disaggColValue).toLowerCase()
              )
              if (matchedValue) {
                matchedValues.push(matchedValue)
              }
            }
            
            if (matchedValues.length === disaggregations.length) {
              key = getCombinationKey(matchedValues)
              disaggregationValueIds = matchedValues.map(v => v.id)
            }
          }

          newValues[key] = {
            value: String(value),
            isEstimated: row.isEstimated === true || String(row.isEstimated).toLowerCase() === 'true',
            notes: row.notes || '',
          }

          // Prepare row payload for backend import processing
          rowsForBackend.push({
            value: Number(value),
            disaggregationValueIds,
            isEstimated: row.isEstimated === true || String(row.isEstimated).toLowerCase() === 'true',
            notes: row.notes || '',
          })
        }
      }

      setValues(newValues)
      setPendingImportRows(rowsForBackend)
      
      // Track pending import for history
      setPendingImport({
        fileName: fileName || 'imported_data.xlsx',
        totalRows: Object.keys(newValues).length,
        mappings,
      })
      
      setShowImportModal(false)
      setSuccess(`Successfully imported ${Object.keys(newValues).length} rows. Click "Save Draft" or "Submit" to save.`)
    } catch (err: any) {
      throw new Error(err.message || 'Failed to process imported data')
    } finally {
      setImporting(false)
    }
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setImporting(true)
      setError('')
      setSuccess('')

      const result = await importDataFromExcel(file)

      if (!result.success) {
        setError(result.errors.join(', '))
        return
      }

      // Validate that the imported file matches current indicator/period
      if (result.indicatorId !== indicatorId || result.periodId !== periodId) {
        setError('The imported file was created for a different indicator or period')
        return
      }

      // Map imported values back to our format
      // The import uses label-based keys, we need to convert to ID-based keys
      const newValues: Record<string, CellValue> = {}
      
      if (result.calcType === 'formula') {
        const inputById = new Map(inputs.map(i => [i.id, i]))
        const inputByName = new Map(inputs.map(i => [i.name.toLowerCase(), i]))

        for (const row of result.rows || []) {
          const inputId = row.inputId || inputByName.get(String(row.inputName || '').toLowerCase())?.id
          if (!inputId) continue

          const input = inputById.get(inputId)
          if (!input) continue

          const inputDisaggs = getInputDisaggregations(input)
          const matchedValues: DisaggregationValue[] = []
          const rowDisaggs = row.disaggregations || {}

          for (const disagg of inputDisaggs) {
            const label = rowDisaggs[disagg.name]
            if (!label) continue
            const matchedValue = disagg.values?.find(v =>
              v.valueLabel.toLowerCase() === String(label).toLowerCase()
            )
            if (matchedValue) {
              matchedValues.push(matchedValue)
            }
          }

          if (inputDisaggs.length > 0 && matchedValues.length !== inputDisaggs.length) {
            continue
          }

          const key = getInputCombinationKey(inputId, matchedValues)
          newValues[key] = {
            value: String(row.value || ''),
            isEstimated: row.isEstimated === true || String(row.isEstimated).toLowerCase() === 'yes',
            notes: row.notes || '',
          }
        }
      } else if (disaggregations.length === 0) {
        // Simple case
        if (result.values['total']) {
          newValues['total'] = result.values['total']
        }
      } else {
        // For disaggregated data, try to match by labels
        for (const combination of combinations) {
          const labelKey = combination.map(v => v.valueLabel).join('|')
          const idKey = getCombinationKey(combination)
          
          if (result.values[labelKey]) {
            newValues[idKey] = result.values[labelKey]
          }
        }
      }

      setValues(newValues)
      setSuccess('Data imported successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to import file')
    } finally {
      setImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSaveDraft = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      
      // Validate userId before submission
      if (!userId) {
        throw new Error('User session not found. Please log in again.')
      }
      
      // Create submission draft
      const submissionResponse = await orgApi.post(orgId, 'submissions', {
        projectId,
        indicatorPeriodId: periodId,
        submittedById: userId,
      })
      
      const submissionId = submissionResponse.data.id

      // If this was from an Excel import, let backend create submission values via ImportHistoryService
      if (pendingImport && pendingImportRows.length > 0) {
        try {
          const importResponse = await importHistoryApi.create(orgId, {
            indicatorId,
            indicatorPeriodId: periodId,
            importType: 'data_collection',
            fileName: pendingImport.fileName,
            columnMappings: pendingImport.mappings,
          })

          const importId = importResponse.data.id as string

          await importHistoryApi.process(orgId, importId, {
            rows: pendingImportRows,
            submissionId,
          })

          setPendingImport(null)
          setPendingImportRows([])
          setSuccess('Draft saved and import processed successfully')
        } catch (importErr: any) {
          console.error('Failed to process import history:', importErr)
          setSuccess('Draft saved, but import processing failed. Check import history for details.')
        }
      } else {
        if (isFormula) {
          for (const input of inputs) {
            const combos = inputCombinations[input.id] || [[]]
            for (const combination of combos) {
              const key = getInputCombinationKey(input.id, combination)
              const cellValue = values[key]
              if (!cellValue || !cellValue.value) continue

              if (combination.length === 0) {
                await orgApi.post(orgId, `submissions/${submissionId}/values`, {
                  indicatorId,
                  inputId: input.id,
                  valueNumber: parseFloat(cellValue.value),
                  isEstimated: cellValue.isEstimated,
                  notes: cellValue.notes || undefined,
                })
              } else {
                for (const disaggValue of combination) {
                  await orgApi.post(orgId, `submissions/${submissionId}/values`, {
                    indicatorId,
                    inputId: input.id,
                    disaggregationValueId: disaggValue.id,
                    valueNumber: parseFloat(cellValue.value) / combination.length,
                    isEstimated: cellValue.isEstimated,
                    notes: cellValue.notes || undefined,
                  })
                }
              }
            }
          }
        } else {
          // Manual entry path: add values for each combination
          for (const combination of combinations) {
            const key = combination.length > 0 ? getCombinationKey(combination) : 'total'
            const cellValue = values[key]
            
            if (cellValue && cellValue.value) {
              if (combination.length === 0) {
                // No disaggregation - single total value
                await orgApi.post(orgId, `submissions/${submissionId}/values`, {
                  indicatorId,
                  valueNumber: parseFloat(cellValue.value),
                  isEstimated: cellValue.isEstimated,
                  notes: cellValue.notes || undefined,
                })
              } else {
                // With disaggregation - one value per combination
                for (const disaggValue of combination) {
                  await orgApi.post(orgId, `submissions/${submissionId}/values`, {
                    indicatorId,
                    disaggregationValueId: disaggValue.id,
                    valueNumber: parseFloat(cellValue.value) / combination.length,
                    isEstimated: cellValue.isEstimated,
                    notes: cellValue.notes || undefined,
                  })
                }
              }
            }
          }
        }

        setSuccess('Draft saved successfully')
      }

      onSuccess?.()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError('')
      
      // First save draft
      await handleSaveDraft()
      
      // TODO: Update submission status to 'submitted'
      
      setSuccess('Data submitted successfully')
      setShowSubmitModal(false)
      onSuccess?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit data')
    } finally {
      setSubmitting(false)
    }
  }

  const calculateTotal = (): number => {
    let total = 0
    for (const key of Object.keys(values)) {
      const val = parseFloat(values[key]?.value || '0')
      if (!isNaN(val)) {
        total += val
      }
    }
    return total
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!indicator || !period) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Indicator or period not found</AlertDescription>
      </Alert>
    )
  }

  const hasDisaggregations = !isFormula && disaggregations.length > 0

  return (
    <div className="space-y-6">
      <ConfirmationModal
        open={showSubmitModal}
        onOpenChange={setShowSubmitModal}
        onConfirm={handleSubmit}
        title="Submit Data"
        description="Are you sure you want to submit this data? Once submitted, it will be sent for review and you won't be able to edit it until it's returned."
        type="default"
        confirmText="Submit"
        loading={submitting}
      />

      {/* Header */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="font-semibold text-lg text-foreground">{indicator.name}</h3>
        {(indicator.definition || indicator.description) && (
          <p className="text-sm text-muted-foreground mt-1">{indicator.definition || indicator.description}</p>
        )}
        <div className="flex flex-wrap gap-4 mt-3 text-sm">
          <div>
            <span className="text-muted-foreground">Period:</span>{' '}
            <span className="font-medium">{period.periodKey}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Unit:</span>{' '}
            <span className="font-medium">{getUnitDisplay()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Due:</span>{' '}
            <span className="font-medium">
              {period.dueDate ? new Date(period.dueDate).toLocaleDateString() : 'No due date'}
            </span>
          </div>
          {indicator.direction && (
            <div>
              <span className="text-muted-foreground">Direction:</span>{' '}
              <span className={cn(
                "font-medium",
                indicator.direction === 'increase' ? 'text-green-600' : 'text-orange-600'
              )}>
                {indicator.direction === 'increase' ? '↑ Higher is better' : '↓ Lower is better'}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Data Entry Section */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h4 className="font-medium text-foreground">Enter Data</h4>
          {hasDisaggregations && (
            <p className="text-sm text-muted-foreground mt-1">
              Enter values for each breakdown category. Total: <span className="font-semibold text-primary">{calculateTotal().toLocaleString()} {getUnitDisplay()}</span>
            </p>
          )}
        </div>

        <div className="p-4">
          {isFormula ? (
            <div className="space-y-6">
              {inputs.map((input) => {
                const inputDisaggs = getInputDisaggregations(input)
                const inputCombos = inputCombinations[input.id] || [[]]
                const hasInputDisaggs = inputDisaggs.length > 0
                return (
                  <div key={input.id} className="border border-border rounded-lg overflow-hidden">
                    <div className="p-3 bg-muted/30 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{input.name}</p>
                        <p className="text-xs text-muted-foreground">Unit: {getInputUnitDisplay(input)}</p>
                      </div>
                    </div>
                    <div className="p-3">
                      {!hasInputDisaggs ? (
                        <div className="max-w-md space-y-3">
                          <div className="space-y-2">
                            <Label className="text-foreground">Value ({getInputUnitDisplay(input)}) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={values[getInputCombinationKey(input.id, [])]?.value || ''}
                              onChange={(e) => updateValue(getInputCombinationKey(input.id, []), 'value', e.target.value)}
                              placeholder="Enter value..."
                              className="bg-background border-border"
                            />
                          </div>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={values[getInputCombinationKey(input.id, [])]?.isEstimated || false}
                                onChange={(e) => updateValue(getInputCombinationKey(input.id, []), 'isEstimated', e.target.checked)}
                                className="rounded border-border"
                              />
                              <span className="text-sm text-muted-foreground">This is an estimate</span>
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-muted/50">
                                {inputDisaggs.map((d) => (
                                  <th key={d.id} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
                                    {d.name}
                                  </th>
                                ))}
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
                                  Value ({getInputUnitDisplay(input)})
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border w-20">
                                  Est.
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {inputCombos.map((combination, rowIndex) => {
                                const key = getInputCombinationKey(input.id, combination)
                                const cellValue = values[key] || { value: '', isEstimated: false, notes: '' }
                                return (
                                  <tr key={key} className={cn(
                                    "hover:bg-muted/30 transition-colors",
                                    rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                                  )}>
                                    {combination.map((value) => (
                                      <td key={value.id} className="px-3 py-2 text-sm text-foreground border-b border-border/50">
                                        {value.valueLabel}
                                      </td>
                                    ))}
                                    <td className="px-3 py-2 border-b border-border/50">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={cellValue.value}
                                        onChange={(e) => updateValue(key, 'value', e.target.value)}
                                        placeholder="0"
                                        className="bg-background border-border h-8 w-32"
                                      />
                                    </td>
                                    <td className="px-3 py-2 border-b border-border/50 text-center">
                                      <input
                                        type="checkbox"
                                        checked={cellValue.isEstimated}
                                        onChange={(e) => updateValue(key, 'isEstimated', e.target.checked)}
                                        className="rounded border-border"
                                        title="Mark as estimate"
                                      />
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : !hasDisaggregations ? (
            // Simple single value entry
            <div className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Value ({getUnitDisplay()}) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={values['total']?.value || ''}
                  onChange={(e) => updateValue('total', 'value', e.target.value)}
                  placeholder="Enter value..."
                  className="bg-background border-border"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values['total']?.isEstimated || false}
                    onChange={(e) => updateValue('total', 'isEstimated', e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-muted-foreground">This is an estimate</span>
                </label>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Notes (optional)</Label>
                <textarea
                  value={values['total']?.notes || ''}
                  onChange={(e) => updateValue('total', 'notes', e.target.value)}
                  placeholder="Add any notes or context..."
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm"
                />
              </div>
            </div>
          ) : (
            // Disaggregated data entry grid
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    {disaggregations.map((d) => (
                      <th key={d.id} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
                        {d.name}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
                      Value ({getUnitDisplay()})
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border w-20">
                      Est.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {combinations.map((combination, rowIndex) => {
                    const key = getCombinationKey(combination)
                    const cellValue = values[key] || { value: '', isEstimated: false, notes: '' }
                    
                    return (
                      <tr key={key} className={cn(
                        "hover:bg-muted/30 transition-colors",
                        rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                      )}>
                        {combination.map((value) => (
                          <td key={value.id} className="px-3 py-2 text-sm text-foreground border-b border-border/50">
                            {value.valueLabel}
                          </td>
                        ))}
                        <td className="px-3 py-2 border-b border-border/50">
                          <Input
                            type="number"
                            step="0.01"
                            value={cellValue.value}
                            onChange={(e) => updateValue(key, 'value', e.target.value)}
                            placeholder="0"
                            className="bg-background border-border h-8 w-32"
                          />
                        </td>
                        <td className="px-3 py-2 border-b border-border/50 text-center">
                          <input
                            type="checkbox"
                            checked={cellValue.isEstimated}
                            onChange={(e) => updateValue(key, 'isEstimated', e.target.checked)}
                            className="rounded border-border"
                            title="Mark as estimate"
                          />
                        </td>
                      </tr>
                    )
                  })}
                  {/* Total row */}
                  <tr className="bg-primary/5 font-medium">
                    <td colSpan={disaggregations.length} className="px-3 py-2 text-sm text-foreground border-t border-border">
                      Total
                    </td>
                    <td className="px-3 py-2 text-sm text-primary border-t border-border">
                      {calculateTotal().toLocaleString()}
                    </td>
                    <td className="px-3 py-2 border-t border-border"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input for simple import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".xlsx,.xls"
        className="hidden"
      />

      {/* Excel Import Modal with Column Mapping */}
      <ExcelImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleAdvancedImport}
        expectedColumns={expectedColumns}
        title="Import Data from Excel"
        description="Upload your spreadsheet and map columns to import data."
      />

      {/* Import History Modal */}
      {showImportHistory && (
        <ImportHistoryView
          orgId={orgId}
          indicatorId={indicatorId}
          onClose={() => setShowImportHistory(false)}
        />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportTemplate}
            disabled={!indicator || !period}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Template
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowImportModal(true)}
            disabled={importing || !indicator || !period}
          >
            {importing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Import Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportHistory(true)}
          >
            <History className="w-4 h-4 mr-2" />
            Import History
          </Button>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Draft
          </Button>
          <Button onClick={() => setShowSubmitModal(true)} disabled={saving || submitting}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Submit
          </Button>
        </div>
      </div>
    </div>
  )
}
