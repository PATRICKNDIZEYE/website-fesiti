'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft, Search, AlertCircle } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-charcoal-900 p-4">
      <div className="w-full max-w-2xl">
        <Card className="bg-slate-500 border-slate-400 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-primary-600" />
              </div>
            </div>
            <CardTitle className="text-6xl font-bold text-gray-900 mb-2">404</CardTitle>
            <CardDescription className="text-xl text-gray-600">
              Page Not Found
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 text-lg">
              The page you are looking for doesn&apos;t exist or has been moved.
            </p>
            <p className="text-sm text-gray-500">
              Please check the URL or return to the homepage.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto"
            >
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Link href="/">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please{' '}
            <Link href="/contact" className="text-primary-600 hover:text-primary-700 font-medium">
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

