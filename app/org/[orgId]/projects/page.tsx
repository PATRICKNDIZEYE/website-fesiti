'use client'
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { TeamChat } from '@/components/TeamChat'
import { Plus, Search, FileText, X, LayoutGrid, Columns3 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ProjectKanban } from '@/components/ProjectKanban'
import { orgApi } from '@/lib/api-helpers'
import { Project } from '@/lib/types'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function ProjectsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const orgId = params.orgId as string
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [hasDraft, setHasDraft] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid')
  useEffect(() => {
    checkForDraft()
  }, [])

  useEffect(() => {
    // Update search query from URL params
    const urlSearch = searchParams.get('search')
    if (urlSearch) {
      setSearchQuery(urlSearch)
    }
  }, [searchParams])

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

    fetchProjects()
  }, [router, orgId])

  const checkForDraft = () => {
    try {
      const draft = localStorage.getItem('project_creation_draft')
      if (draft) {
        const parsed = JSON.parse(draft)
        if (parsed.formData && (parsed.formData.name || parsed.formData.managerId)) {
          setHasDraft(true)
        }
      }
    } catch (error) {
      console.error('Failed to check draft:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await orgApi.get(orgId, 'projects')
      setProjects(response.data)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header
        title="Programs"
        subtitle="Portfolio tracking, milestones, and delivery cadence."
        actions={
          <Link href={`/org/${orgId}/projects/new`}>
            <Button className="rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              New Program
            </Button>
          </Link>
        }
      />

      <div>
        {hasDraft && (
              <Alert className="mb-6 border-primary/20 bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-foreground">
                    You have a saved draft.{' '}
                    <Link href={`/org/${orgId}/projects/new`} className="text-primary underline font-medium">
                      Resume creating your program
                    </Link>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem('project_creation_draft')
                      setHasDraft(false)
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search programs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-card border border-border/70 rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "h-8 px-3",
                      viewMode === 'grid' && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <LayoutGrid className="w-4 h-4 mr-1" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('kanban')}
                    className={cn(
                      "h-8 px-3",
                      viewMode === 'kanban' && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <Columns3 className="w-4 h-4 mr-1" />
                    Kanban
                  </Button>
                </div>
              </div>
            </div>

            {viewMode === 'kanban' ? (
              <ProjectKanban projects={filteredProjects} onUpdate={fetchProjects} orgId={orgId} />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/org/${orgId}/projects/${project.id}`}
                      className="bg-card rounded-xl border border-border/70 p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {project.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {project.description || 'No description'}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
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

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Progress</span>
                          <span className="text-sm font-semibold text-foreground">
                            {Math.round(project.progress)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div>
                          {project.manager && (
                            <span>
                              Manager: {project.manager.firstName} {project.manager.lastName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>Team</span>
                          <span>{project.teamMembers?.length || 0}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {filteredProjects.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      {searchQuery ? 'No projects found matching your search.' : 'No projects yet.'}
                    </p>
                    <Link href={`/org/${orgId}/projects/new`}>
                      <Button className="rounded-full bg-primary text-primary-foreground">
                        Create Your First Program
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
      </div>

      <TeamChat orgId={orgId} />
    </div>
  )
}
