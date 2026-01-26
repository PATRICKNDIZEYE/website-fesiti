'use client'

import { Project } from '@/lib/types'
import { UserPlus, Clock, MessageCircle, Folder } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface TeamCardProps {
  project: Project
  onClick?: () => void
  highlighted?: boolean
}

export function TeamCard({ project, onClick, highlighted = false }: TeamCardProps) {
  const daysLeft = project.endDate
    ? Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'completed':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'on_hold':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      default:
        return 'bg-slate-400/20 text-gray-300 border-slate-400'
    }
  }

  return (
    <div
      className={cn(
        "bg-card rounded-xl border-2 p-6 hover:shadow-lg transition-all cursor-pointer",
        highlighted ? "border-primary border-dashed" : "border-border"
      )}
      onClick={onClick}
    >
      {/* Landscape Layout: Content side by side */}
      <div className="flex gap-6">
        {/* Left Section: Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground mb-2 truncate">{project.name}</h3>
              <Badge variant="outline" className={getStatusColor(project.status)}>
                {project.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description || 'No description available'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Progress</span>
              <span className="text-sm font-bold text-foreground">{Math.round(project.progress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(project.progress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Section: Team & Stats */}
        <div className="flex flex-col justify-between border-l border-border pl-6">
          {/* Team Members */}
          <div className="mb-4">
            <div className="flex items-center -space-x-2 mb-2">
              {project.teamMembers?.slice(0, 5).map((member) => (
                <Avatar key={member.id} className="border-2 border-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                    {member.firstName[0]}{member.lastName[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
              <button className="w-8 h-8 rounded-full bg-primary/10 border-2 border-border flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Team Members</p>
          </div>

          {/* Footer Stats */}
          <div className="space-y-2">
            {daysLeft !== null && (
              <div className="flex items-center space-x-1.5 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{daysLeft > 0 ? `${daysLeft} Days Left` : 'Overdue'}</span>
              </div>
            )}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 text-sm text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                <span>{project.reports?.length || 0}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-sm text-muted-foreground">
                <Folder className="w-4 h-4" />
                <span>{project.indicators?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
