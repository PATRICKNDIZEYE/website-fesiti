'use client'

import { useEffect, useState, useCallback } from 'react'
import Joyride, { CallBackProps, STATUS, Step, Styles } from 'react-joyride'
import { orgApi } from '@/lib/api-helpers'

interface OnboardingTourProps {
  orgId: string
  onComplete: () => void
}

const tourSteps: Step[] = [
  {
    target: '[data-tour="top-nav"]',
    content: (
      <div>
        <h3 className="font-semibold text-foreground mb-2">Global Navigation</h3>
        <p className="text-sm text-muted-foreground">
          Use the top navigation to move between dashboards, programs, analysis, data, and collaboration spaces.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="create-project"]',
    content: (
      <div>
        <h3 className="font-semibold text-foreground mb-2">Create a Program</h3>
        <p className="text-sm text-muted-foreground">
          Start a new program from here. We will guide you through targets, milestones, and reporting cadence.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="stats"]',
    content: (
      <div>
        <h3 className="font-semibold text-foreground mb-2">Dashboard Statistics</h3>
        <p className="text-sm text-muted-foreground">
          Monitor your organization&apos;s key metrics at a glance: active users, projects, tasks, and completion rates.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="projects"]',
    content: (
      <div>
        <h3 className="font-semibold text-foreground mb-2">Projects Section</h3>
        <p className="text-sm text-muted-foreground">
          View and manage all your projects here. Click on any project card to see details, indicators, and reports.
        </p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="team-chat"]',
    content: (
      <div>
        <h3 className="font-semibold text-foreground mb-2">Team Chat</h3>
        <p className="text-sm text-muted-foreground">
          Communicate with your team in real-time. Send messages, share files, and collaborate on projects.
          You can collapse this panel when not needed.
        </p>
      </div>
    ),
    placement: 'left',
  },
]

const joyrideStyles: Partial<Styles> = {
  options: {
    primaryColor: '#1B3A57',
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: '12px',
  },
  tooltipContainer: {
    textAlign: 'left',
  },
  buttonNext: {
    backgroundColor: '#1B3A57',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: '6px',
  },
  buttonBack: {
    color: '#525252',
    marginRight: '8px',
  },
  buttonSkip: {
    color: '#888',
    fontSize: '14px',
  },
}

export function OnboardingTour({ orgId, onComplete }: OnboardingTourProps) {
  const [run, setRun] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setRun(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const handleJoyrideCallback = useCallback(async (data: CallBackProps) => {
    const { status, action } = data

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED || action === 'skip') {
      setRun(false)
      
      // Mark onboarding as complete
      try {
        setLoading(true)
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
        
        onComplete()
      } catch (error) {
        console.error('Failed to mark onboarding as complete:', error)
        // Still call onComplete to close the tour
        onComplete()
      } finally {
        setLoading(false)
      }
    }
  }, [orgId, onComplete])

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={joyrideStyles}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
      disableOverlayClose
      disableScrolling={false}
    />
  )
}
