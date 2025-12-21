'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const user = searchParams.get('user')

    if (token && user) {
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('user', user)
        setStatus('success')
        setMessage('Login successful! Redirecting...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } catch (error) {
        setStatus('error')
        setMessage('Failed to save authentication data')
      }
    } else {
      setStatus('error')
      setMessage('Missing authentication data')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-charcoal-900 p-4">
      <Card className="bg-slate-500 border-slate-400 shadow-xl max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-gold-500 mx-auto" />
                <p className="text-white">Completing authentication...</p>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="w-12 h-12 text-gold-500 mx-auto" />
                <p className="text-white">{message}</p>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="w-12 h-12 text-crimson-500 mx-auto" />
                <p className="text-white">{message}</p>
                <p className="text-gray-300 text-sm">Redirecting to login...</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

