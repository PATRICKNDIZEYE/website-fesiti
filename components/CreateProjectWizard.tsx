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
import { AlertCircle, Plus, X, Loader2, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import api from '@/lib/api'
import { User } from '@/lib/types'
import { Progress } from '@/components/ui/progress'

interface CreateProjectWizardProps {
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

const STEPS = [
  { id: 1, title: 'Project Info', description: 'Basic project information' },
  { id: 2, title: 'Team', description: 'Manager and team members' },
  { id: 3, title: 'Indicators', description: 'Define what to measure' },
  { id: 4, title: 'Review', description: 'Review and create' },
]

export function CreateProjectWizard({ open, onOpenChange, onSuccess }: CreateProjectWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
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
      // Reset form when opening
      setCurrentStep(1)
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        managerId: '',
        teamMemberIds: [],
      })
      setIndicators([])
      setError('')
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

  const validateStep = (step: number): boolean => {
    setError('')
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          setError('Project name is required')
          return false
        }
        if (formData.startDate && formData.endDate) {
          if (new Date(formData.endDate) < new Date(formData.startDate)) {
            setError('End date must be after start date')
            return false
          }
        }
        return true
      
      case 2:
        if (!formData.managerId) {
          setError('Manager is required')
          return false
        }
        return true
      
      case 3:
        // Indicators are optional, but if added, they must have names
        for (const indicator of indicators) {
          if (indicator.name.trim() === '') {
            setError('All indicators must have a name')
            return false
          }
        }
        return true
      
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Final validation
      if (!validateStep(1) || !validateStep(2)) {
        setCurrentStep(1)
        return
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
        const validIndicators = indicators.filter(ind => ind.name.trim())
        for (const indicator of validIndicators) {
          await api.post('/indicators', {
            name: indicator.name,
            description: indicator.description || undefined,
            type: indicator.type,
            unit: indicator.unit,
            projectId,
          })
        }
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const progress = (currentStep / STEPS.length) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    currentStep > step.id
                      ? 'bg-primary border-primary text-primary-foreground'
                    : currentStep === step.id
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-muted border-border text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">{step.id}</span>
                  )}
                </div>
                <span
                  className={`text-xs mt-2 text-center ${
                    currentStep >= step.id ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Project Information */}
            {currentStep === 1 && (
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
                    rows={4}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
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
              </div>
            )}

            {/* Step 2: Team */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Team Assignment</h3>
                
                <div className="space-y-2">
                  <Label className="text-foreground">Manager *</Label>
                  {loadingUsers ? (
                    <div className="text-muted-foreground">Loading users...</div>
                  ) : (
                    <select
                      value={formData.managerId}
                      onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                  <div className="max-h-64 overflow-y-auto border border-border rounded-md p-3 space-y-2 bg-muted/30">
                    {users.filter(u => u.id !== formData.managerId).map((user) => (
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
                  {formData.teamMemberIds.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formData.teamMemberIds.length} team member(s) selected
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Indicators */}
            {currentStep === 3 && (
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

                <p className="text-sm text-muted-foreground">
                  Define what you want to measure and track. You can add indicators later if needed.
                </p>

                {indicators.length === 0 ? (
                  <div className="text-center py-12 border border-border rounded-lg bg-card">
                    <p className="text-muted-foreground mb-4">No indicators added yet</p>
                    <Button
                      type="button"
                      onClick={addIndicator}
                      variant="outline"
                      className="border-border"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Indicator
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {indicators.map((indicator, index) => (
                      <div key={index} className="border border-border rounded-lg p-4 bg-card">
                        <div className="flex items-center justify-between mb-3">
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

                        <div className="space-y-3">
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
                              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-foreground">Type</Label>
                              <select
                                value={indicator.type}
                                onChange={(e) => updateIndicator(index, 'type', e.target.value as any)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                              >
                                <option value="number">Number</option>
                                <option value="percentage">Percentage</option>
                                <option value="currency">Currency</option>
                                <option value="text">Text</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Review Project Details</h3>
                
                <div className="space-y-4">
                  <div className="border border-border rounded-lg p-4 bg-card">
                    <h4 className="font-semibold text-foreground mb-3">Project Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <span className="ml-2 text-foreground font-medium">{formData.name}</span>
                      </div>
                      {formData.description && (
                        <div>
                          <span className="text-muted-foreground">Description:</span>
                          <p className="mt-1 text-foreground">{formData.description}</p>
                        </div>
                      )}
                      {formData.startDate && (
                        <div>
                          <span className="text-muted-foreground">Start Date:</span>
                          <span className="ml-2 text-foreground">{new Date(formData.startDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {formData.endDate && (
                        <div>
                          <span className="text-muted-foreground">End Date:</span>
                          <span className="ml-2 text-foreground">{new Date(formData.endDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-4 bg-card">
                    <h4 className="font-semibold text-foreground mb-3">Team</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Manager:</span>
                        <span className="ml-2 text-foreground">
                          {users.find(u => u.id === formData.managerId)?.firstName} {users.find(u => u.id === formData.managerId)?.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Team Members:</span>
                        <span className="ml-2 text-foreground">
                          {formData.teamMemberIds.length > 0
                            ? `${formData.teamMemberIds.length} member(s)`
                            : 'None selected'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-4 bg-card">
                    <h4 className="font-semibold text-foreground mb-3">Indicators</h4>
                    {indicators.filter(ind => ind.name.trim()).length > 0 ? (
                      <div className="space-y-2">
                        {indicators.filter(ind => ind.name.trim()).map((indicator, index) => (
                          <div key={index} className="text-sm p-2 bg-muted/50 rounded">
                            <span className="font-medium text-foreground">{indicator.name}</span>
                            <span className="ml-2 text-muted-foreground">
                              ({indicator.type}, {indicator.unit})
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No indicators added</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? () => onOpenChange(false) : prevStep}
                className="border-border"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {currentStep === 1 ? 'Cancel' : 'Previous'}
              </Button>
              
              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Create Project
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
