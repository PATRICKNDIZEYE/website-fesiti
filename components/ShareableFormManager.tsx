'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertCircle, Loader2, Link2, Copy, Check, ExternalLink, 
  Plus, Trash2, Pause, Play, Eye, X, Users, BarChart3 
} from 'lucide-react'
import { orgApi } from '@/lib/api-helpers'
import { Indicator, IndicatorPeriod } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ConfirmationModal } from '@/components/ConfirmationModal'

interface ShareableFormManagerProps {
  indicator: Indicator
  orgId: string
  onClose: () => void
}

interface FormLink {
  id: string
  accessToken: string
  title: string
  description?: string
  status: 'active' | 'paused' | 'closed'
  responseCount: number
  requireName: boolean
  requireEmail: boolean
  requirePhone: boolean
  expiresAt?: string
  indicatorPeriod: IndicatorPeriod
  createdAt: string
}

export function ShareableFormManager({ indicator, orgId, onClose }: ShareableFormManagerProps) {
  const [links, setLinks] = useState<FormLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedLink, setSelectedLink] = useState<FormLink | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null)

  const openPeriods = (indicator.periods || []).filter(p => p.status === 'open')

  useEffect(() => {
    fetchLinks()
  }, [indicator.id, orgId])

  const fetchLinks = async () => {
    try {
      setLoading(true)
      const response = await orgApi.get(orgId, `data-collection/links?indicatorId=${indicator.id}`)
      setLinks(response.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load form links')
    } finally {
      setLoading(false)
    }
  }

  const getFormUrl = (token: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/form/${token}`
  }

  const copyToClipboard = async (token: string, linkId: string) => {
    const url = getFormUrl(token)
    await navigator.clipboard.writeText(url)
    setCopiedId(linkId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleStatusChange = async (linkId: string, newStatus: 'active' | 'paused' | 'closed') => {
    try {
      await orgApi.patch(orgId, `data-collection/links/${linkId}/status`, { status: newStatus })
      fetchLinks()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!linkToDelete) return
    try {
      await orgApi.delete(orgId, `data-collection/links/${linkToDelete}`)
      setShowDeleteModal(false)
      setLinkToDelete(null)
      fetchLinks()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete link')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <ConfirmationModal
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          onConfirm={handleDelete}
          title="Delete Form Link"
          description="Are you sure you want to delete this form link? All collected responses will also be deleted. This action cannot be undone."
          type="delete"
        />

        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Shareable Forms
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{indicator.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
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
          ) : (
            <>
              {/* Create New Link */}
              {!showCreateForm ? (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="outline"
                  className="w-full mb-6 border-dashed"
                  disabled={openPeriods.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {openPeriods.length === 0 
                    ? 'No open periods available' 
                    : 'Create Shareable Form Link'}
                </Button>
              ) : (
                <CreateLinkForm
                  indicator={indicator}
                  openPeriods={openPeriods}
                  orgId={orgId}
                  onSuccess={() => {
                    setShowCreateForm(false)
                    fetchLinks()
                  }}
                  onCancel={() => setShowCreateForm(false)}
                />
              )}

              {/* Existing Links */}
              {links.length === 0 && !showCreateForm ? (
                <div className="text-center py-12 border border-dashed border-border rounded-lg">
                  <Link2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">No shareable forms created yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create a link to collect data from anyone without requiring them to log in
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {links.map((link) => (
                    <div key={link.id} className="border border-border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">{link.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Period: {link.indicatorPeriod?.periodKey}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs px-2 py-1 rounded",
                            link.status === 'active' && "bg-green-500/10 text-green-600",
                            link.status === 'paused' && "bg-yellow-500/10 text-yellow-600",
                            link.status === 'closed' && "bg-gray-500/10 text-gray-600"
                          )}>
                            {link.status}
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {link.responseCount}
                          </span>
                        </div>
                      </div>

                      {/* Link URL */}
                      <div className="flex items-center gap-2 mb-3 p-2 bg-background rounded border border-border">
                        <input
                          type="text"
                          readOnly
                          value={getFormUrl(link.accessToken)}
                          className="flex-1 bg-transparent text-sm text-muted-foreground outline-none"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(link.accessToken, link.id)}
                        >
                          {copiedId === link.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <a
                          href={getFormUrl(link.accessToken)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {link.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(link.id, 'paused')}
                          >
                            <Pause className="w-3 h-3 mr-1" />
                            Pause
                          </Button>
                        ) : link.status === 'paused' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(link.id, 'active')}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Resume
                          </Button>
                        ) : null}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLink(link)}
                        >
                          <BarChart3 className="w-3 h-3 mr-1" />
                          View Results
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setLinkToDelete(link.id)
                            setShowDeleteModal(true)
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Results Modal */}
        {selectedLink && (
          <ResultsView
            linkId={selectedLink.id}
            orgId={orgId}
            onClose={() => setSelectedLink(null)}
          />
        )}
      </div>
    </div>
  )
}

function CreateLinkForm({
  indicator,
  openPeriods,
  orgId,
  onSuccess,
  onCancel,
}: {
  indicator: Indicator
  openPeriods: IndicatorPeriod[]
  orgId: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(`${indicator.name} Data Collection`)
  const [description, setDescription] = useState('')
  const [periodId, setPeriodId] = useState(openPeriods[0]?.id || '')
  const [requireName, setRequireName] = useState(false)
  const [requireEmail, setRequireEmail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!periodId) {
      setError('Please select a period')
      return
    }

    try {
      setLoading(true)
      setError('')
      await orgApi.post(orgId, 'data-collection/links', {
        indicatorId: indicator.id,
        indicatorPeriodId: periodId,
        title,
        description: description || undefined,
        requireName,
        requireEmail,
        welcomeMessage: `Please provide your data for ${indicator.name}.`,
        thankYouMessage: 'Thank you for your submission! Your data has been recorded.',
      })
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-muted/20 mb-6">
      <h4 className="font-medium text-foreground mb-4">Create New Shareable Form</h4>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-foreground">Form Title *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter form title..."
            className="bg-background border-border"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Reporting Period *</Label>
          <select
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
          >
            {openPeriods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.periodKey} ({new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Description (optional)</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description for respondents..."
            rows={2}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Required Information</Label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requireName}
                onChange={(e) => setRequireName(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-muted-foreground">Require Name</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requireEmail}
                onChange={(e) => setRequireEmail(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-muted-foreground">Require Email</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Link
          </Button>
        </div>
      </form>
    </div>
  )
}

function ResultsView({
  linkId,
  orgId,
  onClose,
}: {
  linkId: string
  orgId: string
  onClose: () => void
}) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchResults()
  }, [linkId])

  const fetchResults = async () => {
    try {
      setLoading(true)
      const response = await orgApi.get(orgId, `data-collection/links/${linkId}/aggregated`)
      setData(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Aggregated Results</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : data ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{data.totalResponses}</p>
                  <p className="text-sm text-muted-foreground">Responses</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{data.total?.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total ({data.aggregationRule})</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {data.period?.periodKey || '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">Period</p>
                </div>
              </div>

              {/* By Disaggregation */}
              {Object.keys(data.byDisaggregation || {}).length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-3">By Category</h4>
                  <div className="space-y-2">
                    {Object.entries(data.byDisaggregation).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-muted/20 rounded">
                        <span className="text-foreground">{key === 'total' ? 'Total (no category)' : key}</span>
                        <span className="font-semibold text-foreground">{value?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Responses */}
              {data.responses?.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-3">Recent Responses</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {data.responses.slice(0, 10).map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between p-2 bg-muted/10 rounded text-sm">
                        <div>
                          <span className="text-foreground">{r.respondentName || 'Anonymous'}</span>
                          <span className="text-muted-foreground ml-2">
                            {new Date(r.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
