'use client'
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { TeamCard } from '@/components/TeamCard'
import { TeamChat } from '@/components/TeamChat'
import { WelcomeModal } from '@/components/WelcomeModal'
import { OnboardingTour } from '@/components/OnboardingTour'
import { OrganizationSetupModal } from '@/components/OrganizationSetupModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { orgApi } from '@/lib/api-helpers'
import api from '@/lib/api'
import { DashboardStats } from '@/lib/types'
import { Users, FolderKanban, Target, TrendingUp, Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const [orgSetupRequired, setOrgSetupRequired] = useState(false)
  const [checkingOrgSetup, setCheckingOrgSetup] = useState(true)

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

    checkOrgSetupAndOnboarding()
    fetchDashboardData()
  }, [router, orgId])

  const checkOrgSetupAndOnboarding = async () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserName(user.firstName || '')
      } catch (error) {
        console.error('Failed to parse user data:', error)
      }
    }

    // Require org setup before tour
    try {
      setCheckingOrgSetup(true)
      const orgRes = await api.get(`/organizations/${orgId}`)
      const setupCompleted = Boolean(orgRes.data?.settingsJson?.setupCompleted)
      setOrgSetupRequired(!setupCompleted)

      // Only show welcome modal (tour prompt) after org setup is completed
      if (setupCompleted && userStr) {
        try {
          const user = JSON.parse(userStr)
          if (!user.hasCompletedOnboarding) {
            setShowWelcomeModal(true)
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (e: any) {
      console.error('Failed to check organization setup:', e)
      // If 401/403, user likely doesn't have permission yet - require setup
      // Don't let this error trigger the global redirect
      if (e.response?.status === 401 || e.response?.status === 403) {
        setOrgSetupRequired(true)
      } else {
        // For other errors, also require setup as safer default
        setOrgSetupRequired(true)
      }
    } finally {
      setCheckingOrgSetup(false)
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
      const response = await orgApi.get(orgId, 'dashboards/stats')
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
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      <OrganizationSetupModal
        orgId={orgId}
        open={orgSetupRequired && !checkingOrgSetup}
        onCompleted={async () => {
          setOrgSetupRequired(false)
          // Re-check and then show welcome modal if needed
          await checkOrgSetupAndOnboarding()
        }}
      />
      <WelcomeModal
        open={showWelcomeModal && !orgSetupRequired}
        onStartTour={handleStartTour}
        onSkip={handleSkipTour}
        userName={userName}
      />
      
      {showTour && (
        <OnboardingTour orgId={orgId} onComplete={handleTourComplete} />
      )}

      <Header
        title="Dashboard"
        subtitle="High-level performance signals across programs and teams."
      />

      <div className="space-y-6 sm:space-y-8 w-full overflow-x-hidden">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-tour="stats">
              <Card className="bg-card border-border/70 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active Users</p>
                      <p className="text-3xl font-semibold text-foreground mt-2">
                        {stats?.stats.totalUsers || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl border border-primary/20 bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/70 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active Programs</p>
                      <p className="text-3xl font-semibold text-foreground mt-2">
                        {stats?.stats.totalProjects || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl border border-primary/20 bg-primary/10 flex items-center justify-center">
                      <FolderKanban className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/70 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Indicators</p>
                      <p className="text-3xl font-semibold text-foreground mt-2">
                        {stats?.stats.totalIndicators || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl border border-primary/20 bg-primary/10 flex items-center justify-center">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/70 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Target Completion</p>
                      <p className="text-3xl font-semibold text-foreground mt-2">
                        {stats?.stats.averageProgress.toFixed(1) || 0}%
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl border border-primary/20 bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Progress Cards */}
            <div data-tour="projects" className="space-y-4 w-full overflow-x-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">Team Progress</h2>
                  <p className="text-sm text-muted-foreground">Latest program activity across teams.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
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
                  <div className="col-span-2 text-center py-12 bg-card rounded-2xl border border-border/70">
                    <p className="text-muted-foreground">No programs yet. Create your first program to get started.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Section */}
            <Card className="bg-card border-border/70 shadow-sm w-full overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-lg sm:text-xl text-foreground">Timeline</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center flex-wrap gap-1">
                      <span>Date</span>
                      <span className="whitespace-nowrap">
                        {new Date().toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-hidden">
                <Tabs defaultValue="daily" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 gap-1 overflow-x-auto">
                  <TabsTrigger value="daily" className="text-xs sm:text-sm whitespace-nowrap">Daily</TabsTrigger>
                  <TabsTrigger value="weekly" className="text-xs sm:text-sm whitespace-nowrap">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs sm:text-sm whitespace-nowrap">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly" className="text-xs sm:text-sm whitespace-nowrap">Yearly</TabsTrigger>
                </TabsList>
                <TabsContent value="daily" className="mt-0">
                    <div className="bg-muted/40 rounded-2xl p-8 border border-border/70">
                      <div className="text-center text-muted-foreground">
                        <p className="mb-2">Timeline visualization will be displayed here</p>
                        <p className="text-sm">Gantt chart and task timeline coming soon</p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="weekly" className="mt-0">
                    <div className="bg-muted/40 rounded-2xl p-8 border border-border/70 text-center text-muted-foreground">
                      Weekly view coming soon
                    </div>
                  </TabsContent>
                  <TabsContent value="monthly" className="mt-0">
                    <div className="bg-muted/40 rounded-2xl p-8 border border-border/70 text-center text-muted-foreground">
                      Monthly view coming soon
                    </div>
                  </TabsContent>
                  <TabsContent value="yearly" className="mt-0">
                    <div className="bg-muted/40 rounded-2xl p-8 border border-border/70 text-center text-muted-foreground">
                      Yearly view coming soon
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
      </div>

      <TeamChat orgId={orgId} />
    </div>
  )
}
