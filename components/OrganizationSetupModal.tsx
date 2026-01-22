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
    try {
      // 1) Upload logo if provided
      if (logoFile) {
        const fd = new FormData()
        fd.append('file', logoFile)
        await api.post(`/organizations/${orgId}/logo`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      // 2) Save setup fields + mark setupCompleted=true on backend
      await api.patch(`/organizations/${orgId}/setup`, {
        name: form.name,
        code: form.code || undefined,
        profile: {
          website: form.website || undefined,
          contactEmail: form.contactEmail || undefined,
        },
      })

      onCompleted()
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Failed to complete organization setup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Set up your organization</DialogTitle>
          <DialogDescription>
            Before you start, please add your organization details. This is required to continue.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization name *</Label>
            <Input
              id="orgName"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. FESITI"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgCode">Organization code</Label>
            <Input
              id="orgCode"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              placeholder="e.g. FESITI-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgWebsite">Website</Label>
            <Input
              id="orgWebsite"
              value={form.website}
              onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
              placeholder="https://example.org"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgContact">Contact email</Label>
            <Input
              id="orgContact"
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
              placeholder="contact@example.org"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgLogo">Logo (optional)</Label>
            <Input
              id="orgLogo"
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={submit} disabled={loading || !canSubmit}>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}


