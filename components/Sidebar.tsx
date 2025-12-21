'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  MessageSquare, 
  BarChart3, 
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

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: MessageSquare, label: 'Messages', href: '/messages', badge: 9 },
  { icon: TrendingUp, label: 'Visualization', href: '/visualization' },
  { icon: FileSpreadsheet, label: 'Data Import', href: '/data-import' },
  { icon: BarChart3, label: 'Statistics', href: '/statistics' },
  { icon: Calendar, label: 'Calendar', href: '/calendar' },
  { icon: FolderKanban, label: 'Project', href: '/projects' },
  { icon: Bell, label: 'Notifications', href: '/notifications', badge: 17 },
  { icon: Users, label: 'Users', href: '/users' },
  { icon: User, label: 'Profile', href: '/profile' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarCollapsed, setSidebarCollapsed } = useLayout()

  const toggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleLogout = () => {
    authService.logout()
    router.push('/login')
  }

  return (
    <div className={cn(
      "bg-card border-r border-border flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300",
      sidebarCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-border relative">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-charcoal-900 dark:text-charcoal-900 font-bold text-xl">T</span>
          </div>
          {!sidebarCollapsed && (
            <span className="text-xl font-bold text-foreground">TURBO</span>
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
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group relative',
                isActive
                  ? 'bg-gold-500/20 dark:bg-gold-500/20 text-gold-600 dark:text-gold-500 border border-gold-500/30 shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3">
                <Icon className={cn(
                  'w-5 h-5 transition-transform flex-shrink-0',
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                )} />
                {!sidebarCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </div>
              {!sidebarCollapsed && item.badge && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs bg-crimson-500">
                  {item.badge}
                </Badge>
              )}
              {sidebarCollapsed && item.badge && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-crimson-500">
                  {item.badge}
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
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={sidebarCollapsed ? "Log Out" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="font-medium">Log Out</span>}
        </button>
      </div>
    </div>
  )
}
