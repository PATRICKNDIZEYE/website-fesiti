'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Plus, X, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { User } from '@/lib/types'

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface IndicatorForm {
  name: string
  description: string
  type: 'quantitative' | 'qualitative' | 'percentage'
  unit: 'number' | 'percentage' | 'currency' | 'text'
}

export function CreateProjectModal({ open, onOpenChange, onSuccess }: CreateProjectModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    managerId: '',
    teamMemberIds: [] as string[],
  })

  const [indicators, setIndicators] = useState<IndicatorForm[]>([])

  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await api.get('/users')
      setUsers(response.data)
      // Set current user as default manager if available
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      if (currentUser.id) {
        setFormData(prev => ({ ...prev, managerId: currentUser.id }))
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const addIndicator = () => {
    setIndicators([
      ...indicators,
      {
        name: '',
        description: '',
        type: 'quantitative',
        unit: 'number',
      },
    ])
  }

  const removeIndicator = (index: number) => {
    setIndicators(indicators.filter((_, i) => i !== index))
  }

  const updateIndicator = (index: number, field: keyof IndicatorForm, value: string) => {
    const updated = [...indicators]
    updated[index] = { ...updated[index], [field]: value }
    setIndicators(updated)
  }

  const toggleTeamMember = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      teamMemberIds: prev.teamMemberIds.includes(userId)
        ? prev.teamMemberIds.filter(id => id !== userId)
        : [...prev.teamMemberIds, userId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error('Project name is required')
      }
      if (!formData.managerId) {
        throw new Error('Manager is required')
      }
      if (formData.startDate && formData.endDate) {
        if (new Date(formData.endDate) < new Date(formData.startDate)) {
          throw new Error('End date must be after start date')
        }
      }

      // Create project
      const projectResponse = await api.post('/projects', {
        name: formData.name,
        description: formData.description || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        managerId: formData.managerId,
        teamMemberIds: formData.teamMemberIds.length > 0 ? formData.teamMemberIds : undefined,
        status: 'planning',
      })

      const projectId = projectResponse.data.id

      // Create indicators
      if (indicators.length > 0) {
        for (const indicator of indicators) {
          if (indicator.name.trim()) {
            await api.post('/indicators', {
              name: indicator.name,
              description: indicator.description || undefined,
              type: indicator.type,
              unit: indicator.unit,
              projectId,
            })
          }
        }
      }

      onSuccess()
      onOpenChange(false)
      // Reset form
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        managerId: '',
        teamMemberIds: [],
      })
      setIndicators([])
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Define your project framework with indicators and targets
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Project Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Project Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter project name"
                required
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your project..."
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-foreground">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-foreground">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Manager *</Label>
              {loadingUsers ? (
                <div className="text-muted-foreground">Loading users...</div>
              ) : (
                <select
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="">Select a manager</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Team Members</Label>
              <div className="max-h-32 overflow-y-auto border border-border rounded-md p-2 space-y-1">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center space-x-2 cursor-pointer hover:bg-accent p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.teamMemberIds.includes(user.id)}
                      onChange={() => toggleTeamMember(user.id)}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-foreground">
                      {user.firstName} {user.lastName} ({user.email})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Indicators */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Indicators</h3>
              <Button
                type="button"
                onClick={addIndicator}
                variant="outline"
                size="sm"
                className="border-border"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Indicator
              </Button>
            </div>

            {indicators.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Add indicators to track progress. You can add them later if needed.
              </p>
            )}

            {indicators.map((indicator, index) => (
              <div key={index} className="border border-border rounded-lg p-4 space-y-3 bg-card">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">Indicator {index + 1}</h4>
                  <Button
                    type="button"
                    onClick={() => removeIndicator(index)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Name *</Label>
                  <Input
                    value={indicator.name}
                    onChange={(e) => updateIndicator(index, 'name', e.target.value)}
                    placeholder="e.g., Number of beneficiaries reached"
                    required
                    className="bg-background border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Description</Label>
                  <textarea
                    value={indicator.description}
                    onChange={(e) => updateIndicator(index, 'description', e.target.value)}
                    placeholder="Describe what this indicator measures..."
                    rows={2}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Type</Label>
                    <select
                      value={indicator.type}
                      onChange={(e) => updateIndicator(index, 'type', e.target.value as any)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500"
                    >
                      <option value="quantitative">Quantitative</option>
                      <option value="qualitative">Qualitative</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Unit</Label>
                    <select
                      value={indicator.unit}
                      onChange={(e) => updateIndicator(index, 'unit', e.target.value as any)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500"
                    >
                      <option value="number">Number</option>
                      <option value="percentage">Percentage</option>
                      <option value="currency">Currency</option>
                      <option value="text">Text</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gold-500 hover:bg-gold-600 text-charcoal-900"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

