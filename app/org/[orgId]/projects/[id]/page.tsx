'use client'
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { TeamChat } from '@/components/TeamChat'
import { IndicatorManager } from '@/components/IndicatorManager'
import { ReportSubmissionForm } from '@/components/ReportSubmissionForm'
import { ResultsNodesManager } from '@/components/ResultsNodesManager'
import { ArrowLeft, Plus, BarChart3, ClipboardList, FileSpreadsheet } from 'lucide-react'
import { orgApi } from '@/lib/api-helpers'
import { Project } from '@/lib/types'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const orgId = params.orgId as string
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [showIndicatorForm, setShowIndicatorForm] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (!orgId) {
      console.error('Organization ID not found in route')
      return
    }

    if (projectId) {
      fetchProject(projectId)
    }

    // Check if we should show the indicator form
    const action = searchParams.get('action')
    if (action === 'new-indicator') {
      setShowIndicatorForm(true)
      // Remove query param from URL
      router.replace(`/org/${orgId}/projects/${projectId}`, { scroll: false })
    }
  }, [projectId, orgId, router, searchParams])

  const fetchProject = async (id: string) => {
    try {
      const response = await orgApi.get(orgId, `projects/${id}`)
      setProject(response.data)
    } catch (error) {
      console.error('Failed to fetch project:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground">Project not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header title={project.name} subtitle="Program profile and implementation status." />

      <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={`/org/${orgId}/projects`}
                className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Programs</span>
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/org/${orgId}/projects/${project.id}/data-collection`}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors text-sm font-medium flex items-center space-x-2"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Collect Data</span>
                </Link>
                <Link
                  href={`/org/${orgId}/projects/${project.id}/submissions`}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-full transition-colors text-sm font-medium"
                >
                  View Submissions
                </Link>
                <Link
                  href={`/org/${orgId}/visualization/${project.id}`}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-full transition-colors text-sm font-medium flex items-center space-x-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Create Charts</span>
                </Link>
                <Link
                  href={`/org/${orgId}/projects/${project.id}/reports/pitt`}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-full transition-colors text-sm font-medium flex items-center space-x-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>PITT</span>
                </Link>
                <Link
                  href={`/org/${orgId}/projects/${project.id}/edit`}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-full transition-colors text-sm font-medium"
                >
                  Edit Program
                </Link>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    project.status === 'active'
                      ? 'bg-primary/10 text-primary border border-primary/20'
                    : project.status === 'completed'
                      ? 'bg-primary/10 text-primary border border-primary/20'
                    : project.status === 'on_hold'
                      ? 'bg-destructive/10 text-destructive border border-destructive/20'
                    : 'bg-muted text-muted-foreground border border-border'
                  }`}
                >
                  {project.status}
                </span>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border/70 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Program Summary</p>
                  <h2 className="text-2xl font-semibold text-foreground mt-2">{project.name}</h2>
                  <p className="text-muted-foreground">{project.description || 'No description'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Progress</p>
                  <p className="text-2xl font-semibold text-foreground mt-2">
                    {Math.round(project.progress)}%
                  </p>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Team Members</p>
                  <p className="text-2xl font-semibold text-foreground mt-2">
                    {project.teamMembers?.length || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Indicators</p>
                  <p className="text-2xl font-semibold text-foreground mt-2">
                    {project.indicators?.length || 0}
                  </p>
                </div>
              </div>

              {project.startDate && project.endDate && (
                <div className="text-sm text-muted-foreground">
                  <span>
                    {new Date(project.startDate).toLocaleDateString()} -{' '}
                    {new Date(project.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <Tabs defaultValue="indicators" className="space-y-4">
              <TabsList className="bg-muted/30">
                <TabsTrigger value="objectives">Objectives</TabsTrigger>
                <TabsTrigger value="indicators">Indicators & Targets</TabsTrigger>
                <TabsTrigger value="reports">Submit Report</TabsTrigger>
                <TabsTrigger value="team">Team Members</TabsTrigger>
              </TabsList>

              <TabsContent value="objectives" className="space-y-4">
                <div className="bg-card rounded-2xl border border-border/70 p-6">
                  <ResultsNodesManager projectId={project.id} orgId={orgId} />
                </div>
              </TabsContent>

              <TabsContent value="indicators" className="space-y-4">
                <div className="bg-card rounded-2xl border border-border/70 p-6">
                  <IndicatorManager 
                    projectId={project.id} 
                    onUpdate={() => fetchProject(project.id)} 
                    orgId={orgId}
                    initialShowForm={showIndicatorForm}
                    onFormToggle={(show) => setShowIndicatorForm(show)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <ReportSubmissionForm 
                  projectId={project.id} 
                  onSuccess={() => fetchProject(project.id)} 
                  orgId={orgId} 
                />
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                <div className="bg-card rounded-2xl border border-border/70 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Team Members</h3>
                    <button className="flex items-center space-x-1 text-primary hover:text-primary/80">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Add</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {project.teamMembers && project.teamMembers.length > 0 ? (
                      project.teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center space-x-3 p-3 border border-border/70 rounded-xl"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium border border-primary/20">
                            {member.firstName[0]}{member.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No team members yet</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
      </div>

      <TeamChat orgId={orgId} />
    </div>
  )
}
