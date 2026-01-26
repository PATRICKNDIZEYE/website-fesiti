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
        "bg-card rounded-xl border-2 p-4 sm:p-6 hover:shadow-lg transition-all cursor-pointer w-full overflow-hidden",
        highlighted ? "border-primary border-dashed" : "border-border"
      )}
      onClick={onClick}
    >
      {/* Landscape Layout: Content side by side - responsive */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Left Section: Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3 gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 truncate">{project.name}</h3>
              <Badge variant="outline" className={cn(getStatusColor(project.status), "text-xs")}>
                {project.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground line-clamp-2 break-words">
              {project.description || 'No description available'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Progress</span>
              <span className="text-sm font-bold text-foreground whitespace-nowrap">{Math.round(project.progress)}%</span>
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
        <div className="flex flex-row md:flex-col justify-between md:justify-between border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 gap-4 md:gap-0 flex-shrink-0">
          {/* Team Members */}
          <div className="md:mb-4">
            <div className="flex items-center -space-x-2 mb-2">
              {project.teamMembers?.slice(0, 5).map((member) => (
                <Avatar key={member.id} className="border-2 border-border w-7 h-7 md:w-8 md:h-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                    {member.firstName[0]}{member.lastName[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
              <button className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 border-2 border-border flex items-center justify-center text-primary hover:bg-primary/20 transition-colors flex-shrink-0">
                <UserPlus className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground hidden md:block">Team Members</p>
          </div>

          {/* Footer Stats */}
          <div className="space-y-2 flex-shrink-0">
            {daysLeft !== null && (
              <div className="flex items-center space-x-1.5 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">{daysLeft > 0 ? `${daysLeft} Days Left` : 'Overdue'}</span>
              </div>
            )}
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="flex items-center space-x-1.5 text-sm text-muted-foreground">
                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                <span>{project.reports?.length || 0}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-sm text-muted-foreground">
                <Folder className="w-4 h-4 flex-shrink-0" />
                <span>{project.indicators?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
