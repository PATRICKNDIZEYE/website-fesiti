'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Pencil, Trash2, AlertCircle, Loader2, Target } from 'lucide-react'
import { resultsNodesApi } from '@/lib/api-helpers'
import type { ResultsNode } from '@/lib/types'
import { ConfirmationModal } from '@/components/ConfirmationModal'

interface ResultsNodesManagerProps {
  projectId: string
  orgId: string
}

export function ResultsNodesManager({ projectId, orgId }: ResultsNodesManagerProps) {
  const [nodes, setNodes] = useState<ResultsNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    nodeType: 'outcome' as 'outcome' | 'output',
    sortOrder: '',
  })

  useEffect(() => {
    fetchNodes()
  }, [orgId, projectId])

  const fetchNodes = async () => {
    try {
      setLoading(true)
      const response = await resultsNodesApi.list(orgId, projectId)
      setNodes(response.data || [])
    } catch (err) {
      console.error('Failed to fetch project objectives:', err)
      setError('Failed to load project objectives')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      code: '',
      description: '',
      nodeType: 'outcome',
      sortOrder: '',
    })
    setShowForm(false)
    setEditingId(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await resultsNodesApi.create(orgId, {
        projectId,
        title: formData.title.trim(),
        code: formData.code.trim() || undefined,
        description: formData.description.trim() || undefined,
        nodeType: formData.nodeType,
        sortOrder: formData.sortOrder ? parseInt(formData.sortOrder, 10) : undefined,
      })
      resetForm()
      fetchNodes()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create objective')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !formData.title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await resultsNodesApi.update(orgId, editingId, {
        title: formData.title.trim(),
        code: formData.code.trim() || undefined,
        description: formData.description.trim() || undefined,
        nodeType: formData.nodeType,
        sortOrder: formData.sortOrder ? parseInt(formData.sortOrder, 10) : undefined,
      })
      resetForm()
      fetchNodes()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update objective')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId || !orgId) return
    try {
      await resultsNodesApi.delete(orgId, deleteId)
      setDeleteId(null)
      fetchNodes()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete objective')
      setDeleteId(null)
    }
  }

  const startEdit = (node: ResultsNode) => {
    setFormData({
      title: node.title,
      code: node.code || '',
      description: node.description || '',
      nodeType: (node.nodeType as 'outcome' | 'output') || 'outcome',
      sortOrder: node.sortOrder != null ? String(node.sortOrder) : '',
    })
    setEditingId(node.id)
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete objective"
        description="Are you sure? Indicators linked to this objective will show under “Other indicators” in PITT until reassigned."
        type="delete"
        confirmText="Delete"
        cancelText="Cancel"
      />

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Project objectives (Results framework)</h3>
        {!showForm && (
          <Button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            variant="outline"
            size="sm"
            className="border-border"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add objective
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Define outcomes and outputs for this project. Link indicators to these in the Indicators tab so they appear under the right section in the PITT report.
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <div className="border border-border rounded-lg p-4 bg-card space-y-4">
          <h4 className="font-medium text-foreground">
            {editingId ? 'Edit objective' : 'New objective'}
          </h4>
          <form
            onSubmit={editingId ? handleUpdate : handleCreate}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Improved learning outcomes"
                  className="bg-background border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Code (optional)</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., OBJ-1"
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Description (optional)</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this objective..."
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Type</Label>
                <select
                  value={formData.nodeType}
                  onChange={(e) => setFormData({ ...formData, nodeType: e.target.value as 'outcome' | 'output' })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                >
                  <option value="outcome">Outcome</option>
                  <option value="output">Output</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Sort order (optional)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  placeholder="0"
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {editingId ? 'Save changes' : 'Create objective'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {nodes.length === 0 && !showForm ? (
        <div className="text-center py-8 border border-border rounded-lg bg-card">
          <Target className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">No project objectives yet</p>
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            size="sm"
            className="border-border"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add your first objective
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="flex items-start justify-between p-4 border border-border rounded-lg bg-card"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{node.title}</span>
                  {node.code && (
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {node.code}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary capitalize">
                    {node.nodeType}
                  </span>
                </div>
                {node.description && (
                  <p className="text-sm text-muted-foreground mt-1">{node.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(node)}
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(node.id)}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
