'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Check, ChevronDown, Building2, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { authService, UserOrganization } from '@/lib/auth'

interface OrgSwitcherProps {
  currentOrgId: string
  className?: string
  variant?: 'default' | 'compact'
}

export function OrgSwitcher({ currentOrgId, className, variant = 'default' }: OrgSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [organizations, setOrganizations] = useState<UserOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentOrg = organizations.find((org) => org.id === currentOrgId)

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Try cache first for instant display
      const cached = authService.getCachedOrganizations()
      if (cached && cached.length > 0) {
        setOrganizations(cached)
        setLoading(false)
      }

      // Fetch fresh data
      const orgs = await authService.getOrganizations()
      setOrganizations(orgs)
      authService.saveUserOrganizations(orgs)
    } catch (err) {
      console.error('Failed to fetch organizations:', err)
      setError('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === currentOrgId || switching) return

    try {
      setSwitching(true)
      setError(null)

      const result = await authService.switchOrganization(orgId, false)

      // Save new auth data
      authService.saveAuthData(result.access_token, result.user)

      // Close popover
      setOpen(false)

      // Navigate to the new org's dashboard
      const newPath = pathname.replace(`/org/${currentOrgId}`, `/org/${orgId}`)
      router.push(newPath.includes('/org/') ? newPath : `/org/${orgId}/dashboard`)

      // Refresh the page to reload all data with new org context
      router.refresh()
    } catch (err) {
      console.error('Failed to switch organization:', err)
      setError('Failed to switch organization')
    } finally {
      setSwitching(false)
    }
  }

  const getOrgInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      case 'admin':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  if (loading && organizations.length === 0) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }

  // Don't show switcher if user only has one org
  if (organizations.length <= 1 && variant === 'compact') {
    return null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          aria-label="Select organization"
          className={cn(
            'justify-between gap-2 font-medium hover:bg-muted',
            variant === 'compact' ? 'h-9 px-2' : 'h-10 px-3',
            className
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn(
              'flex items-center justify-center rounded-md bg-primary/10 text-primary font-semibold flex-shrink-0',
              variant === 'compact' ? 'h-6 w-6 text-xs' : 'h-7 w-7 text-sm'
            )}>
              {currentOrg ? getOrgInitials(currentOrg.name) : <Building2 className="h-4 w-4" />}
            </div>
            {variant !== 'compact' && (
              <span className="truncate max-w-[150px]">
                {currentOrg?.name || 'Select Organization'}
              </span>
            )}
          </div>
          <ChevronDown className={cn(
            'flex-shrink-0 text-muted-foreground transition-transform',
            variant === 'compact' ? 'h-3 w-3' : 'h-4 w-4',
            open && 'rotate-180'
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="border-b border-border px-3 py-2">
          <p className="text-sm font-medium text-foreground">Switch Organization</p>
          <p className="text-xs text-muted-foreground">
            Select an organization to work with
          </p>
        </div>

        {error && (
          <div className="px-3 py-2 text-sm text-destructive bg-destructive/10">
            {error}
          </div>
        )}

        <div className="max-h-64 overflow-y-auto p-1">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSwitchOrg(org.id)}
              disabled={switching}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                org.id === currentOrgId
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-foreground',
                switching && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-sm font-semibold flex-shrink-0">
                {getOrgInitials(org.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{org.name}</span>
                  {org.isDefault && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {org.code && (
                    <span className="text-xs text-muted-foreground">{org.code}</span>
                  )}
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded capitalize',
                    getRoleBadgeColor(org.role)
                  )}>
                    {org.role}
                  </span>
                </div>
              </div>
              {org.id === currentOrgId && (
                <Check className="h-4 w-4 flex-shrink-0 text-primary" />
              )}
              {switching && org.id !== currentOrgId && (
                <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
              )}
            </button>
          ))}
        </div>

        {organizations.length > 1 && (
          <div className="border-t border-border p-2">
            <p className="text-xs text-muted-foreground text-center">
              {organizations.length} organization{organizations.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
