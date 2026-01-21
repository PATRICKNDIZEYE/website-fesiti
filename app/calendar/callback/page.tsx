'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { orgApi } from '@/lib/api-helpers'

export default function GoogleCalendarCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const handleOAuthCallback = useCallback(async (code: string, orgId: string) => {
    try {
      await orgApi.post(orgId, 'calendar/google-oauth-callback', { code })
      setStatus('success')
      setMessage('Google Calendar connected successfully! Redirecting...')
      setTimeout(() => {
        router.push(`/org/${orgId}/calendar`)
      }, 1500)
    } catch (error: any) {
      setStatus('error')
      setMessage(error.response?.data?.message || 'Failed to connect Google Calendar')
      setTimeout(() => {
        router.push(`/org/${orgId}/calendar`)
      }, 3000)
    }
  }, [router])

  useEffect(() => {
    const code = searchParams.get('code')
    const orgId = localStorage.getItem('currentOrgId') || 
      (() => {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          try {
            const user = JSON.parse(userStr)
            return user.organizationId
          } catch (e) {
            return null
          }
        }
        return null
      })()

    if (code && orgId) {
      handleOAuthCallback(code, orgId)
    } else {
      setStatus('error')
      setMessage('Missing authorization code or organization ID')
      setTimeout(() => {
        if (orgId) {
          router.push(`/org/${orgId}/calendar`)
        } else {
          router.push('/login')
        }
      }, 2000)
    }
  }, [searchParams, router, handleOAuthCallback])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="bg-card border-border shadow-xl max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                <p className="text-foreground">Connecting Google Calendar...</p>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
                <p className="text-foreground">{message}</p>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="w-12 h-12 text-destructive mx-auto" />
                <p className="text-foreground">{message}</p>
                <p className="text-muted-foreground text-sm">Redirecting to calendar...</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
