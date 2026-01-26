'use client'

import { useEffect, useMemo, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

type OrgSetupState = {
  name: string
  code: string
  website: string
  contactEmail: string
}

export function OrganizationSetupModal({
  orgId,
  open,
  onCompleted,
}: {
  orgId: string
  open: boolean
  onCompleted: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [form, setForm] = useState<OrgSetupState>({
    name: '',
    code: '',
    website: '',
    contactEmail: '',
  })

  const canSubmit = useMemo(() => form.name.trim().length > 0, [form.name])

  useEffect(() => {
    if (!open) return
    setError('')
  }, [open])

  const submit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    
    console.log('Starting organization setup for orgId:', orgId)
    const token = localStorage.getItem('token')
    console.log('Token exists:', !!token)
    
    // Debug: Try to decode JWT payload (just for debugging)
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        console.log('JWT Payload:', {
          sub: payload.sub,
          orgId: payload.orgId,
          email: payload.email,
          exp: payload.exp,
          expDate: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A',
          isExpired: payload.exp ? Date.now() > payload.exp * 1000 : 'unknown',
        })
      } catch (e) {
        console.error('Failed to decode JWT:', e)
      }
    }
    
    try {
      // 1) Upload logo if provided (optional - don't block setup if it fails)
      if (logoFile) {
        try {
          console.log('Uploading logo...')
          const fd = new FormData()
          fd.append('file', logoFile)
          // Don't set headers manually - axios will set Content-Type with boundary for FormData
          // Authorization header is added by the api interceptor
          const logoRes = await api.post(`/organizations/${orgId}/logo`, fd)
          console.log('Logo uploaded successfully:', logoRes.status)
        } catch (logoError: any) {
          console.error('Logo upload error:', logoError.response?.status, logoError.response?.data)
          // Logo upload is optional - just log the error and continue with setup
          // Don't show error to user or block the setup process
          console.warn('Logo upload failed but continuing with setup (logo is optional)')
        }
      }

      // 2) Save setup fields + mark setupCompleted=true on backend
      console.log('Saving organization setup...')
      const setupRes = await api.patch(`/organizations/${orgId}/setup`, {
        name: form.name,
        code: form.code || undefined,
        profile: {
          website: form.website || undefined,
          contactEmail: form.contactEmail || undefined,
        },
      })
      console.log('Setup saved successfully:', setupRes.status)

      onCompleted()
    } catch (e: any) {
      console.error('Organization setup error:', {
        status: e.response?.status,
        data: e.response?.data,
        message: e.message,
        url: e.config?.url
      })
      
      let errorMessage = e.response?.data?.message || 
                        e.message || 
                        'Failed to complete organization setup. Please try again or contact support.'
      
      // If it's a 401, suggest re-login (likely JWT secret mismatch)
      if (e.response?.status === 401) {
        errorMessage = 'Your session has expired or is invalid. Please log out and log back in, then try again.'
      }
      
      setError(errorMessage)
      
      // Prevent any redirect - we're handling the error here
      // The axios interceptor should not redirect for setup endpoints, but just in case
      e.preventDefault?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Set up your organization</DialogTitle>
          <DialogDescription>
            Before you start, please add your organization details. This is required to continue.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization name *</Label>
              <Input
                id="orgName"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. FESITI"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgCode">Organization code</Label>
              <Input
                id="orgCode"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="e.g. FESITI-001"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgWebsite">Website</Label>
              <Input
                id="orgWebsite"
                value={form.website}
                onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                placeholder="https://example.org"
                className="w-full"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgContact">Contact email</Label>
              <Input
                id="orgContact"
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                placeholder="contact@example.org"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgLogo">Logo (optional)</Label>
              <Input
                id="orgLogo"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                className="w-full"
              />
              {logoFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {logoFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-border">
          <Button onClick={submit} disabled={loading || !canSubmit} size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


