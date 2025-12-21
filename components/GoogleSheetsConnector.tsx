'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import api from '@/lib/api'

interface GoogleSheetsConnectorProps {
  onSuccess: () => void
  onCancel: () => void
}

export function GoogleSheetsConnector({
  onSuccess,
  onCancel,
}: GoogleSheetsConnectorProps) {
  const [sheetUrl, setSheetUrl] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    fetchAuthUrl()
  }, [])

  const fetchAuthUrl = async () => {
    try {
      const response = await api.get('/data-import/google-auth-url')
      setAuthUrl(response.data.authUrl)
    } catch (err: any) {
      console.error('Failed to fetch auth URL:', err)
    }
  }

  const extractSheetId = (url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!sheetUrl.trim()) {
      setError('Please enter a Google Sheets URL')
      setLoading(false)
      return
    }

    const sheetId = extractSheetId(sheetUrl)
    if (!sheetId) {
      setError('Invalid Google Sheets URL')
      setLoading(false)
      return
    }

    if (!name.trim()) {
      setError('Please enter a name for the dataset')
      setLoading(false)
      return
    }

    try {
      await api.post('/data-import/google-sheets', {
        name,
        description,
        sourceType: 'google_sheets',
        googleSheetUrl: sheetUrl,
        googleSheetId: sheetId,
      })

      setConnected(true)
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to connect to Google Sheets')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = () => {
    if (authUrl) {
      window.location.href = authUrl
    }
  }

  if (connected) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Successfully Connected!
        </h3>
        <p className="text-muted-foreground">
          Your Google Sheet has been connected and is syncing...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You may need to authenticate with Google first. Click the button below
          to authorize access to Google Sheets.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleConnect} className="space-y-4">
        <div>
          <Label htmlFor="name">Dataset Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter dataset name"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
          />
        </div>

        <div>
          <Label htmlFor="sheetUrl">Google Sheets URL</Label>
          <Input
            id="sheetUrl"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Paste the full URL of your Google Sheet
          </p>
        </div>

        <div className="flex flex-col space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleAuth}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Authenticate with Google
          </Button>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !sheetUrl.trim() || !name.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

