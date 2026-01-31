'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertCircle, Loader2, X, FileSpreadsheet, 
  Check, Clock, AlertTriangle, Download, Trash2, ChevronDown, ChevronUp
} from 'lucide-react'
import { orgApi } from '@/lib/api-helpers'
import { cn } from '@/lib/utils'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import * as XLSX from 'xlsx'

interface ImportRecord {
  id: string
  importType: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
  fileName: string
  fileSize?: number
  totalRows: number
  importedRows: number
  updatedRows: number
  failedRows: number
  columnMappings?: Record<string, string>
  errorDetails?: { row: number; error: string }[]
  createdAt: string
  completedAt?: string
  user?: { firstName?: string; lastName?: string; email: string }
  indicator?: { name: string }
  indicatorPeriod?: { periodKey: string }
}

interface ImportHistoryViewProps {
  orgId: string
  indicatorId?: string
  onClose?: () => void
  embedded?: boolean
}

export function ImportHistoryView({ 
  orgId, 
  indicatorId, 
  onClose,
  embedded = false
}: ImportHistoryViewProps) {
  const [imports, setImports] = useState<ImportRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [viewingDataId, setViewingDataId] = useState<string | null>(null)
  const [dataRows, setDataRows] = useState<Record<string, any>[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState('')

  useEffect(() => {
    fetchImports()
  }, [orgId, indicatorId])

  const fetchImports = async () => {
    try {
      setLoading(true)
      setError('')
      const url = indicatorId 
        ? `import-history?indicatorId=${indicatorId}` 
        : 'import-history'
      const response = await orgApi.get(orgId, url)
      setImports(response.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load import history')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (importRecord: ImportRecord) => {
    try {
      setDownloading(importRecord.id)
      const response = await orgApi.get(orgId, `import-history/${importRecord.id}/download`)
      const data = response.data || []
      
      // Create Excel workbook
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Imported Data')
      
      // Download
      XLSX.writeFile(wb, `${importRecord.fileName.replace('.xlsx', '')}_data.xlsx`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download data')
    } finally {
      setDownloading(null)
    }
  }

  const handleViewData = async (importRecord: ImportRecord) => {
    try {
      setDataError('')
      setDataLoading(true)
      setViewingDataId(importRecord.id)
      const response = await orgApi.get(orgId, `import-history/${importRecord.id}/download`)
      setDataRows(response.data || [])
    } catch (err: any) {
      setDataError(err.response?.data?.message || 'Failed to load import data')
    } finally {
      setDataLoading(false)
    }
  }

  const getDisaggregationSummary = (rows: Record<string, any>[]) => {
    const summary: Record<string, Record<string, number>> = {}
    rows.forEach((row) => {
      const value = Number(row.value) || 0
      const disagg = row.disaggregations || {}
      Object.entries(disagg).forEach(([key, label]) => {
        if (!summary[key]) summary[key] = {}
        const labelKey = String(label || 'Unknown')
        summary[key][labelKey] = (summary[key][labelKey] || 0) + value
      })
    })
    return summary
  }

  const groupRowsByInput = (rows: Record<string, any>[]) => {
    const grouped: Record<string, Record<string, any>[]> = {}
    rows.forEach((row) => {
      const key = row.inputName || row.inputId || 'Value'
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(row)
    })
    return grouped
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await orgApi.delete(orgId, `import-history/${deleteId}`)
      setShowDeleteModal(false)
      setDeleteId(null)
      fetchImports()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete import')
    }
  }

  const getStatusIcon = (status: ImportRecord['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-600" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: ImportRecord['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'failed':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'partial':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      case 'processing':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const content = (
    <>
      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDelete}
        title="Delete Import Record"
        description="Are you sure you want to delete this import record? The imported data will also be deleted. This action cannot be undone."
        type="delete"
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : imports.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No imports yet</p>
          <p className="text-sm text-muted-foreground">
            Import data from Excel to see history here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {imports.map((record) => (
            <div key={record.id} className="border border-border rounded-lg overflow-hidden">
              {/* Header */}
              <div 
                className="p-4 bg-card hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{record.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.createdAt).toLocaleString()}
                        {record.user && ` by ${record.user.firstName || record.user.email}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded border flex items-center gap-1",
                      getStatusColor(record.status)
                    )}>
                      {getStatusIcon(record.status)}
                      {record.status}
                    </span>
                    {expandedId === record.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{record.totalRows}</span> rows
                  </span>
                  <span className="text-green-600">
                    <span className="font-medium">{record.importedRows}</span> imported
                  </span>
                  {record.updatedRows > 0 && (
                    <span className="text-blue-600">
                      <span className="font-medium">{record.updatedRows}</span> updated
                    </span>
                  )}
                  {record.failedRows > 0 && (
                    <span className="text-red-600">
                      <span className="font-medium">{record.failedRows}</span> failed
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === record.id && (
                <div className="p-4 bg-muted/30 border-t border-border space-y-4">
                  {/* Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">File Size</p>
                      <p className="font-medium text-foreground">{formatFileSize(record.fileSize)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Import Type</p>
                      <p className="font-medium text-foreground capitalize">{record.importType.replace('_', ' ')}</p>
                    </div>
                    {record.indicator && (
                      <div>
                        <p className="text-xs text-muted-foreground">Indicator</p>
                        <p className="font-medium text-foreground">{record.indicator.name}</p>
                      </div>
                    )}
                    {record.indicatorPeriod && (
                      <div>
                        <p className="text-xs text-muted-foreground">Period</p>
                        <p className="font-medium text-foreground">{record.indicatorPeriod.periodKey}</p>
                      </div>
                    )}
                  </div>

                  {/* Column Mappings */}
                  {record.columnMappings && Object.keys(record.columnMappings).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Column Mappings</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(record.columnMappings).map(([target, source]) => (
                          <span key={target} className="text-xs px-2 py-1 bg-muted rounded">
                            {source} → {target}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Error Details */}
                  {record.errorDetails && record.errorDetails.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-600 mb-2">Errors ({record.errorDetails.length})</p>
                      <div className="max-h-32 overflow-y-auto bg-red-500/5 rounded p-2 space-y-1">
                        {record.errorDetails.slice(0, 10).map((err, idx) => (
                          <p key={idx} className="text-xs text-red-600">
                            Row {err.row}: {err.error}
                          </p>
                        ))}
                        {record.errorDetails.length > 10 && (
                          <p className="text-xs text-red-400">
                            ... and {record.errorDetails.length - 10} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (viewingDataId === record.id) {
                          setViewingDataId(null)
                          setDataRows([])
                          return
                        }
                        handleViewData(record)
                      }}
                      disabled={dataLoading && viewingDataId === record.id}
                    >
                      {dataLoading && viewingDataId === record.id ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="w-3 h-3 mr-1" />
                      )}
                      {viewingDataId === record.id ? 'Hide Data' : 'View Data'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(record)
                      }}
                      disabled={downloading === record.id}
                    >
                      {downloading === record.id ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Download className="w-3 h-3 mr-1" />
                      )}
                      Download Data
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteId(record.id)
                        setShowDeleteModal(true)
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>

                  {/* View Data Panel */}
                  {viewingDataId === record.id && (
                    <div className="mt-4 border border-border rounded-lg p-3 bg-card">
                      {dataError && (
                        <Alert variant="destructive" className="mb-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{dataError}</AlertDescription>
                        </Alert>
                      )}
                      {dataLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading import data...
                        </div>
                      ) : dataRows.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No data rows found for this import.</p>
                      ) : (
                        <div className="space-y-4">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Rows:</span>{' '}
                            <span className="font-medium">{dataRows.length}</span>
                          </div>

                          {/* Disaggregation Summary */}
                          {Object.entries(getDisaggregationSummary(dataRows)).map(([key, values]) => (
                            <div key={key}>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Summary by {key}</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(values).map(([label, total]) => (
                                  <span key={label} className="text-xs px-2 py-1 bg-muted rounded">
                                    {label}: {total}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}

                          {dataRows.some((row) => row.inputName || row.inputId) && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Summary by Input</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(groupRowsByInput(dataRows)).map(([inputKey, rows]) => (
                                  <span key={inputKey} className="text-xs px-2 py-1 bg-muted rounded">
                                    {inputKey}: {rows.reduce((sum, row) => sum + (Number(row.value) || 0), 0)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Data Table */}
                          <div className="overflow-auto border border-border rounded">
                            <table className="w-full text-xs">
                              <thead className="bg-muted/50">
                                <tr>
                                  {dataRows.some((row) => row.inputName || row.inputId) && (
                                    <th className="text-left px-2 py-1 font-medium">Input</th>
                                  )}
                                  {Object.keys(dataRows[0].disaggregations || {}).map((key) => (
                                    <th key={key} className="text-left px-2 py-1 font-medium">{key}</th>
                                  ))}
                                  <th className="text-left px-2 py-1 font-medium">Value</th>
                                  <th className="text-left px-2 py-1 font-medium">Estimated</th>
                                  <th className="text-left px-2 py-1 font-medium">Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dataRows.map((row, idx) => (
                                  <tr key={idx} className="border-t border-border">
                                    {dataRows.some((rowItem) => rowItem.inputName || rowItem.inputId) && (
                                      <td className="px-2 py-1">{row.inputName || row.inputId || '-'}</td>
                                    )}
                                    {Object.keys(row.disaggregations || {}).map((key) => (
                                      <td key={key} className="px-2 py-1">{row.disaggregations?.[key] || ''}</td>
                                    ))}
                                    <td className="px-2 py-1">{row.value}</td>
                                    <td className="px-2 py-1">{row.isEstimated ? 'Yes' : 'No'}</td>
                                    <td className="px-2 py-1">{row.notes || ''}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )

  if (embedded) {
    return content
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Import History
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage your data imports
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {content}
        </div>
      </div>
    </div>
  )
}
