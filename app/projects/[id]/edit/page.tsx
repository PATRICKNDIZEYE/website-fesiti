'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { TeamChat } from '@/components/TeamChat'
import { useLayout } from '@/contexts/LayoutContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Plus, X, Loader2, ChevronRight, ChevronLeft, Check, Save, Search, AlertTriangle } from 'lucide-react'
import api from '@/lib/api'
import { User, Project, Indicator } from '@/lib/types'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface IndicatorForm {
  id?: string
  name: string
  description: string
  type: 'quantitative' | 'qualitative' | 'percentage'
  unit: 'number' | 'percentage' | 'currency' | 'text'
}

const STEPS = [
  { id: 1, title: 'Project Info', description: 'Basic project information' },
  { id: 2, title: 'Team', description: 'Manager and team members' },
  { id: 3, title: 'Indicators', description: 'Define what to measure' },
  { id: 4, title: 'Review', description: 'Review and save changes' },
]

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const { sidebarCollapsed, chatCollapsed } = useLayout()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [project, setProject] = useState<Project | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    managerId: '',
    teamMemberIds: [] as string[],
  })

  const [indicators, setIndicators] = useState<IndicatorForm[]>([])
  const [teamSearchQuery, setTeamSearchQuery] = useState('')

  useEffect(() => {
    fetchUsers()
    fetchProject()
  }, [projectId])

  useEffect(() => {
    // Auto-save draft when form data changes
    const timer = setTimeout(() => {
      saveDraft()
    }, 1000) // Debounce: save 1 second after last change

    return () => clearTimeout(timer)
  }, [formData, indicators, currentStep])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/projects/${projectId}`)
      const projectData = response.data
      setProject(projectData)

      // Populate form with existing data
      setFormData({
        name: projectData.name || '',
        description: projectData.description || '',
        startDate: projectData.startDate ? new Date(projectData.startDate).toISOString().split('T')[0] : '',
        endDate: projectData.endDate ? new Date(projectData.endDate).toISOString().split('T')[0] : '',
        managerId: projectData.managerId || projectData.manager?.id || '',
        teamMemberIds: projectData.teamMembers?.map((m: User) => m.id) || [],
      })

      // Load existing indicators
      if (projectData.indicators) {
        setIndicators(
          projectData.indicators.map((ind: Indicator) => ({
            id: ind.id,
            name: ind.name || '',
            description: ind.description || '',
            type: ind.type || 'quantitative',
            unit: ind.unit || 'number',
          }))
        )
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
      setError('Failed to load project data')
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = () => {
    try {
      setSaving(true)
      const draft = {
        formData,
        indicators,
        currentStep,
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem(`project_edit_draft_${projectId}`, JSON.stringify(draft))
      setSuccess('Draft saved automatically')
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      console.error('Failed to save draft:', error)
    } finally {
      setSaving(false)
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
    const indicator = indicators[index]
    // If it's an existing indicator, we'll delete it on save
    setIndicators(indicators.filter((_, i) => i !== index))
  }

  const updateIndicator = (index: number, field: keyof IndicatorForm, value: string) => {
    const updated = [...indicators]
    updated[index] = { ...updated[index], [field]: value }
    
    // If type changes, update unit to match
    if (field === 'type') {
      const type = value as IndicatorForm['type']
      let defaultUnit: IndicatorForm['unit'] = 'number'
      
      if (type === 'percentage') {
        defaultUnit = 'percentage'
      } else if (type === 'qualitative') {
        defaultUnit = 'text'
      } else if (type === 'quantitative') {
        defaultUnit = 'number'
      }
      
      updated[index].unit = defaultUnit
    }
    
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

  const getAvailableUnits = (type: IndicatorForm['type']): IndicatorForm['unit'][] => {
    switch (type) {
      case 'quantitative':
        return ['number', 'percentage', 'currency', 'text']
      case 'qualitative':
        return ['text']
      case 'percentage':
        return ['percentage']
      default:
        return ['number', 'percentage', 'currency', 'text']
    }
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

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    setShowConfirmDialog(false)

    try {
      // Final validation
      if (!validateStep(1) || !validateStep(2)) {
        setCurrentStep(1)
        return
      }

      // Update project
      await api.patch(`/projects/${projectId}`, {
        name: formData.name,
        description: formData.description || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        managerId: formData.managerId,
        teamMemberIds: formData.teamMemberIds.length > 0 ? formData.teamMemberIds : undefined,
      })

      // Get existing indicators
      const existingIndicators = await api.get(`/indicators?projectId=${projectId}`)
      const existingIds = existingIndicators.data.map((ind: Indicator) => ind.id)

      // Update/create/delete indicators
      const indicatorsToCreate = indicators.filter(ind => !ind.id && ind.name.trim())
      const indicatorsToUpdate = indicators.filter(ind => ind.id && ind.name.trim())
      const indicatorsToDelete = existingIds.filter((id: string) => 
        !indicators.some(ind => ind.id === id)
      )

      // Create new indicators
      for (const indicator of indicatorsToCreate) {
        await api.post('/indicators', {
          name: indicator.name,
          description: indicator.description || undefined,
          type: indicator.type,
          unit: indicator.unit,
          projectId,
        })
      }

      // Update existing indicators
      for (const indicator of indicatorsToUpdate) {
        await api.patch(`/indicators/${indicator.id}`, {
          name: indicator.name,
          description: indicator.description || undefined,
          type: indicator.type,
          unit: indicator.unit,
        })
      }

      // Delete removed indicators
      for (const id of indicatorsToDelete) {
        await api.delete(`/indicators/${id}`)
      }

      // Clear draft on success
      localStorage.removeItem(`project_edit_draft_${projectId}`)
      
      // Redirect to project detail page
      router.push(`/projects/${projectId}`)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update project')
      setLoading(false)
    }
  }

  const progress = (currentStep / STEPS.length) * 100

  if (loading && !project) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300",
          sidebarCollapsed ? "ml-20" : "ml-64",
          chatCollapsed ? "mr-12" : "mr-80"
        )}>
          <Header title="Edit Project" />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
              <p className="text-muted-foreground">Loading project data...</p>
            </div>
          </div>
        </div>
        <TeamChat />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300",
          sidebarCollapsed ? "ml-20" : "ml-64",
          chatCollapsed ? "mr-12" : "mr-80"
        )}>
          <Header title="Edit Project" />
          <div className="flex-1 flex items-center justify-center">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Project not found</AlertDescription>
            </Alert>
          </div>
        </div>
        <TeamChat />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        sidebarCollapsed ? "ml-20" : "ml-64",
        chatCollapsed ? "mr-12" : "mr-80"
      )}>
        <Header title={`Edit: ${project.name}`} />
        
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            {/* Header with back button and save status */}
            <div className="flex items-center justify-between mb-6">
              <Link
                href={`/projects/${projectId}`}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Project</span>
              </Link>
              <div className="flex items-center space-x-4">
                {success && (
                  <span className="text-sm text-gold-500 flex items-center space-x-1">
                    <Check className="w-4 h-4" />
                    <span>{success}</span>
                  </span>
                )}
                {saving && (
                  <span className="text-sm text-muted-foreground flex items-center space-x-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving draft...</span>
                  </span>
                )}
                <Button
                  type="button"
                  onClick={saveDraft}
                  variant="outline"
                  size="sm"
                  className="border-border"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-8">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                        currentStep > step.id
                          ? 'bg-gold-500 border-gold-500 text-charcoal-900'
                          : currentStep === step.id
                          ? 'bg-gold-500/20 border-gold-500 text-gold-500'
                          : 'bg-muted border-border text-muted-foreground'
                      )}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span className="font-semibold">{step.id}</span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs mt-2 text-center",
                        currentStep >= step.id ? 'text-foreground font-medium' : 'text-muted-foreground'
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mx-2",
                        currentStep > step.id ? 'bg-gold-500' : 'bg-border'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Form Content */}
            <div className="space-y-6">
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
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground">Team Members</Label>
                      {formData.teamMemberIds.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {formData.teamMemberIds.length} selected
                        </span>
                      )}
                    </div>
                    
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search team members by name or email..."
                        value={teamSearchQuery}
                        onChange={(e) => setTeamSearchQuery(e.target.value)}
                        className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    {/* Team Members List */}
                    <div className="max-h-64 overflow-y-auto border border-border rounded-md p-3 space-y-2 bg-muted/30">
                      {(() => {
                        const availableMembers = users.filter(u => u.id !== formData.managerId)
                        const filteredMembers = teamSearchQuery
                          ? availableMembers.filter(user => {
                              const searchLower = teamSearchQuery.toLowerCase()
                              return (
                                user.firstName.toLowerCase().includes(searchLower) ||
                                user.lastName.toLowerCase().includes(searchLower) ||
                                user.email.toLowerCase().includes(searchLower) ||
                                `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower)
                              )
                            })
                          : availableMembers

                        if (filteredMembers.length === 0) {
                          return (
                            <div className="text-center py-8 text-muted-foreground">
                              <p className="text-sm">No team members found</p>
                              {teamSearchQuery && (
                                <p className="text-xs mt-1">Try a different search term</p>
                              )}
                            </div>
                          )
                        }

                        return filteredMembers.map((user) => (
                          <label key={user.id} className="flex items-center space-x-2 cursor-pointer hover:bg-accent p-2 rounded transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.teamMemberIds.includes(user.id)}
                              onChange={() => toggleTeamMember(user.id)}
                              className="rounded border-border"
                            />
                            <div className="flex-1">
                              <span className="text-sm text-foreground font-medium">
                                {user.firstName} {user.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({user.email})
                              </span>
                            </div>
                          </label>
                        ))
                      })()}
                    </div>
                    
                    {formData.teamMemberIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.teamMemberIds.map((userId) => {
                          const user = users.find(u => u.id === userId)
                          if (!user) return null
                          return (
                            <div
                              key={userId}
                              className="flex items-center space-x-1 px-2 py-1 bg-gold-500/20 border border-gold-500/30 rounded text-sm"
                            >
                              <span className="text-foreground">
                                {user.firstName} {user.lastName}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleTeamMember(userId)}
                                className="text-gold-600 hover:text-gold-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
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
                    Define what you want to measure and track. You can add, edit, or remove indicators.
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
                            <h4 className="font-medium text-foreground">
                              Indicator {index + 1} {indicator.id && <span className="text-xs text-muted-foreground">(Existing)</span>}
                            </h4>
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
                                  disabled={getAvailableUnits(indicator.type).length === 1}
                                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {getAvailableUnits(indicator.type).map((unit) => (
                                    <option key={unit} value={unit}>
                                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                                    </option>
                                  ))}
                                </select>
                                {getAvailableUnits(indicator.type).length === 1 && (
                                  <p className="text-xs text-muted-foreground">
                                    Unit is automatically set for {indicator.type} type
                                  </p>
                                )}
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
                  <h3 className="text-lg font-semibold text-foreground">Review Changes</h3>
                  
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
                              {indicator.id && (
                                <span className="ml-2 text-xs text-muted-foreground">(Existing)</span>
                              )}
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
              <div className="flex justify-between pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={currentStep === 1 ? () => router.push(`/projects/${projectId}`) : prevStep}
                  className="border-border"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  {currentStep === 1 ? 'Cancel' : 'Previous'}
                </Button>
                
                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-gold-500 hover:bg-gold-600 text-charcoal-900"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={loading}
                    className="bg-gold-500 hover:bg-gold-600 text-charcoal-900"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TeamChat />

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-gold-500" />
              <span>Confirm Project Update</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to save these changes? This will update the project and all associated indicators.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium text-foreground mb-1">Project: {formData.name}</p>
              {formData.managerId && (
                <p className="text-xs text-muted-foreground">
                  Manager: {users.find(u => u.id === formData.managerId)?.firstName} {users.find(u => u.id === formData.managerId)?.lastName}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.teamMemberIds.length} team member(s), {indicators.filter(ind => ind.name.trim()).length} indicator(s)
              </p>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This will update the project details, team members, and indicators. Existing indicators that are removed will be deleted.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gold-500 hover:bg-gold-600 text-charcoal-900"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Yes, Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

