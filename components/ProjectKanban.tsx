'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Project } from '@/lib/types'
import { ProjectStatus } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import Link from 'next/link'

interface ProjectKanbanProps {
  projects: Project[]
  onUpdate: () => void
}

const statusColumns: { id: ProjectStatus; label: string; color: string }[] = [
  { id: 'planning', label: 'Planning', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
  { id: 'active', label: 'Active', color: 'bg-gold-500/20 text-gold-600 border-gold-500/30' },
  { id: 'on_hold', label: 'On Hold', color: 'bg-crimson-500/20 text-crimson-600 border-crimson-500/30' },
  { id: 'completed', label: 'Completed', color: 'bg-green-500/20 text-green-600 border-green-500/30' },
  { id: 'cancelled', label: 'Cancelled', color: 'bg-gray-500/20 text-gray-600 border-gray-500/30' },
]

function ProjectCard({ project, isDragging }: { project: Project; isDragging?: boolean }) {
  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation if we're dragging
    if (isDragging) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <Card
      className={cn(
        "p-4 mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-border",
        isDragging && "opacity-50"
      )}
    >
      <div onClick={handleClick}>
        <Link 
          href={`/projects/${project.id}`}
          className="block"
          onClick={(e) => {
            // Only allow navigation on click, not during drag
            if (isDragging) {
              e.preventDefault()
              e.stopPropagation()
            }
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-foreground text-sm line-clamp-2 flex-1">
              {project.name}
            </h4>
          </div>
          
          {project.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {project.description}
            </p>
          )}

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-semibold text-foreground">
                {Math.round(project.progress)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-gold-500 h-1.5 rounded-full transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {project.manager && (
                <Avatar className="w-6 h-6 border border-border">
                  <AvatarFallback className="bg-gold-500/20 text-gold-500 text-xs border border-gold-500/30">
                    {project.manager.firstName[0]}{project.manager.lastName[0]}
                  </AvatarFallback>
                </Avatar>
              )}
              <span className="text-xs text-muted-foreground">
                {project.teamMembers?.length || 0} members
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {project.indicators?.length || 0} indicators
            </Badge>
          </div>
        </Link>
      </div>
    </Card>
  )
}

function SortableProjectCard({ project }: { project: Project }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="touch-none"
    >
      <ProjectCard project={project} isDragging={isDragging} />
    </div>
  )
}

function StatusColumn({
  status,
  projects,
  label,
  color,
}: {
  status: ProjectStatus
  projects: Project[]
  label: string
  color: string
}) {
  const items = projects.map((p) => p.id)
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-w-[280px] bg-muted/30 rounded-lg p-4 transition-colors",
        isOver && "bg-muted/50 ring-2 ring-gold-500"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Badge className={color}>{label}</Badge>
          <span className="text-sm text-muted-foreground">({projects.length})</span>
        </div>
      </div>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[200px]">
          {projects.map((project) => (
            <SortableProjectCard key={project.id} project={project} />
          ))}
          {projects.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
              Drop projects here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export function ProjectKanban({ projects, onUpdate }: ProjectKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const getProjectsByStatus = (status: ProjectStatus) => {
    return projects.filter((p) => p.status === status)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const projectId = active.id as string
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    // Determine the target status
    let newStatus: ProjectStatus | null = null
    
    // Check if dropped directly on a column (status)
    const validStatuses = statusColumns.map((col) => col.id)
    if (validStatuses.includes(over.id as ProjectStatus)) {
      newStatus = over.id as ProjectStatus
    } else {
      // If dropped on another project card, find which column that project is in
      const targetProject = projects.find((p) => p.id === over.id)
      if (targetProject) {
        newStatus = targetProject.status
      }
    }

    // If we couldn't determine a valid status, return
    if (!newStatus || !validStatuses.includes(newStatus)) {
      console.log('Invalid drop target:', over.id)
      return
    }

    // Don't update if status hasn't changed
    if (project.status === newStatus) {
      console.log('Status unchanged:', project.status)
      return
    }

    try {
      setUpdating(projectId)
      console.log('Updating project status:', projectId, 'from', project.status, 'to', newStatus)
      await api.patch(`/projects/${projectId}`, {
        status: newStatus,
      })
      await onUpdate()
    } catch (error: any) {
      console.error('Failed to update project status:', error)
      alert(error.response?.data?.message || 'Failed to update project status')
    } finally {
      setUpdating(null)
    }
  }

  const activeProject = activeId ? projects.find((p) => p.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusColumns.map((column) => {
          const columnProjects = getProjectsByStatus(column.id)
          return (
            <StatusColumn
              key={column.id}
              status={column.id}
              projects={columnProjects}
              label={column.label}
              color={column.color}
            />
          )
        })}
      </div>
      <DragOverlay>
        {activeProject ? (
          <div className="opacity-90">
            {updating === activeProject.id ? (
              <Card className="p-4 mb-3 border-border">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              </Card>
            ) : (
              <ProjectCard project={activeProject} />
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

