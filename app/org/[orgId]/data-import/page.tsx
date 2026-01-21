'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { TeamChat } from '@/components/TeamChat'
import { FileSpreadsheet, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExcelUploader } from '@/components/ExcelUploader'
import { GoogleSheetsConnector } from '@/components/GoogleSheetsConnector'
import { DatasetManager } from '@/components/DatasetManager'

export default function DataImportPage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadType, setUploadType] = useState<'excel' | 'google' | null>(null)

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
  }, [router, orgId])

  const handleUploadSuccess = () => {
    setShowUploadDialog(false)
    setUploadType(null)
    // Refresh will be handled by DatasetManager
  }

  return (
    <div className="space-y-6">
      <Header
        title="Data Hub"
        subtitle="Ingest, validate, and structure datasets for analytics."
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setUploadType('excel')
                setShowUploadDialog(true)
              }}
              className="rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Upload Excel
            </Button>
            <Button
              onClick={() => {
                setUploadType('google')
                setShowUploadDialog(true)
              }}
              variant="outline"
              className="rounded-full border-border"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect Sheets
            </Button>
          </div>
        }
      />

      <div className="bg-card rounded-2xl border border-border/70 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Your datasets</h2>
        <DatasetManager onUpdate={() => {}} orgId={orgId} />
      </div>

      <TeamChat orgId={orgId} />

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {uploadType === 'excel' ? 'Upload Excel File' : 'Connect Google Sheets'}
            </DialogTitle>
          </DialogHeader>
          {uploadType === 'excel' && (
            <ExcelUploader
              onSuccess={handleUploadSuccess}
              onCancel={() => {
                setShowUploadDialog(false)
                setUploadType(null)
              }}
              orgId={orgId}
            />
          )}
          {uploadType === 'google' && (
            <GoogleSheetsConnector
              onSuccess={handleUploadSuccess}
              onCancel={() => {
                setShowUploadDialog(false)
                setUploadType(null)
              }}
              orgId={orgId}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
