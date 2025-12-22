'use client'

import { useState, useEffect } from 'react'
import { Trash2, RefreshCw, Eye, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { orgApi } from '@/lib/api-helpers'
import Link from 'next/link'
import { ConfirmationModal } from '@/components/ConfirmationModal'

interface Dataset {
  id: string
  name: string
  description: string | null
  sourceType: 'excel' | 'google_sheets'
  sourceUrl: string | null
  filePath: string | null
  lastSyncedAt: string | null
  createdAt: string
  updatedAt: string
  schemas?: Array<{
    columns: Array<{ name: string; type: string; index: number }>
  }>
}

interface DatasetManagerProps {
  onUpdate?: () => void
  orgId?: string
}

export function DatasetManager({ onUpdate, orgId }: DatasetManagerProps) {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    if (orgId) {
      fetchDatasets()
    }
  }, [orgId])

  const fetchDatasets = async () => {
    if (!orgId) {
      console.error('Organization ID is required')
      return
    }
    try {
      setLoading(true)
      const response = await orgApi.get(orgId, 'data-import/datasets')
      setDatasets(response.data)
    } catch (error) {
      console.error('Failed to fetch datasets:', error)
    } finally {
      setLoading(false)
    }
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [datasetToDelete, setDatasetToDelete] = useState<string | null>(null)

  const handleDeleteClick = (id: string) => {
    setDatasetToDelete(id)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!datasetToDelete || !orgId) {
      alert('Organization ID or dataset ID is required')
      return
    }

    try {
      await orgApi.delete(orgId, `data-import/datasets/${datasetToDelete}`)
      setShowDeleteModal(false)
      setDatasetToDelete(null)
      await fetchDatasets()
      onUpdate?.()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete dataset')
      setShowDeleteModal(false)
      setDatasetToDelete(null)
    }
  }

  const handleSync = async (id: string) => {
    if (!orgId) {
      alert('Organization ID is required')
      return
    }

    try {
      setSyncing(id)
      await orgApi.post(orgId, `data-import/datasets/${id}/sync`)
      await fetchDatasets()
      onUpdate?.()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to sync dataset')
    } finally {
      setSyncing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (datasets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No datasets imported yet</p>
      </div>
    )
  }

  return (
    <>
      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDelete}
        title="Delete Dataset"
        description="Are you sure you want to delete this dataset? This action cannot be undone and all associated data will be permanently removed."
        type="delete"
        confirmText="Delete"
        cancelText="Cancel"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {datasets.map((dataset) => (
        <Card key={dataset.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{dataset.name}</CardTitle>
                {dataset.description && (
                  <CardDescription className="mt-1">
                    {dataset.description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Source:</span>
                <span className="font-medium capitalize">
                  {dataset.sourceType === 'excel' ? 'Excel File' : 'Google Sheets'}
                </span>
              </div>

              {dataset.schemas && dataset.schemas[0] && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Columns: </span>
                  <span className="font-medium">
                    {dataset.schemas[0].columns.length}
                  </span>
                </div>
              )}

              {dataset.lastSyncedAt && (
                <div className="text-xs text-muted-foreground">
                  Last synced: {new Date(dataset.lastSyncedAt).toLocaleString()}
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2 border-t">
                <Link href={orgId ? `/org/${orgId}/data-import/${dataset.id}/visualize` : '#'}>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    Visualize
                  </Button>
                </Link>

                {dataset.sourceType === 'google_sheets' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(dataset.id)}
                    disabled={syncing === dataset.id}
                  >
                    {syncing === dataset.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(dataset.id)}
                  className="text-crimson-500 hover:text-crimson-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      </div>
    </>
  )
}

