'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { TeamCard } from '@/components/TeamCard'
import { TeamChat } from '@/components/TeamChat'
import { WelcomeModal } from '@/components/WelcomeModal'
import { OnboardingTour } from '@/components/OnboardingTour'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLayout } from '@/contexts/LayoutContext'
import { orgApi } from '@/lib/api-helpers'
import { DashboardStats, Project } from '@/lib/types'
import { Users, FolderKanban, Target, TrendingUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const { sidebarCollapsed, chatCollapsed } = useLayout()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (!orgId) {
      console.error('Organization ID not found in route')
      return
    }

    checkOnboardingStatus()
    fetchDashboardData()
  }, [router, orgId])

  const checkOnboardingStatus = () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserName(user.firstName || '')
        // Show welcome modal if user hasn't completed onboarding
        if (!user.hasCompletedOnboarding) {
          setShowWelcomeModal(true)
        }
      } catch (error) {
        console.error('Failed to parse user data:', error)
      }
    }
  }

  const handleStartTour = () => {
    setShowWelcomeModal(false)
    setShowTour(true)
  }

  const handleSkipTour = async () => {
    setShowWelcomeModal(false)
    // Mark onboarding as complete when skipped
    try {
      await orgApi.patch(orgId, 'users/profile/onboarding-complete', {})
      
      // Update localStorage
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          user.hasCompletedOnboarding = true
          localStorage.setItem('user', JSON.stringify(user))
        } catch (error) {
          console.error('Failed to update user in localStorage:', error)
        }
      }
    } catch (error) {
      console.error('Failed to mark onboarding as complete:', error)
    }
  }

  const handleTourComplete = () => {
    setShowTour(false)
  }

  const fetchDashboardData = async () => {
    try {
      const response = await orgApi.get(orgId, 'dashboard')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <WelcomeModal
        open={showWelcomeModal}
        onStartTour={handleStartTour}
        onSkip={handleSkipTour}
        userName={userName}
      />
      
      {showTour && (
        <OnboardingTour orgId={orgId} onComplete={handleTourComplete} />
      )}

      <Sidebar orgId={orgId} />
      
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        sidebarCollapsed ? "ml-20" : "ml-64",
        chatCollapsed ? "mr-12" : "mr-80"
      )}>
        <Header title="Dashboard" orgId={orgId} />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" data-tour="stats">
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Active Users</p>
                      <p className="text-3xl font-bold text-foreground">
                        {stats?.stats.totalUsers || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gold-500/20 dark:bg-gold-500/20 rounded-xl flex items-center justify-center border border-gold-500/30">
                      <Users className="w-6 h-6 text-gold-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Number of Projects</p>
                      <p className="text-3xl font-bold text-foreground">
                        {stats?.stats.totalProjects || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gold-500/20 dark:bg-gold-500/20 rounded-xl flex items-center justify-center border border-gold-500/30">
                      <FolderKanban className="w-6 h-6 text-gold-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Number of Tasks</p>
                      <p className="text-3xl font-bold text-foreground">
                        {stats?.stats.totalIndicators || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gold-500/20 dark:bg-gold-500/20 rounded-xl flex items-center justify-center border border-gold-500/30">
                      <Target className="w-6 h-6 text-gold-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Target Completed</p>
                      <p className="text-3xl font-bold text-foreground">
                        {stats?.stats.averageProgress.toFixed(1) || 0}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gold-500/20 dark:bg-gold-500/20 rounded-xl flex items-center justify-center border border-gold-500/30">
                      <TrendingUp className="w-6 h-6 text-gold-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Progress Cards */}
            <div className="mb-6" data-tour="projects">
              <h2 className="text-xl font-semibold text-foreground mb-4">Team Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats?.recentProjects && stats.recentProjects.length > 0 ? (
                  stats.recentProjects.map((project, index) => (
                    <TeamCard
                      key={project.id}
                      project={project}
                      highlighted={index === 0}
                      onClick={() => router.push(`/org/${orgId}/projects/${project.id}`)}
                    />
                  ))
                ) : (
                  <div className="col-span-4 text-center py-12 bg-card rounded-xl border border-border">
                    <p className="text-muted-foreground">No projects yet. Create your first project to get started.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Section */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-foreground">Timeline</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center">
                      <span className="mr-2">📅</span>
                      {new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="daily" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="yearly">Yearly</TabsTrigger>
                  </TabsList>
                  <TabsContent value="daily" className="mt-0">
                    <div className="bg-muted/50 rounded-lg p-8 border border-border">
                      <div className="text-center text-muted-foreground">
                        <p className="mb-2">Timeline visualization will be displayed here</p>
                        <p className="text-sm">Gantt chart and task timeline coming soon</p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="weekly" className="mt-0">
                    <div className="bg-muted/50 rounded-lg p-8 border border-border text-center text-muted-foreground">
                      Weekly view coming soon
                    </div>
                  </TabsContent>
                  <TabsContent value="monthly" className="mt-0">
                    <div className="bg-muted/50 rounded-lg p-8 border border-border text-center text-muted-foreground">
                      Monthly view coming soon
                    </div>
                  </TabsContent>
                  <TabsContent value="yearly" className="mt-0">
                    <div className="bg-muted/50 rounded-lg p-8 border border-border text-center text-muted-foreground">
                      Yearly view coming soon
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <TeamChat orgId={orgId} />
    </div>
  )
}

