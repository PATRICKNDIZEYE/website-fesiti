'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import api from '@/lib/api'

export default function GoogleCalendarCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')

    if (code) {
      handleOAuthCallback(code)
    } else {
      setStatus('error')
      setMessage('Missing authorization code')
      setTimeout(() => {
        router.push('/calendar')
      }, 2000)
    }
  }, [searchParams, router])

  const handleOAuthCallback = async (code: string) => {
    try {
      await api.post('/calendar/google-oauth-callback', { code })
      setStatus('success')
      setMessage('Google Calendar connected successfully! Redirecting...')
      setTimeout(() => {
        router.push('/calendar')
      }, 1500)
    } catch (error: any) {
      setStatus('error')
      setMessage(error.response?.data?.message || 'Failed to connect Google Calendar')
      setTimeout(() => {
        router.push('/calendar')
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="bg-card border-border shadow-xl max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto" />
                <p className="text-foreground">Connecting Google Calendar...</p>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="w-12 h-12 text-gold-500 mx-auto" />
                <p className="text-foreground">{message}</p>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="w-12 h-12 text-crimson-500 mx-auto" />
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


