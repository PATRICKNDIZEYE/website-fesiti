'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, X, Trash2, AlertCircle, Loader2, ChevronDown, ChevronRight, Edit2, Check } from 'lucide-react'
import { disaggregationsApi } from '@/lib/api-helpers'
import { DisaggregationDef, DisaggregationValue } from '@/lib/types'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { Header } from '@/components/Header'

export default function DisaggregationsPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const [definitions, setDefinitions] = useState<DisaggregationDef[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchDefinitions()
  }, [orgId])

  const fetchDefinitions = async () => {
    try {
      setLoading(true)
      const response = await disaggregationsApi.listDefinitions(orgId)
      setDefinitions(response.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load disaggregations')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header 
        title="Disaggregation Dimensions" 
        subtitle="Define breakdown dimensions for indicators (e.g., Gender, Age Group, Location)"
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-card rounded-2xl border border-border/70 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Disaggregation Definitions</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create dimensions like Gender, Age Group, Disability Status, etc.
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Dimension
          </Button>
        </div>

        {showCreateForm && (
          <CreateDefinitionForm
            orgId={orgId}
            onSuccess={() => {
              setShowCreateForm(false)
              fetchDefinitions()
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {definitions.length === 0 && !showCreateForm ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground mb-4">No disaggregation dimensions defined yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Disaggregations help you track who benefits from your programs (by gender, age, location, etc.)
            </p>
            <Button onClick={() => setShowCreateForm(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Dimension
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {definitions.map((def) => (
              <DefinitionCard
                key={def.id}
                definition={def}
                orgId={orgId}
                onUpdate={fetchDefinitions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CreateDefinitionForm({
  orgId,
  onSuccess,
  onCancel,
}: {
  orgId: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    try {
      setLoading(true)
      setError('')
      await disaggregationsApi.createDefinition(orgId, {
        name: name.trim(),
        code: code.trim() || undefined,
      })
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create dimension')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-muted/30 mb-4">
      <h4 className="font-medium text-foreground mb-4">Create New Dimension</h4>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">Dimension Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Gender, Age Group, Location"
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Code (Optional)</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., GEN, AGE, LOC"
              className="bg-background border-border"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Dimension
          </Button>
        </div>
      </form>
    </div>
  )
}

function DefinitionCard({
  definition,
  orgId,
  onUpdate,
}: {
  definition: DisaggregationDef
  orgId: string
  onUpdate: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [values, setValues] = useState<DisaggregationValue[]>(definition.values || [])
  const [showAddValue, setShowAddValue] = useState(false)
  const [loadingValues, setLoadingValues] = useState(false)

  const fetchValues = async () => {
    try {
      setLoadingValues(true)
      const response = await disaggregationsApi.listValues(orgId, definition.id)
      setValues(response.data || [])
    } catch (err) {
      console.error('Failed to fetch values:', err)
    } finally {
      setLoadingValues(false)
    }
  }

  const handleExpand = () => {
    if (!expanded && values.length === 0) {
      fetchValues()
    }
    setExpanded(!expanded)
  }

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30"
        onClick={handleExpand}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <div>
            <h4 className="font-semibold text-foreground">{definition.name}</h4>
            {definition.code && (
              <span className="text-xs text-muted-foreground">Code: {definition.code}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {values.length} value{values.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border p-4 bg-muted/10">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-sm font-medium text-foreground">Values</h5>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                setShowAddValue(!showAddValue)
              }}
              variant="outline"
              size="sm"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Value
            </Button>
          </div>

          {showAddValue && (
            <AddValueForm
              orgId={orgId}
              defId={definition.id}
              currentCount={values.length}
              onSuccess={() => {
                setShowAddValue(false)
                fetchValues()
              }}
              onCancel={() => setShowAddValue(false)}
            />
          )}

          {loadingValues ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : values.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No values defined. Add values like "Male", "Female" for Gender dimension.
            </p>
          ) : (
            <div className="space-y-2">
              {values
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((value) => (
                  <div
                    key={value.id}
                    className="flex items-center justify-between p-2 bg-background rounded border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-6">{value.sortOrder + 1}.</span>
                      <span className="text-foreground">{value.valueLabel}</span>
                      {value.valueCode && (
                        <span className="text-xs text-muted-foreground">({value.valueCode})</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AddValueForm({
  orgId,
  defId,
  currentCount,
  onSuccess,
  onCancel,
}: {
  orgId: string
  defId: string
  currentCount: number
  onSuccess: () => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) {
      setError('Label is required')
      return
    }

    try {
      setLoading(true)
      setError('')
      await disaggregationsApi.addValue(orgId, {
        disaggregationDefId: defId,
        valueLabel: label.trim(),
        valueCode: code.trim() || undefined,
        sortOrder: currentCount,
      })
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add value')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-border rounded p-3 bg-background mb-4">
      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Value Label *</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Male, Female, 0-5 years"
            className="bg-background border-border h-9"
          />
        </div>
        <div className="w-24 space-y-1">
          <Label className="text-xs text-muted-foreground">Code</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="M, F"
            className="bg-background border-border h-9"
          />
        </div>
        <Button type="submit" size="sm" disabled={loading} className="h-9">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel} className="h-9">
          <X className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
