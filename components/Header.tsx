'use client'

import { ReactNode } from 'react'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  orgId?: string
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <div className="mb-6 sm:mb-8 flex flex-col gap-4 border-b border-border/60 pb-4 sm:pb-6 w-full overflow-x-hidden">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between w-full min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground truncate">
            Monitoring & Evaluation
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground truncate">{title}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground line-clamp-2 break-words">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0 min-w-0">{actions}</div> : null}
      </div>
    </div>
  )
}
