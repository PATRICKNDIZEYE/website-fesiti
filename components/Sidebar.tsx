'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Calendar, 
  FolderKanban, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Users
} from 'lucide-react'
import { authService } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLayout } from '@/contexts/LayoutContext'
import { orgApi } from '@/lib/api-helpers'
import { ConfirmationModal } from '@/components/ConfirmationModal'


const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: 'dashboard' },
  { icon: MessageSquare, label: 'Messages', path: 'messages', hasBadge: true },
  { icon: TrendingUp, label: 'Visualization', path: 'visualization' },
  { icon: FileSpreadsheet, label: 'Data Import', path: 'data-import' },
  { icon: Calendar, label: 'Calendar', path: 'calendar' },
  { icon: FolderKanban, label: 'Project', path: 'projects' },
  { icon: Users, label: 'Users', path: 'users' },
  { label: 'Profile', path: 'profile', isProfile: true },
]

interface SidebarProps {
  orgId?: string
}

export function Sidebar({ orgId }: SidebarProps = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarCollapsed, setSidebarCollapsed } = useLayout()
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [userInitials, setUserInitials] = useState<string>('')
  const [imageError, setImageError] = useState(false)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  
  // Extract orgId from pathname if not provided
  const currentOrgId = orgId || (pathname.match(/^\/org\/([^/]+)/)?.[1] ?? null)

  useEffect(() => {
    // Get user data from localStorage
    const loadUserData = () => {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          if (user.avatar) {
            // Construct full URL if needed
            let avatarUrl = user.avatar
            if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:')) {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
              avatarUrl = `${apiUrl}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`
            }
            setUserAvatar(avatarUrl)
            setImageError(false)
          }
          // Set initials for fallback
          const firstName = user.firstName || ''
          const lastName = user.lastName || ''
          if (firstName || lastName) {
            setUserInitials(`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase())
          } else if (user.email) {
            setUserInitials(user.email.charAt(0).toUpperCase())
          }
        } catch (error) {
          console.error('Failed to parse user data:', error)
        }
      }
    }
    
    loadUserData()
    
    // Listen for storage changes (when user updates profile)
    const handleStorageChange = () => {
      loadUserData()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically for updates (in case same tab updates localStorage)
    const interval = setInterval(loadUserData, 2000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // Fetch unread message count
  useEffect(() => {
    if (!currentOrgId) return

    const fetchUnreadCount = async () => {
      try {
        const response = await orgApi.get(currentOrgId, 'messages/unread-count')
        setUnreadCount(response.data.count || 0)
      } catch (error) {
        console.error('Failed to fetch unread count:', error)
        setUnreadCount(0)
      }
    }

    fetchUnreadCount()
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [currentOrgId])
  
  const getHref = (path: string) => {
    if (currentOrgId) {
      return `/org/${currentOrgId}/${path}`
    }
    // Fallback for non-org routes (like /login, /register)
    return `/${path}`
  }

  const toggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleLogout = () => {
    authService.logout()
    router.push('/login')
  }

  const handleLogoutClick = () => {
    setShowLogoutModal(true)
  }

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
      
      <div 
        className={cn(
          "bg-card border-r border-border flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300",
          sidebarCollapsed ? "w-20" : "w-64"
        )}
        data-tour="sidebar"
      >
      {/* Logo */}
      <div className="p-6 border-b border-border relative">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10  rounded-lg flex items-center justify-center shadow-sm">
          <img src="/images/logo-s.png" width={100} height={100} alt='logo' />
          </div>
          {!sidebarCollapsed && (
            <img src="/images/logo-t.png" width={100} height={100} alt='logo' />
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-card border border-border hover:bg-accent shadow-sm"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const href = getHref(item.path)
          const isActive = pathname === href || pathname.startsWith(href + '/')
          
          return (
            <Link
              key={item.path}
              href={href}
              className={cn(
                'flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group relative',
                isActive
                  ? 'bg-gold-500/20 dark:bg-gold-500/20 text-gold-600 dark:text-gold-500 border border-gold-500/30 shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3">
                {item.isProfile ? (
                  // Profile with user avatar
                  <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-gold-500/20 border border-gold-500/30">
                    {userAvatar && !imageError ? (
                      <img
                        src={userAvatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Mark error but don't clear avatar (might be temporary)
                          console.error('Failed to load avatar image:', userAvatar)
                          setImageError(true)
                        }}
                        onLoad={() => {
                          // Reset error state if image loads successfully
                          setImageError(false)
                        }}
                      />
                    ) : (
                      <span className="text-xs font-medium text-gold-600 dark:text-gold-500">
                        {userInitials || <User className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                ) : Icon ? (
                  <Icon className={cn(
                    'w-5 h-5 transition-transform flex-shrink-0',
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  )} />
                ) : null}
                {!sidebarCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </div>
              {!sidebarCollapsed && item.hasBadge && unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs bg-crimson-500">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
              {sidebarCollapsed && item.hasBadge && unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-crimson-500">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-1">
        <Link
          href="/settings"
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={sidebarCollapsed ? "Settings" : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="font-medium">Settings</span>}
        </Link>
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                title={sidebarCollapsed ? "Log Out" : undefined}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="font-medium">Log Out</span>}
              </button>
            </div>
          </div>
        </>
      )
}
