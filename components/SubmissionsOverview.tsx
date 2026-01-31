'use client'

import { useEffect, useMemo, useState } from 'react'
 import { Button } from '@/components/ui/button'
 import { Alert, AlertDescription } from '@/components/ui/alert'
import { Header } from '@/components/Header'
import { approvalsApi, dataCollectionApi, importHistoryApi, orgApi, submissionsApi } from '@/lib/api-helpers'
import { ApprovalDecision, FormResponse, Indicator, IndicatorPeriod, Submission, SubmissionValue } from '@/lib/types'
import { AlertCircle, FileSpreadsheet, List, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { NarrativesPanel } from '@/components/NarrativesPanel'
 
type TabKey = 'submissions' | 'forms' | 'narratives'
 
 interface SubmissionsOverviewProps {
   orgId: string
   projectId?: string
 }
 
 export function SubmissionsOverview({ orgId, projectId }: SubmissionsOverviewProps) {
   const [activeTab, setActiveTab] = useState<TabKey>('submissions')
   const [submissions, setSubmissions] = useState<Submission[]>([])
   const [formResponses, setFormResponses] = useState<FormResponse[]>([])
   const [indicators, setIndicators] = useState<Indicator[]>([])
   const [indicatorFilterId, setIndicatorFilterId] = useState<string>('')
  const [periodFilterId, setPeriodFilterId] = useState<string>('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'imported' | 'forms'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [importHistoryEnabled, setImportHistoryEnabled] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusAction, setStatusAction] = useState<'submit' | 'approve' | 'return'>('submit')
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusSuccess, setStatusSuccess] = useState('')
  const [approvalLogs, setApprovalLogs] = useState<Record<string, ApprovalDecision[]>>({})
  const [approvalLoading, setApprovalLoading] = useState<Record<string, boolean>>({})
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState('')
   const [expandedId, setExpandedId] = useState<string | null>(null)
   const [convertLoading, setConvertLoading] = useState(false)
   const [convertSuccess, setConvertSuccess] = useState('')
   const [refreshKey, setRefreshKey] = useState(0)

   useEffect(() => {
     const load = async () => {
       try {
         setLoading(true)
         setError('')
 
         const submissionsUrl = projectId ? `submissions?projectId=${projectId}` : 'submissions'
 
         const indicatorsRes = projectId
           ? await orgApi.get(orgId, `indicators?projectId=${projectId}`)
           : null
         const indicatorList = indicatorsRes?.data || []
         const indicatorIds = indicatorList.map((indicator: Indicator) => indicator.id)
 
         const submissionsPromise = orgApi.get(orgId, submissionsUrl)
 
         let responses: FormResponse[] = []
         if (projectId) {
           if (indicatorIds.length > 0) {
             const responseSets = await Promise.all(
               indicatorIds.map((id: string) => dataCollectionApi.listResponses(orgId, id))
             )
             const merged = responseSets.flatMap((res) => res.data || [])
             const seen = new Set<string>()
             responses = merged.filter((row: FormResponse) => {
               if (seen.has(row.id)) return false
               seen.add(row.id)
               return true
             })
           }
         } else {
           const responsesRes = await dataCollectionApi.listResponses(orgId)
           responses = responsesRes.data || []
         }
 
         const submissionsRes = await submissionsPromise
 
         setIndicators(indicatorList)
         setSubmissions(submissionsRes.data || [])
         setFormResponses(responses)
        setImportHistoryEnabled(true)
       } catch (err: any) {
         setError(err.response?.data?.message || 'Failed to load submissions')
        if (String(err?.response?.data?.message || '').includes('import-history')) {
          setImportHistoryEnabled(false)
        }
       } finally {
         setLoading(false)
       }
     }
 
     if (orgId) load()
   }, [orgId, projectId, refreshKey])

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) return
    try {
      const parsed = JSON.parse(userStr)
      setCurrentUserId(parsed.id || parsed.userId || parsed.sub || '')
    } catch {
      setCurrentUserId('')
    }
  }, [])
 
   const getSubmissionSource = (values?: SubmissionValue[]) => {
     if (!values || values.length === 0) return 'Manual'
     return values.some((v) => v.importId) ? 'Imported' : 'Manual'
   }
 
  const summarizeDisaggregations = (values: SubmissionValue[] = []) => {
     const summary: Record<string, Record<string, number>> = {}
     values.forEach((value) => {
       const numberValue = Number(value.valueNumber) || 0
       value.disaggregationValues?.forEach((dv) => {
         const defName = dv.definition?.name || 'Disaggregation'
         const label = dv.valueLabel || 'Unknown'
         if (!summary[defName]) summary[defName] = {}
         summary[defName][label] = (summary[defName][label] || 0) + numberValue
       })
     })
     return summary
   }

  const hasInputValues = (values?: SubmissionValue[]) =>
    (values || []).some((value) => !!value.inputId || !!value.input?.name)
 
  const filteredSubmissions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return submissions.filter((submission) => {
       if (indicatorFilterId && submission.indicatorPeriod?.indicator?.id !== indicatorFilterId) {
         return false
       }
       if (periodFilterId && submission.indicatorPeriodId !== periodFilterId) {
         return false
       }
       if (sourceFilter === 'manual' || sourceFilter === 'imported') {
         const isImported = submission.values?.some((v) => v.importId)
         if (sourceFilter === 'manual' && isImported) return false
         if (sourceFilter === 'imported' && !isImported) return false
       }
      if (query) {
        const indicatorName = submission.indicatorPeriod?.indicator?.name?.toLowerCase() || ''
        const periodKey = submission.indicatorPeriod?.periodKey?.toLowerCase() || ''
        const status = submission.status?.toLowerCase() || ''
        if (!indicatorName.includes(query) && !periodKey.includes(query) && !status.includes(query)) {
          return false
        }
      }
       return true
     })
  }, [submissions, indicatorFilterId, periodFilterId, sourceFilter, searchQuery])
 
   const filteredFormResponses = useMemo(() => {
     if (sourceFilter === 'manual' || sourceFilter === 'imported') {
       return []
     }
    const query = searchQuery.trim().toLowerCase()
     return formResponses.filter((response) => {
       if (indicatorFilterId && response.link?.indicator?.id !== indicatorFilterId) {
         return false
       }
       if (periodFilterId && response.link?.indicatorPeriod?.id !== periodFilterId) {
         return false
       }
      if (query) {
        const indicatorName = response.link?.indicator?.name?.toLowerCase() || ''
        const periodKey = response.link?.indicatorPeriod?.periodKey?.toLowerCase() || ''
        if (!indicatorName.includes(query) && !periodKey.includes(query)) {
          return false
        }
      }
       return true
     })
  }, [formResponses, indicatorFilterId, periodFilterId, sourceFilter, searchQuery])

   const summaryStats = useMemo(() => {
     const manualSubmissions = filteredSubmissions.filter(
       (submission) => !submission.values?.some((v) => v.importId)
     )
    const importedSubmissions = filteredSubmissions.filter((submission) =>
      submission.values?.some((v) => v.importId)
    )
     const submissionValueTotal = filteredSubmissions.reduce((sum, submission) => {
       const submissionSum = (submission.values || []).reduce((valueSum, value) => {
         const numberValue = Number(value.valueNumber) || 0
         return valueSum + numberValue
       }, 0)
       return sum + submissionSum
     }, 0)
    const formValueTotal = filteredFormResponses.reduce((sum, response) => {
      if (response.values && response.values.length > 0) {
        const nestedTotal = response.values.reduce((valueSum, value) => {
          return valueSum + (Number(value.valueNumber) || 0)
        }, 0)
        return sum + nestedTotal
      }
      const value = Number(response.valueNumber) || 0
      return sum + value
    }, 0)
 
     return {
       submissions: filteredSubmissions.length,
       manual: manualSubmissions.length,
       imported: importedSubmissions.length,
       forms: filteredFormResponses.length,
       submissionValueTotal,
       formValueTotal,
     }
   }, [filteredSubmissions, filteredFormResponses])

  const handleDownloadTemplate = async () => {
    if (!indicatorFilterId || !periodFilterId) {
      setError('Select an indicator and period to export a template.')
      return
    }
    try {
      const [indicatorRes, periodRes] = await Promise.all([
        orgApi.get(orgId, `indicators/${indicatorFilterId}`),
        orgApi.get(orgId, `indicators/periods/${periodFilterId}`),
      ])
      const indicator = indicatorRes.data
      const period = periodRes.data
      const disaggregations = indicator?.disaggregations?.map((d: any) => d.definition).filter(Boolean) || []
      const combinations = []
      const values = {}
      // Use existing export template helper by dynamic import to avoid circular deps
      const { exportEmptyTemplate } = await import('@/lib/excel-utils')
      exportEmptyTemplate({
        indicator,
        period,
        disaggregations,
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export template')
    }
  }

  const handleDownloadImportHistory = async () => {
    if (!indicatorFilterId) {
      setError('Select an indicator to view import history.')
      return
    }
    try {
      const historyRes = await importHistoryApi.list(orgId, indicatorFilterId)
      const records = historyRes.data || []
      if (records.length === 0) {
        setError('No import history for this indicator.')
        return
      }
      // Download the most recent import data
      const latest = records[0]
      const dataRes = await importHistoryApi.download(orgId, latest.id)
      const data = dataRes.data || []
      const { utils, writeFile } = await import('xlsx')
      const ws = utils.json_to_sheet(data)
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, 'Import Data')
      writeFile(wb, `${latest.fileName.replace('.xlsx', '')}_data.xlsx`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download import history')
    }
  }

  const openStatusModal = (action: 'submit' | 'approve' | 'return') => {
    if (!periodFilterId) {
      setError('Select a reporting period first.')
      return
    }
    setStatusAction(action)
    setShowStatusModal(true)
  }

  const handleStatusUpdate = async () => {
    try {
      setStatusUpdating(true)
      setError('')
      setStatusSuccess('')

      if (!currentUserId) {
        throw new Error('User session not found. Please log in again.')
      }

      if (statusAction === 'submit') {
        const toSubmit = filteredSubmissions.filter((s) => s.status === 'draft' || s.status === 'returned')
        await Promise.all(toSubmit.map((s) => submissionsApi.submit(orgId, s.id)))
        setStatusSuccess(`Submitted ${toSubmit.length} submissions successfully.`)
      } else if (statusAction === 'approve') {
        const toApprove = filteredSubmissions.filter((s) => s.status === 'submitted')
        await Promise.all(
          toApprove.map((s) =>
            submissionsApi.updateStatus(orgId, s.id, { status: 'approved', decidedById: currentUserId })
          )
        )
        setStatusSuccess(`Approved ${toApprove.length} submissions successfully.`)
      } else if (statusAction === 'return') {
        const toReturn = filteredSubmissions.filter((s) => s.status === 'submitted')
        await Promise.all(
          toReturn.map((s) =>
            submissionsApi.updateStatus(orgId, s.id, { status: 'returned', decidedById: currentUserId })
          )
        )
        setStatusSuccess(`Returned ${toReturn.length} submissions successfully.`)
      }

      setShowStatusModal(false)

      const submissionsUrl = projectId ? `submissions?projectId=${projectId}` : 'submissions'
      const submissionsRes = await orgApi.get(orgId, submissionsUrl)
      setSubmissions(submissionsRes.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update submission status')
    } finally {
      setStatusUpdating(false)
    }
  }

  const loadApprovalLog = async (submissionId: string) => {
    if (approvalLogs[submissionId] || approvalLoading[submissionId]) return
    try {
      setApprovalLoading((prev) => ({ ...prev, [submissionId]: true }))
      const response = await approvalsApi.list(orgId, submissionId)
      setApprovalLogs((prev) => ({ ...prev, [submissionId]: response.data || [] }))
    } catch (err) {
      setApprovalLogs((prev) => ({ ...prev, [submissionId]: [] }))
    } finally {
      setApprovalLoading((prev) => ({ ...prev, [submissionId]: false }))
    }
  }

  const handleConvertToSubmissions = async () => {
    const ids = filteredFormResponses.map((r) => r.id)
    if (ids.length === 0) return
    try {
      setConvertLoading(true)
      setConvertSuccess('')
      setStatusSuccess('')
      setError('')
      const res = await dataCollectionApi.convertToSubmissions(orgId, ids)
      const created = res.data?.created ?? 0
      setConvertSuccess(`${created} draft submission(s) created. Switch to System & Imports to submit or approve.`)
      setRefreshKey((k) => k + 1)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create submissions from form responses')
    } finally {
      setConvertLoading(false)
    }
  }

   const availablePeriods = useMemo(() => {
     const map = new Map<string, IndicatorPeriod>()
     indicators.forEach((indicator) => {
       indicator.periods?.forEach((period) => {
         if (!map.has(period.id)) {
           map.set(period.id, period)
         }
       })
     })
     return Array.from(map.values()).sort((a, b) => (a.periodKey || '').localeCompare(b.periodKey || ''))
   }, [indicators])

  const selectedPeriod = useMemo(() => {
    if (!periodFilterId) return null
    return availablePeriods.find((period) => period.id === periodFilterId) || null
  }, [availablePeriods, periodFilterId])

  const statusCounts = useMemo(() => {
    const counts = {
      draft: 0,
      submitted: 0,
      returned: 0,
      approved: 0,
      locked: 0,
    }
    filteredSubmissions.forEach((submission) => {
      if (submission.status in counts) {
        counts[submission.status as keyof typeof counts] += 1
      }
    })
    return counts
  }, [filteredSubmissions])

  const canSubmitAll = statusCounts.draft + statusCounts.returned > 0
  const canApproveAll = statusCounts.submitted > 0
  const canReturnAll = statusCounts.submitted > 0

  return (
     <div className="space-y-6">
       <Header
         title={projectId ? 'Project Submissions' : 'All Submissions'}
         description={
           projectId
             ? 'View submissions for this project only, including imports and public forms.'
             : 'View every submission made: manual, imported, and public form responses.'
         }
       />
 
      <ConfirmationModal
        open={showStatusModal}
        onOpenChange={setShowStatusModal}
        onConfirm={handleStatusUpdate}
        title={
          statusAction === 'submit'
            ? 'Submit all project data?'
            : statusAction === 'approve'
              ? 'Approve all submitted data?'
              : 'Return all submitted data?'
        }
        description={
          statusAction === 'submit'
            ? 'This will submit all draft/returned submissions for review.'
            : statusAction === 'approve'
              ? 'This will approve all submitted data for this reporting period.'
              : 'This will return all submitted data for further edits.'
        }
        type="default"
        confirmText={statusAction === 'submit' ? 'Submit All' : statusAction === 'approve' ? 'Approve All' : 'Return All'}
        cancelText="Cancel"
        isLoading={statusUpdating}
      />

      {error && (
         <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
           <AlertDescription>{error}</AlertDescription>
         </Alert>
       )}
      {(statusSuccess || convertSuccess) && (
        <Alert className="border-green-500/30 bg-green-500/10 text-green-700">
          <AlertDescription>{statusSuccess || convertSuccess}</AlertDescription>
        </Alert>
      )}
 
      {(indicators.length > 0 || availablePeriods.length > 0) && (
        <div className="flex flex-wrap gap-3 items-center">
           {indicators.length > 0 && (
             <>
               <span className="text-xs text-muted-foreground">Indicator:</span>
               <select
                 value={indicatorFilterId}
                 onChange={(e) => setIndicatorFilterId(e.target.value)}
                 className="text-sm border border-border rounded px-2 py-1 bg-background"
               >
                 <option value="">All indicators</option>
                 {indicators.map((indicator) => (
                   <option key={indicator.id} value={indicator.id}>
                     {indicator.name}
                   </option>
                 ))}
               </select>
             </>
           )}
           {availablePeriods.length > 0 && (
             <>
               <span className="text-xs text-muted-foreground">Period:</span>
               <select
                 value={periodFilterId}
                 onChange={(e) => setPeriodFilterId(e.target.value)}
                 className="text-sm border border-border rounded px-2 py-1 bg-background"
               >
                 <option value="">All periods</option>
                 {availablePeriods.map((period) => (
                   <option key={period.id} value={period.id}>
                     {period.periodKey}
                   </option>
                 ))}
               </select>
             </>
           )}
           <span className="text-xs text-muted-foreground">Source:</span>
           <select
             value={sourceFilter}
             onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
             className="text-sm border border-border rounded px-2 py-1 bg-background"
           >
             <option value="all">All</option>
             <option value="manual">Manual</option>
             <option value="imported">Imported</option>
             <option value="forms">Public Forms</option>
           </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search indicator, period, status..."
            className="text-sm border border-border rounded px-2 py-1 bg-background"
          />
         </div>
       )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
          Download Template
        </Button>
        {importHistoryEnabled && (
          <Button variant="outline" size="sm" onClick={handleDownloadImportHistory}>
            Download Last Import
          </Button>
        )}
      </div>

      {(availablePeriods.length > 0 || filteredSubmissions.length > 0) && (
        <div className="border border-border rounded-lg bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div>
              <p className="text-sm font-medium">Submit &amp; approve reports</p>
              {selectedPeriod ? (
                <p className="text-xs text-muted-foreground">
                  Period: <span className="font-medium text-foreground">{selectedPeriod.periodKey}</span> • {selectedPeriod.status}
                </p>
              ) : (
                <p className="text-xs text-amber-600">
                  Select a <strong>Period</strong> above (e.g. 2026-01) to submit or approve submissions for that period.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => openStatusModal('submit')} disabled={!selectedPeriod || !canSubmitAll || statusUpdating} title={!selectedPeriod ? 'Select a period first' : undefined}>
                Submit All
              </Button>
              <Button variant="outline" size="sm" onClick={() => openStatusModal('return')} disabled={!selectedPeriod || !canReturnAll || statusUpdating} title={!selectedPeriod ? 'Select a period first' : undefined}>
                Return All
              </Button>
              <Button variant="outline" size="sm" onClick={() => openStatusModal('approve')} disabled={!selectedPeriod || !canApproveAll || statusUpdating} title={!selectedPeriod ? 'Select a period first' : undefined}>
                Approve All
              </Button>
            </div>
          </div>
          {selectedPeriod && (
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>Draft: <span className="font-medium text-foreground">{statusCounts.draft}</span></span>
              <span>Submitted: <span className="font-medium text-foreground">{statusCounts.submitted}</span></span>
              <span>Returned: <span className="font-medium text-foreground">{statusCounts.returned}</span></span>
              <span>Approved: <span className="font-medium text-foreground">{statusCounts.approved}</span></span>
              <span>Locked: <span className="font-medium text-foreground">{statusCounts.locked}</span></span>
            </div>
          )}
        </div>
      )}
 
       <div className="flex gap-2">
         <Button
           variant={activeTab === 'submissions' ? 'default' : 'outline'}
           onClick={() => setActiveTab('submissions')}
           size="sm"
         >
           <List className="w-4 h-4 mr-2" />
           System & Imports
         </Button>
         <Button
           variant={activeTab === 'forms' ? 'default' : 'outline'}
           onClick={() => setActiveTab('forms')}
           size="sm"
         >
           <FileSpreadsheet className="w-4 h-4 mr-2" />
           Public Forms
         </Button>
        <Button
          variant={activeTab === 'narratives' ? 'default' : 'outline'}
          onClick={() => setActiveTab('narratives')}
          size="sm"
          disabled={!projectId || !periodFilterId}
        >
          Narratives
        </Button>
       </div>
 
       <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
         <div className="rounded-lg border border-border bg-card p-4">
           <p className="text-xs text-muted-foreground">System & Imports</p>
           <p className="text-lg font-semibold">{summaryStats.submissions}</p>
           <p className="text-xs text-muted-foreground">
             Manual {summaryStats.manual} • Imported {summaryStats.imported}
           </p>
         </div>
         <div className="rounded-lg border border-border bg-card p-4">
           <p className="text-xs text-muted-foreground">Public Forms</p>
           <p className="text-lg font-semibold">{summaryStats.forms}</p>
           <p className="text-xs text-muted-foreground">
             Total value {summaryStats.formValueTotal.toLocaleString()}
           </p>
         </div>
         <div className="rounded-lg border border-border bg-card p-4">
           <p className="text-xs text-muted-foreground">Totals</p>
           <p className="text-lg font-semibold">
             {(summaryStats.submissionValueTotal + summaryStats.formValueTotal).toLocaleString()}
           </p>
           <p className="text-xs text-muted-foreground">
             Submitted values combined
           </p>
         </div>
       </div>

       {loading ? (
         <div className="flex items-center gap-2 text-muted-foreground">
           <Loader2 className="w-5 h-5 animate-spin" />
           Loading submissions...
         </div>
      ) : activeTab === 'submissions' ? (
         <div className="space-y-3">
           {filteredSubmissions.length === 0 ? (
             <div className="text-center text-muted-foreground border border-dashed border-border rounded-lg p-6">
               No submissions yet.
             </div>
           ) : (
             filteredSubmissions.map((submission) => {
               const indicatorName = submission.indicatorPeriod?.indicator?.name || 'Indicator'
               const periodKey = submission.indicatorPeriod?.periodKey || 'Period'
               const source = getSubmissionSource(submission.values)
               const isExpanded = expandedId === submission.id
               const disaggSummary = summarizeDisaggregations(submission.values || [])
 
               return (
                 <div key={submission.id} className="border border-border rounded-lg bg-card">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30"
                    onClick={() => {
                      const nextId = isExpanded ? null : submission.id
                      setExpandedId(nextId)
                      if (nextId) {
                        loadApprovalLog(nextId)
                      }
                    }}
                  >
                     <div>
                       <p className="font-medium">{indicatorName}</p>
                       <p className="text-xs text-muted-foreground">
                         {periodKey} • {submission.status} • {source}
                       </p>
                     </div>
                     {isExpanded ? (
                       <ChevronUp className="w-4 h-4 text-muted-foreground" />
                     ) : (
                       <ChevronDown className="w-4 h-4 text-muted-foreground" />
                     )}
                   </div>
                   {isExpanded && (
                     <div className="p-4 border-t border-border space-y-3">
                       <div className="text-xs text-muted-foreground">
                         Submitted: {new Date(submission.createdAt).toLocaleString()}
                       </div>
 
                       {Object.keys(disaggSummary).length > 0 && (
                         <div className="space-y-2">
                           {Object.entries(disaggSummary).map(([key, values]) => (
                             <div key={key}>
                               <p className="text-xs font-medium text-muted-foreground mb-1">Summary by {key}</p>
                               <div className="flex flex-wrap gap-2">
                                 {Object.entries(values).map(([label, total]) => (
                                   <span key={label} className="text-xs px-2 py-1 bg-muted rounded">
                                     {label}: {total}
                                   </span>
                                 ))}
                               </div>
                             </div>
                           ))}
                         </div>
                       )}

                      <div className="border border-border rounded p-3 bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Decision Log</p>
                        {approvalLoading[submission.id] ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Loading decisions...
                          </div>
                        ) : (approvalLogs[submission.id] || []).length === 0 ? (
                          <p className="text-xs text-muted-foreground">No approval decisions yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {approvalLogs[submission.id].map((decision) => (
                              <div key={decision.id} className="text-xs">
                                <span className="font-medium text-foreground">
                                  {decision.decision}
                                </span>
                                <span className="text-muted-foreground">
                                  {' '}• {new Date(decision.decidedAt || decision.createdAt).toLocaleString()}
                                </span>
                                {decision.decidedBy?.email && (
                                  <span className="text-muted-foreground"> • {decision.decidedBy.email}</span>
                                )}
                                {decision.reason && (
                                  <div className="text-muted-foreground mt-1">Reason: {decision.reason}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
 
                       <div className="overflow-auto border border-border rounded">
                         <table className="w-full text-xs">
                           <thead className="bg-muted/50">
                             <tr>
                               {hasInputValues(submission.values) && (
                                 <th className="text-left px-2 py-1">Input</th>
                               )}
                               <th className="text-left px-2 py-1">Value</th>
                               <th className="text-left px-2 py-1">Estimated</th>
                               <th className="text-left px-2 py-1">Disaggregations</th>
                               <th className="text-left px-2 py-1">Notes</th>
                             </tr>
                           </thead>
                           <tbody>
                             {(submission.values || []).map((value) => (
                               <tr key={value.id} className="border-t border-border">
                                 {hasInputValues(submission.values) && (
                                   <td className="px-2 py-1">{value.input?.name || '-'}</td>
                                 )}
                                 <td className="px-2 py-1">{value.valueNumber ?? value.valueText ?? '-'}</td>
                                 <td className="px-2 py-1">{value.isEstimated ? 'Yes' : 'No'}</td>
                                 <td className="px-2 py-1">
                                   {(value.disaggregationValues || []).length === 0
                                     ? '-'
                                     : value.disaggregationValues?.map((dv) => dv.valueLabel).join(', ')}
                                 </td>
                                 <td className="px-2 py-1">{value.notes || '-'}</td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                     </div>
                   )}
                 </div>
               )
             })
           )}
         </div>
      ) : activeTab === 'forms' ? (
        <div className="space-y-3">
          {filteredFormResponses.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 justify-between rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-sm text-muted-foreground">
                Create draft submissions from the form responses below so you can submit and approve them in System & Imports.
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={handleConvertToSubmissions}
                disabled={convertLoading || filteredFormResponses.length === 0}
              >
                {convertLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Create submissions from form responses'
                )}
              </Button>
            </div>
          )}
          {filteredFormResponses.length === 0 ? (
            <div className="text-center text-muted-foreground border border-dashed border-border rounded-lg p-6">
              No public form responses yet.
            </div>
          ) : (
            filteredFormResponses.map((response) => {
              const link = response.link
              const indicatorName = link?.indicator?.name || 'Indicator'
              const periodKey = link?.indicatorPeriod?.periodKey || 'Period'
              return (
                <div key={response.id} className="border border-border rounded-lg bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{indicatorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {periodKey} • Public Form
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(response.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {response.values && response.values.length > 0 ? (
                    <div className="mt-3 space-y-2 text-xs">
                      {response.values.map((value) => (
                        <div key={value.id} className="border border-border rounded p-2 bg-muted/20">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{value.input?.name || 'Input'}</span>
                            <span className="text-muted-foreground">
                              {value.valueNumber ?? value.valueText ?? '-'}
                            </span>
                          </div>
                          <div className="text-muted-foreground mt-1 flex flex-wrap gap-2">
                            <span>Estimated: {value.isEstimated ? 'Yes' : 'No'}</span>
                            <span>
                              Disaggregations: {(value.disaggregationValues || []).length === 0
                                ? '-'
                                : value.disaggregationValues?.join(', ')}
                            </span>
                            {value.notes && <span>Notes: {value.notes}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Value:</span>{' '}
                        {response.valueNumber ?? response.valueText ?? '-'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Estimated:</span>{' '}
                        {response.isEstimated ? 'Yes' : 'No'}
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground">Disaggregations:</span>{' '}
                        {(response.disaggregationValues || []).length === 0 ? '-' : response.disaggregationValues?.join(', ')}
                      </div>
                      {response.notes && (
                        <div className="sm:col-span-2">
                          <span className="text-muted-foreground">Notes:</span> {response.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      ) : (
        projectId && periodFilterId ? (
          <NarrativesPanel orgId={orgId} projectId={projectId} periodId={periodFilterId} />
        ) : (
          <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-6">
            Select a project and reporting period to view narratives.
          </div>
        )
      )}
     </div>
   )
 }
