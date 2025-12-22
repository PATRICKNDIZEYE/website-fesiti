'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { TeamChat } from '@/components/TeamChat'
import { IndicatorManager } from '@/components/IndicatorManager'
import { ReportSubmissionForm } from '@/components/ReportSubmissionForm'
import { useLayout } from '@/contexts/LayoutContext'
import { ArrowLeft, Plus, BarChart3 } from 'lucide-react'
import { orgApi } from '@/lib/api-helpers'
import { Project } from '@/lib/types'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const { sidebarCollapsed, chatCollapsed } = useLayout()

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
  }, [projectId, orgId, router])

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
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar orgId={orgId} />
      
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        sidebarCollapsed ? "ml-20" : "ml-64",
        chatCollapsed ? "mr-12" : "mr-80"
      )}>
        <Header title={project.name} />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Link
              href={`/org/${orgId}/projects`}
              className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Projects</span>
            </Link>

            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground mb-2">{project.name}</h2>
                  <p className="text-muted-foreground">{project.description || 'No description'}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Link
                    href={`/org/${orgId}/visualization/${project.id}`}
                    className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-charcoal-900 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Create Charts</span>
                  </Link>
                  <Link
                    href={`/org/${orgId}/projects/${project.id}/edit`}
                    className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-charcoal-900 rounded-lg transition-colors text-sm font-medium"
                  >
                    Edit Project
                  </Link>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded ${
                      project.status === 'active'
                        ? 'bg-gold-500/20 text-gold-600 dark:text-gold-500 border border-gold-500/30'
                        : project.status === 'completed'
                        ? 'bg-gold-500/20 text-gold-600 dark:text-gold-500 border border-gold-500/30'
                        : project.status === 'on_hold'
                        ? 'bg-crimson-500/20 text-crimson-600 dark:text-crimson-500 border border-crimson-500/30'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {Math.round(project.progress)}%
                  </p>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className="bg-gold-500 h-2 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {project.teamMembers?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Indicators</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
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
              <TabsList className="bg-muted">
                <TabsTrigger value="indicators">Indicators & Targets</TabsTrigger>
                <TabsTrigger value="reports">Submit Report</TabsTrigger>
                <TabsTrigger value="team">Team Members</TabsTrigger>
              </TabsList>

              <TabsContent value="indicators" className="space-y-4">
                <div className="bg-card rounded-lg border border-border p-6">
                  <IndicatorManager 
                    projectId={project.id} 
                    onUpdate={() => fetchProject(project.id)} 
                    orgId={orgId} 
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
                <div className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Team Members</h3>
                    <button className="flex items-center space-x-1 text-gold-500 hover:text-gold-600">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Add</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {project.teamMembers && project.teamMembers.length > 0 ? (
                      project.teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center space-x-3 p-3 border border-border rounded-lg"
                        >
                          <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-500 font-medium border border-gold-500/30">
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
        </div>
      </div>

      <TeamChat orgId={orgId} />
    </div>
  )
}

