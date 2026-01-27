'use client'
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { TeamChat } from '@/components/TeamChat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Plus, X, Loader2, ChevronRight, ChevronLeft, Check, Save, Search, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { orgApi } from '@/lib/api-helpers'
import api from '@/lib/api'
import { User } from '@/lib/types'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import Link from 'next/link'


const STEPS = [
  { id: 1, title: 'Project Info', description: 'Basic project information' },
  { id: 2, title: 'Team', description: 'Manager and team members' },
  { id: 3, title: 'Review', description: 'Review and create' },
]

const DRAFT_KEY = 'project_creation_draft'

export default function NewProjectPage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [teamSearchQuery, setTeamSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    managerId: '',
    teamMemberIds: [] as string[],
  })


  useEffect(() => {
    if (!orgId) {
      console.error('Organization ID not found in route')
      return
    }
    fetchUsers()
    loadDraft()
  }, [orgId])

  useEffect(() => {
    // Auto-save draft when form data changes
    const timer = setTimeout(() => {
      saveDraft()
    }, 1000) // Debounce: save 1 second after last change

    return () => clearTimeout(timer)
  }, [formData, currentStep])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      
      // First, get current user from localStorage
      const currentUserStr = localStorage.getItem('user')
      let currentUser: any = null
      if (currentUserStr) {
        try {
          currentUser = JSON.parse(currentUserStr)
        } catch (e) {
          console.error('Failed to parse current user:', e)
        }
      }
      
      // Try to fetch users from the org-scoped endpoint
      let fetchedUsers: User[] = []
      try {
        const response = await orgApi.get(orgId, 'users')
        fetchedUsers = response.data || []
      } catch (error: any) {
        // If org-scoped endpoint fails, try direct /users endpoint with orgId query
        if (error.response?.status === 404 || error.response?.status === 403) {
          try {
            const response = await api.get(`/users?orgId=${orgId}`)
            fetchedUsers = response.data || []
          } catch (fallbackError) {
            console.warn('Failed to fetch users. Will use current user only:', fallbackError)
            fetchedUsers = []
          }
        } else {
          console.warn('Failed to fetch users:', error)
          fetchedUsers = []
        }
      }
      
      // Always ensure current user is in the list
      if (currentUser?.id) {
        const userExists = fetchedUsers.some(u => u.id === currentUser.id)
        if (!userExists) {
          fetchedUsers = [{
            id: currentUser.id,
            email: currentUser.email || '',
            firstName: currentUser.firstName || 'You',
            lastName: currentUser.lastName || '',
            role: currentUser.role || 'manager',
            isActive: true,
            createdAt: new Date().toISOString(),
          }, ...fetchedUsers]
        }
        // Auto-select current user as manager if not already set
        if (!formData.managerId) {
          setFormData(prev => ({ ...prev, managerId: currentUser.id }))
        }
      }
      
      setUsers(fetchedUsers)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      // Fallback: use current user only
      const currentUserStr = localStorage.getItem('user')
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr)
          if (currentUser.id) {
            setUsers([{
              id: currentUser.id,
              email: currentUser.email || '',
              firstName: currentUser.firstName || 'You',
              lastName: currentUser.lastName || '',
              role: currentUser.role || 'manager',
              isActive: true,
              createdAt: new Date().toISOString(),
            }])
            setFormData(prev => ({ ...prev, managerId: currentUser.id }))
          }
        } catch (parseError) {
          console.error('Failed to parse current user as fallback:', parseError)
        }
      }
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        setFormData(parsed.formData || formData)
        setCurrentStep(parsed.currentStep || 1)
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
  }

  const saveDraft = () => {
    try {
      setSaving(true)
      const draft = {
        formData,
        currentStep,
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      setSuccess('Draft saved automatically')
      setTimeout(() => setSuccess(''), 2000)
    } catch (error) {
      console.error('Failed to save draft:', error)
    } finally {
      setSaving(false)
    }
  }

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      managerId: '',
      teamMemberIds: [],
    })
    setCurrentStep(1)
    setSuccess('Draft cleared')
    setTimeout(() => setSuccess(''), 2000)
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    setError('')
    setLoading(true)
    setShowConfirmDialog(false)

    try {
      // Final validation
      if (!validateStep(1) || !validateStep(2)) {
        setCurrentStep(1)
        return
      }

      // First, get or create a default program for this organization
      let programId: string
      try {
        // Try to fetch existing programs
        const programsResponse = await api.get(`/programs?orgId=${orgId}`)
        const programs = programsResponse.data || []
        
        if (programs.length > 0) {
          // Use the first program (or could let user select)
          programId = programs[0].id
        } else {
          // Create a default program
          const programResponse = await api.post('/programs', {
            orgId,
            name: `${formData.name} Program`, // Use project name as program name
          })
          programId = programResponse.data.id
        }
      } catch (programError: any) {
        // If fetching programs fails, try creating one directly
        try {
          const programResponse = await api.post('/programs', {
            orgId,
            name: `${formData.name} Program`,
          })
          programId = programResponse.data.id
        } catch (createError: any) {
          console.error('Failed to create program:', createError)
          const errorMessage = createError.response?.data?.message || 
                              createError.message || 
                              'Failed to create program. Please ensure you have the necessary permissions.'
          setError(errorMessage)
          setLoading(false)
          return
        }
      }

      // Create project with programId (backend endpoint is /projects, not /org/:orgId/projects)
      const projectResponse = await api.post('/projects', {
        programId,
        name: formData.name,
        description: formData.description || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        status: 'planning',
      })

      const projectId = projectResponse.data.id

      // Clear draft on success
      clearDraft()
      
      // Redirect to project detail page
      router.push(`/org/${orgId}/projects/${projectId}`)
    } catch (err: any) {
      console.error('Project creation error:', err)
      // Check if it's an auth error
      if (err.response?.status === 401 || err.response?.status === 403) {
        const errorMessage = err.response?.data?.message || 
                            'You do not have permission to create projects. Please contact your administrator.'
        setError(errorMessage)
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to create project')
      }
      setLoading(false)
    }
  }

  const progress = (currentStep / STEPS.length) * 100

  return (
    <div className="space-y-6">
      <Header title="Create New Program" subtitle="Define scope, outcomes, and delivery cadence." />

      <div className="max-w-4xl space-y-6">
            {/* Header with back button and save status */}
            <div className="flex items-center justify-between mb-6">
              <Link
                href={`/org/${orgId}/projects`}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Programs</span>
              </Link>
              <div className="flex items-center space-x-4">
                {success && (
                  <span className="text-sm text-primary flex items-center space-x-1">
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
                <Button
                  type="button"
                  onClick={clearDraft}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  Clear Draft
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
                          ? 'bg-primary border-primary text-primary-foreground'
                        : currentStep === step.id
                          ? 'bg-primary/10 border-primary text-primary'
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
                        currentStep > step.id ? 'bg-primary' : 'bg-border'
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
                    ) : users.length === 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          No users found. You will be set as the manager by default.
                        </p>
                        <select
                          value={formData.managerId}
                          onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                          required
                          className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="">Select a manager</option>
                          {(() => {
                            const currentUserStr = localStorage.getItem('user')
                            if (currentUserStr) {
                              try {
                                const currentUser = JSON.parse(currentUserStr)
                                if (currentUser.id) {
                                  return (
                                    <option value={currentUser.id}>
                                      {currentUser.firstName || currentUser.name?.split(' ')[0] || 'You'} {currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || ''} ({currentUser.email || 'Current User'})
                                    </option>
                                  )
                                }
                              } catch (e) {
                                console.error('Failed to parse current user:', e)
                              }
                            }
                            return null
                          })()}
                        </select>
                      </div>
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
                              className="flex items-center space-x-1 px-2 py-1 bg-primary/10 border border-primary/20 rounded text-sm"
                            >
                              <span className="text-foreground">
                                {user.firstName} {user.lastName}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleTeamMember(userId)}
                                className="text-primary hover:text-primary/80"
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

              {/* Step 3: Review */}
              {currentStep === 3 && (
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
                            {(() => {
                              const manager = users.find(u => u.id === formData.managerId)
                              if (manager) {
                                return `${manager.firstName} ${manager.lastName} (${manager.email})`
                              }
                              // Fallback: try to get from localStorage
                              if (formData.managerId) {
                                try {
                                  const currentUserStr = localStorage.getItem('user')
                                  if (currentUserStr) {
                                    const currentUser = JSON.parse(currentUserStr)
                                    if (currentUser.id === formData.managerId) {
                                      return `${currentUser.firstName || 'You'} ${currentUser.lastName || ''} (${currentUser.email || 'Current User'})`
                                    }
                                  }
                                } catch (e) {
                                  console.error('Failed to parse current user:', e)
                                }
                              }
                              return formData.managerId ? 'Unknown user' : 'Not selected'
                            })()}
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
                      <h4 className="font-semibold text-foreground mb-3">Next Steps</h4>
                      <p className="text-sm text-muted-foreground">
                        After creating the project, you can add indicators, set up reporting periods, and configure schedules from the project detail page.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={currentStep === 1 ? () => router.push(`/org/${orgId}/projects`) : prevStep}
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
                    type="button"
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                )}
              </div>
            </div>
      </div>

      <TeamChat orgId={orgId} />

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <span>Confirm Project Creation</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to create this project? Please review all details before confirming.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium text-foreground mb-1">Project: {formData.name}</p>
              {formData.managerId && (
                <p className="text-xs text-muted-foreground">
                  Manager: {(() => {
                  const manager = users.find(u => u.id === formData.managerId)
                  if (manager) {
                    return `${manager.firstName} ${manager.lastName}`
                  }
                  // Fallback: try to get from localStorage
                  if (formData.managerId) {
                    try {
                      const currentUserStr = localStorage.getItem('user')
                      if (currentUserStr) {
                        const currentUser = JSON.parse(currentUserStr)
                        if (currentUser.id === formData.managerId) {
                          return `${currentUser.firstName || 'You'} ${currentUser.lastName || ''}`
                        }
                      }
                    } catch (e) {
                      // Ignore parse errors
                    }
                  }
                  return 'Not selected'
                })()}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.teamMemberIds.length} team member(s)
              </p>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This action will create the project. You can add indicators, schedules, and reporting periods from the project detail page.
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
              onClick={() => handleSubmit()}
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
                  Yes, Create Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
