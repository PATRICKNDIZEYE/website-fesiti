'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Menu,
  Search,
  Plus,
  LayoutDashboard,
  FolderKanban,
  TrendingUp,
  FileSpreadsheet,
  Calendar,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { authService } from '@/lib/auth'
import { orgApi } from '@/lib/api-helpers'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { getTheme, setTheme, initTheme } from '@/lib/theme'

const navItems = [
  { label: 'Overview', path: 'dashboard', icon: LayoutDashboard },
  { label: 'Programs', path: 'projects', icon: FolderKanban },
  { label: 'Analysis', path: 'visualization', icon: TrendingUp },
  { label: 'AI Insights', path: 'ai-insights', icon: Sparkles },
  { label: 'Data Hub', path: 'data-import', icon: FileSpreadsheet },
  { label: 'Calendar', path: 'calendar', icon: Calendar },
  { label: 'Users', path: 'users', icon: Users },
  { label: 'Messages', path: 'messages', icon: MessageSquare },
]

interface AppTopNavProps {
  orgId: string
}

export function AppTopNav({ orgId }: AppTopNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [activeProjects, setActiveProjects] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [userInitials, setUserInitials] = useState<string>('U')
  const [imageError, setImageError] = useState(false)
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const fetchActiveProjects = async () => {
      try {
        const response = await orgApi.get(orgId, 'dashboard')
        setActiveProjects(response.data.stats?.activeProjects || 0)
      } catch (error) {
        console.error('Failed to fetch active projects:', error)
      }
    }

    fetchActiveProjects()
  }, [orgId])

  useEffect(() => {
    initTheme()
    setThemeState(getTheme())

    // Listen for theme changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = getTheme()
        setThemeState(newTheme)
      }
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      const currentTheme = getTheme()
      // Only update if no manual theme is set
      if (!localStorage.getItem('theme')) {
        setThemeState(currentTheme)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    mediaQuery.addEventListener('change', handleSystemThemeChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [])

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) return

    try {
      const user = JSON.parse(userStr)
      const firstName = user.firstName || ''
      const lastName = user.lastName || ''
      if (firstName || lastName) {
        setUserInitials(`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase())
      } else if (user.email) {
        setUserInitials(user.email.charAt(0).toUpperCase())
      }

      if (user.avatar) {
        let avatarUrl = user.avatar
        if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:')) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
          avatarUrl = `${apiUrl}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`
        }
        setUserAvatar(avatarUrl)
        setImageError(false)
      }
    } catch (error) {
      console.error('Failed to parse user data:', error)
    }
  }, [])

  const getHref = useCallback((path: string) => `/org/${orgId}/${path}`, [orgId])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/org/${orgId}/projects?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  const handleLogout = () => {
    authService.logout()
    router.push('/login')
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    setThemeState(newTheme)
  }

  const activeLabel = useMemo(() => {
    const match = navItems.find((item) => pathname.startsWith(getHref(item.path)))
    return match?.label ?? 'Overview'
  }, [pathname, getHref])

  return (
    <>
      <ConfirmationModal
        open={showLogoutModal}
        onOpenChange={setShowLogoutModal}
        onConfirm={handleLogout}
        title="Log Out"
        description="Are you sure you want to log out? You'll need to sign in again to access your account."
        type="logout"
        confirmText="Log Out"
        cancelText="Cancel"
      />

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 w-full overflow-x-hidden" data-tour="top-nav">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 overflow-x-hidden">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
            <Link href={getHref('dashboard')} className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
                <Image src="/images/logo-s.png" alt="Logo" width={24} height={24} className="h-6 w-6" />
              </div>
              <div className="hidden sm:block min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">FESITI M&E Suite</div>
                <div className="text-xs text-muted-foreground truncate">Enterprise monitoring workspace</div>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-1 xl:flex flex-shrink-0">
            {navItems.map((item) => {
              const href = getHref(item.path)
              const isActive = pathname === href || pathname.startsWith(`${href}/`)
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-3 xl:px-4 py-2 text-sm font-medium transition whitespace-nowrap',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden 2xl:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0">
            <Badge className="hidden items-center gap-1.5 border border-primary/20 bg-primary/10 px-2 xl:px-3 py-1 text-xs font-semibold text-primary xl:flex whitespace-nowrap">
              <span className="hidden 2xl:inline">Active programs</span>
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] text-white">
                {activeProjects}
              </span>
            </Badge>

            <form onSubmit={handleSearch} className="relative hidden w-48 xl:w-64 2xl:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-9 rounded-full border-border bg-card pl-9 text-sm w-full"
              />
            </form>

            <Link href={getHref('projects/new')} className="hidden xl:block" data-tour="create-project">
              <Button className="rounded-full bg-primary px-3 xl:px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 whitespace-nowrap">
                <Plus className="mr-1.5 xl:mr-2 h-4 w-4" />
                <span className="hidden 2xl:inline">New Program</span>
                <span className="2xl:hidden">New</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hidden lg:flex h-9 w-9 rounded-full hover:bg-muted"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-foreground" />
              ) : (
                <Moon className="h-4 w-4 text-foreground" />
              )}
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <button className="hidden items-center gap-1.5 sm:gap-2 rounded-full border border-border bg-card px-2 py-1.5 text-left shadow-sm lg:flex min-w-0">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage
                      src={userAvatar ?? undefined}
                      onError={() => setImageError(true)}
                      className={cn(imageError && 'hidden')}
                    />
                    <AvatarFallback className="text-xs font-semibold text-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="pr-2 min-w-0 hidden xl:block">
                    <div className="text-xs font-semibold text-foreground truncate">{activeLabel}</div>
                    <div className="text-[11px] text-muted-foreground truncate">Workspace actions</div>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-0">
                <div className="border-b border-border px-4 py-3">
                  <div className="text-sm font-semibold text-foreground">Account</div>
                  <div className="text-xs text-muted-foreground">Manage your workspace</div>
                </div>
                <div className="p-2">
                  <Link
                    href={getHref('profile')}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Users className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href={getHref('settings')}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={toggleTheme}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="h-4 w-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        Dark Mode
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-full flex-col gap-6 sm:max-w-sm">
                <div>
                  <div className="text-lg font-semibold text-foreground">Navigation</div>
                  <div className="text-sm text-muted-foreground">Active workspace</div>
                </div>
                <form onSubmit={handleSearch} className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search programs, datasets..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-10 rounded-full border-border bg-card pl-9 text-sm"
                  />
                </form>
                <div className="flex flex-col gap-2">
                  {navItems.map((item) => {
                    const href = getHref(item.path)
                    const isActive = pathname === href || pathname.startsWith(`${href}/`)
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.path}
                        href={href}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
                <div className="mt-auto">
                  <Link href={getHref('projects/new')}>
                    <Button className="w-full rounded-full bg-primary text-primary-foreground">
                      <Plus className="mr-2 h-4 w-4" />
                      New Program
                    </Button>
                  </Link>
                  <button
                    onClick={toggleTheme}
                    className="mt-3 w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="h-4 w-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        Dark Mode
                      </>
                    )}
                  </button>
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={userAvatar ?? undefined}
                        onError={() => setImageError(true)}
                        className={cn(imageError && 'hidden')}
                      />
                      <AvatarFallback className="text-sm font-semibold text-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-semibold text-foreground">Account</div>
                      <div className="text-xs text-muted-foreground">Signed in</div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  )
}
