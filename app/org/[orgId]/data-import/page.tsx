'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { TeamChat } from '@/components/TeamChat'
import { useLayout } from '@/contexts/LayoutContext'
import { cn } from '@/lib/utils'
import { Plus, FileSpreadsheet, ExternalLink } from 'lucide-react'
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
  const { sidebarCollapsed, chatCollapsed } = useLayout()
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
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar orgId={orgId} />
      
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        sidebarCollapsed ? "ml-20" : "ml-64",
        chatCollapsed ? "mr-12" : "mr-80"
      )}>
        <Header title="Data Import & Visualization" />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Import Data for Visualization
              </h1>
              <p className="text-muted-foreground">
                Import Excel files or connect to Google Sheets to create advanced visualizations
              </p>
            </div>

            <div className="mb-6 flex space-x-4">
              <Button
                onClick={() => {
                  setUploadType('excel')
                  setShowUploadDialog(true)
                }}
                className="bg-gold-500 hover:bg-gold-600 text-charcoal-900"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Upload Excel File
              </Button>
              <Button
                onClick={() => {
                  setUploadType('google')
                  setShowUploadDialog(true)
                }}
                variant="outline"
                className="border-border"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Connect Google Sheets
              </Button>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Your Datasets
              </h2>
              <DatasetManager onUpdate={() => {}} orgId={orgId} />
            </div>
          </div>
        </div>
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

