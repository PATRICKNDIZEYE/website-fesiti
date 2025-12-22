'use client'

import { Search, Sun, Moon, Plus, FileText, FolderKanban, Users, Calendar, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getTheme, setTheme, initTheme } from '@/lib/theme'
import { orgApi } from '@/lib/api-helpers'
import Link from 'next/link'

interface HeaderProps {
  title: string
  orgId?: string
}

export function Header({ title, orgId }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')
  const [activeProjects, setActiveProjects] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Extract orgId from pathname if not provided
  const currentOrgId = orgId || (pathname.match(/^\/org\/([^/]+)/)?.[1] ?? null)

  useEffect(() => {
    initTheme()
    setThemeState(getTheme())
  }, [])

  useEffect(() => {
    if (currentOrgId) {
      fetchActiveProjects()
    }
  }, [currentOrgId])

  // Only show quick links if we have an orgId
  const showQuickLinks = !!currentOrgId

  const fetchActiveProjects = async () => {
    if (!currentOrgId) return
    try {
      const response = await orgApi.get(currentOrgId, 'dashboard')
      setActiveProjects(response.data.stats?.activeProjects || 0)
    } catch (error) {
      console.error('Failed to fetch active projects:', error)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    setThemeState(newTheme)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim() || !currentOrgId) return
    
    // Navigate to projects page with search query
    router.push(`/org/${currentOrgId}/projects?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  const getQuickLink = (path: string): string => {
    if (currentOrgId) {
      return `/org/${currentOrgId}/${path}`
    }
    return `/${path}`
  }

  return (
    <div className="bg-background border-b border-border px-6 py-4 sticky top-0 z-30" data-tour="header">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        
        <div className="flex items-center space-x-4">
          {/* Quick Action Links */}
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-gold-500/20 dark:bg-gold-500/20 text-gold-600 dark:text-gold-500 border-gold-500/30 px-3 py-1.5">
              <FileText className="w-4 h-4 mr-1.5" />
              On Going {activeProjects}
            </Badge>
            
            {showQuickLinks && currentOrgId && (
              <>
                <Link href={getQuickLink('projects/new')}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-accent text-muted-foreground" 
                    title="Create New Project"
                    data-tour="create-project"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href={getQuickLink('projects')}>
                  <Button variant="ghost" size="icon" className="hover:bg-accent text-muted-foreground" title="Projects">
                    <FolderKanban className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href={getQuickLink('visualization')}>
                  <Button variant="ghost" size="icon" className="hover:bg-accent text-muted-foreground" title="Visualization">
                    <TrendingUp className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href={getQuickLink('users')}>
                  <Button variant="ghost" size="icon" className="hover:bg-accent text-muted-foreground" title="Users">
                    <Users className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href={getQuickLink('calendar')}>
                  <Button variant="ghost" size="icon" className="hover:bg-accent text-muted-foreground" title="Calendar">
                    <Calendar className="w-5 h-5" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </form>

          {/* Theme Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-accent text-muted-foreground"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
