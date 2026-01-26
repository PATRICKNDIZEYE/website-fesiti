'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { subNavigationConfig } from './SubNavigation.config'

interface SubNavigationProps {
  orgId: string
}

export function SubNavigation({ orgId }: SubNavigationProps) {
  const pathname = usePathname()

  const currentSubNav = useMemo(() => {
    // Extract the section from pathname (e.g., /org/123/projects -> projects)
    const pathParts = pathname.split('/')
    const orgIndex = pathParts.indexOf('org')
    
    if (orgIndex === -1 || orgIndex + 2 >= pathParts.length) {
      return null
    }

    const section = pathParts[orgIndex + 2] // Get section after /org/[orgId]/
    
    // Handle nested routes (e.g., projects/[id] -> projects)
    let sectionKey = section
    if (section === 'projects' && pathParts.length > orgIndex + 3) {
      sectionKey = 'projects' // Keep projects nav even in project detail pages
    }
    if (section === 'visualization' && pathParts.length > orgIndex + 3) {
      sectionKey = 'visualization' // Keep visualization nav in project visualization pages
    }
    if (section === 'data-import' && pathParts.length > orgIndex + 3) {
      sectionKey = 'data-import' // Keep data-import nav in dataset pages
    }
    if (section === 'statistics' || section === 'notifications') {
      sectionKey = 'dashboard' // Statistics and notifications are part of dashboard
    }

    const config = subNavigationConfig[sectionKey]
    if (!config) return null

    // Check if we should show this subnav on current path
    if (config.showIn) {
      const shouldShow = config.showIn.some((path) => {
        if (path.includes('[') && path.includes(']')) {
          // Handle dynamic routes like 'projects/[id]'
          const pathPattern = path.replace(/\[.*?\]/g, '.*')
          const regex = new RegExp(`^${pathPattern.replace(/\//g, '\\/')}$`)
          return regex.test(section)
        }
        // Check if current path matches or contains the showIn path
        const currentPathAfterOrg = pathname.split('/').slice(orgIndex + 2).join('/')
        return currentPathAfterOrg === path || currentPathAfterOrg.startsWith(path + '/')
      })
      if (!shouldShow) return null
    }

    return config
  }, [pathname])

  if (!currentSubNav) {
    // Return empty sidebar to maintain layout consistency
    return (
      <aside className="fixed left-0 top-16 bottom-0 z-40 w-16 border-r border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80" />
    )
  }

  const getHref = (path: string) => {
    // Handle query params in path
    if (path.includes('?')) {
      const [basePath, query] = path.split('?')
      return `/org/${orgId}/${basePath}?${query}`
    }
    return `/org/${orgId}/${path}`
  }

  const isActive = (itemPath: string) => {
    const basePath = itemPath.split('?')[0]
    const currentPath = pathname.split('?')[0]
    
    // Exact match for base paths
    if (currentPath === `/org/${orgId}/${basePath}`) {
      return true
    }
    
    // For query-based paths, check if the base matches and params are present
    if (itemPath.includes('?')) {
      const urlParams = new URLSearchParams(itemPath.split('?')[1])
      const currentParams = new URLSearchParams(pathname.split('?')[1] || '')
      
      // Check if we're on the base path
      if (currentPath.includes(`/${basePath}`)) {
        // Check if query params match
        let matches = true
        urlParams.forEach((value, key) => {
          if (currentParams.get(key) !== value) {
            matches = false
          }
        })
        if (matches) return true
      }
    }
    
    // For nested routes like projects/[id], highlight the parent nav item
    if (basePath === 'projects') {
      if (itemPath === 'projects' && pathname.includes('/projects/') && !pathname.includes('/projects/new')) {
        return true // Highlight "All Programs" when viewing a project detail
      }
      if (itemPath === 'projects/new' && pathname.includes('/projects/new')) {
        return true
      }
    }
    
    // For visualization project pages, keep overview active
    if (basePath === 'visualization' && pathname.includes('/visualization/')) {
      return itemPath === 'visualization'
    }
    
    return false
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="fixed left-0 top-16 bottom-0 z-40 w-16 border-r border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className="p-2">
          <nav className="flex flex-col gap-1">
            {currentSubNav.items.map((item) => {
              const Icon = item.icon
              const href = getHref(item.path)
              const active = isActive(item.path)
              
              return (
                <Tooltip key={item.path} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center justify-center rounded-lg p-2.5 transition-colors relative group',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r" />
                      )}
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 rounded-full bg-primary px-1 py-0.5 text-[9px] font-semibold text-primary-foreground min-w-[16px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="z-[60]">
                    <p className="font-medium">{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </nav>
        </div>
      </aside>
    </TooltipProvider>
  )
}
