'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, AlertCircle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-charcoal-900 p-4">
          <div className="w-full max-w-2xl">
            <Card className="bg-slate-500 border-slate-400 shadow-xl">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-red-600" />
                  </div>
                </div>
                <CardTitle className="text-4xl font-bold text-gray-900 mb-2">
                  Critical Error
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  A critical error occurred. Please refresh the page.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  We&apos;re sorry, but something went wrong. Please try refreshing the page.
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-500">
                    Error ID: {error.digest}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={reset}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Refresh Page
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </body>
    </html>
  )
}

