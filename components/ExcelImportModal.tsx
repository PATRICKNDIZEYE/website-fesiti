'use client'

import { useState, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertCircle, Loader2, Upload, X, FileSpreadsheet, 
  Check, ArrowRight, ChevronDown 
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { cn } from '@/lib/utils'

interface ColumnMapping {
  sourceColumn: string
  targetColumn: string | null
  sampleValues: string[]
}

interface ExpectedColumn {
  key: string
  label: string
  required: boolean
  description?: string
}

interface ParsedData {
  headers: string[]
  rows: Record<string, any>[]
  sheetNames: string[]
  selectedSheet: string
}

interface ExcelImportModalProps {
  open: boolean
  onClose: () => void
  onImport: (data: Record<string, any>[], mappings: Record<string, string>, fileName?: string) => Promise<void>
  expectedColumns: ExpectedColumn[]
  title?: string
  description?: string
}

export function ExcelImportModal({
  open,
  onClose,
  onImport,
  expectedColumns,
  title = 'Import Data from Excel',
  description = 'Upload a spreadsheet and map columns to import your data.',
}: ExcelImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload')
  const [error, setError] = useState('')
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [importing, setImporting] = useState(false)
  const [fileName, setFileName] = useState('')

  const resetState = () => {
    setStep('upload')
    setError('')
    setParsedData(null)
    setMappings([])
    setImporting(false)
    setFileName('')
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setError('')
      setFileName(file.name)
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      
      const sheetNames = workbook.SheetNames
      const selectedSheet = sheetNames[0]
      const worksheet = workbook.Sheets[selectedSheet]
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 })
      
      if (jsonData.length < 2) {
        setError('File must have at least a header row and one data row')
        return
      }

      const headers = (jsonData[0] as string[]).map(h => String(h || '').trim())
      const rows = jsonData.slice(1).map((row: any) => {
        const obj: Record<string, any> = {}
        headers.forEach((header, idx) => {
          obj[header] = row[idx]
        })
        return obj
      }).filter(row => Object.values(row).some(v => v !== undefined && v !== ''))

      if (rows.length === 0) {
        setError('No data rows found in the file')
        return
      }

      setParsedData({ headers, rows, sheetNames, selectedSheet })
      
      // Auto-map columns based on name similarity
      const autoMappings: ColumnMapping[] = expectedColumns.map(expected => {
        const exactMatch = headers.find(h => 
          h.toLowerCase() === expected.label.toLowerCase() ||
          h.toLowerCase() === expected.key.toLowerCase()
        )
        const partialMatch = !exactMatch ? headers.find(h =>
          h.toLowerCase().includes(expected.label.toLowerCase()) ||
          expected.label.toLowerCase().includes(h.toLowerCase())
        ) : null
        
        const sourceColumn = exactMatch || partialMatch || ''
        const sampleValues = sourceColumn 
          ? rows.slice(0, 3).map(r => String(r[sourceColumn] ?? '')).filter(Boolean)
          : []

        return {
          sourceColumn,
          targetColumn: expected.key,
          sampleValues,
        }
      })

      setMappings(autoMappings)
      setStep('mapping')
    } catch (err) {
      console.error('Failed to parse file:', err)
      setError('Failed to parse the Excel file. Please ensure it is a valid .xlsx or .xls file.')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSheetChange = (sheetName: string) => {
    if (!parsedData) return

    // Re-parse with new sheet - would need workbook reference
    // For now, just note that multi-sheet support would go here
  }

  const updateMapping = (targetKey: string, sourceColumn: string) => {
    if (!parsedData) return
    
    const sampleValues = sourceColumn 
      ? parsedData.rows.slice(0, 3).map(r => String(r[sourceColumn] ?? '')).filter(Boolean)
      : []

    setMappings(prev => prev.map(m => 
      m.targetColumn === targetKey 
        ? { ...m, sourceColumn, sampleValues }
        : m
    ))
  }

  const requiredColumnsMapped = useMemo(() => {
    return expectedColumns
      .filter(c => c.required)
      .every(c => mappings.find(m => m.targetColumn === c.key)?.sourceColumn)
  }, [expectedColumns, mappings])

  const mappedData = useMemo(() => {
    if (!parsedData || !mappings.length) return []
    
    return parsedData.rows.map(row => {
      const mapped: Record<string, any> = {}
      mappings.forEach(m => {
        if (m.sourceColumn && m.targetColumn) {
          mapped[m.targetColumn] = row[m.sourceColumn]
        }
      })
      return mapped
    })
  }, [parsedData, mappings])

  const handleImport = async () => {
    if (!requiredColumnsMapped) {
      setError('Please map all required columns before importing')
      return
    }

    const finalMappings: Record<string, string> = {}
    mappings.forEach(m => {
      if (m.sourceColumn && m.targetColumn) {
        finalMappings[m.targetColumn] = m.sourceColumn
      }
    })

    try {
      setImporting(true)
      setStep('importing')
      await onImport(mappedData, finalMappings, fileName)
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Import failed')
      setStep('preview')
    } finally {
      setImporting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              {title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-4">
            {['upload', 'mapping', 'preview'].map((s, idx) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                  step === s ? "bg-primary text-primary-foreground" :
                  ['mapping', 'preview', 'importing'].indexOf(step) > ['upload', 'mapping', 'preview'].indexOf(s)
                    ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {['mapping', 'preview', 'importing'].indexOf(step) > ['upload', 'mapping', 'preview'].indexOf(s)
                    ? <Check className="w-3 h-3" /> : idx + 1}
                </div>
                <span className={cn(
                  "text-sm capitalize",
                  step === s ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {s === 'upload' ? 'Upload File' : s === 'mapping' ? 'Map Columns' : 'Preview & Import'}
                </span>
                {idx < 2 && <ArrowRight className="w-4 h-4 text-muted-foreground mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div 
                className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors w-full max-w-md"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-foreground font-medium mb-2">Drop your Excel file here</p>
                <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                <Button variant="outline">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Select File
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-4">
                Supported formats: .xlsx, .xls
              </p>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && parsedData && (
            <div className="space-y-6">
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{parsedData.rows.length}</span> rows found in your file.
                  Map each column below to import your data correctly.
                </p>
              </div>

              <div className="space-y-4">
                {expectedColumns.map((expected) => {
                  const mapping = mappings.find(m => m.targetColumn === expected.key)
                  return (
                    <div key={expected.key} className="border border-border rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        {/* Target Column Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Label className="text-foreground font-medium">
                              {expected.label}
                            </Label>
                            {expected.required && (
                              <span className="text-xs text-red-500">*Required</span>
                            )}
                          </div>
                          {expected.description && (
                            <p className="text-xs text-muted-foreground">{expected.description}</p>
                          )}
                        </div>

                        {/* Arrow */}
                        <ArrowRight className="w-5 h-5 text-muted-foreground mt-2" />

                        {/* Source Column Selector */}
                        <div className="flex-1">
                          <div className="relative">
                            <select
                              value={mapping?.sourceColumn || ''}
                              onChange={(e) => updateMapping(expected.key, e.target.value)}
                              className={cn(
                                "w-full px-3 py-2 bg-background border rounded-md text-foreground appearance-none pr-8",
                                mapping?.sourceColumn ? "border-green-500" : expected.required ? "border-yellow-500" : "border-border"
                              )}
                            >
                              <option value="">-- Select column --</option>
                              {parsedData.headers.map(header => (
                                <option key={header} value={header}>{header}</option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          </div>
                          
                          {/* Sample Values */}
                          {mapping?.sampleValues && mapping.sampleValues.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">Sample values:</p>
                              <div className="flex flex-wrap gap-1">
                                {mapping.sampleValues.map((v, i) => (
                                  <span key={i} className="text-xs px-2 py-0.5 bg-muted rounded">
                                    {String(v).substring(0, 30)}{String(v).length > 30 ? '...' : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  Ready to import <span className="font-medium">{mappedData.length}</span> rows.
                  Review the preview below before importing.
                </p>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-foreground font-medium">#</th>
                        {expectedColumns.filter(c => mappings.find(m => m.targetColumn === c.key)?.sourceColumn).map(col => (
                          <th key={col.key} className="px-3 py-2 text-left text-foreground font-medium">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {mappedData.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                          {expectedColumns.filter(c => mappings.find(m => m.targetColumn === c.key)?.sourceColumn).map(col => (
                            <td key={col.key} className="px-3 py-2 text-foreground">
                              {String(row[col.key] ?? '-')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {mappedData.length > 10 && (
                  <div className="px-3 py-2 bg-muted/30 text-center text-sm text-muted-foreground">
                    ... and {mappedData.length - 10} more rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Importing State */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-foreground font-medium">Importing data...</p>
              <p className="text-sm text-muted-foreground">This may take a moment</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div>
            {step !== 'upload' && step !== 'importing' && (
              <Button 
                variant="outline" 
                onClick={() => setStep(step === 'preview' ? 'mapping' : 'upload')}
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {step === 'mapping' && (
              <Button 
                onClick={() => setStep('preview')}
                disabled={!requiredColumnsMapped}
              >
                Continue to Preview
              </Button>
            )}
            {step === 'preview' && (
              <Button onClick={handleImport} disabled={importing}>
                {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Import {mappedData.length} Rows
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
