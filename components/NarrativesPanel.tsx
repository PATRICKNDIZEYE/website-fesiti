 'use client'
 
 import { useEffect, useState } from 'react'
 import { Button } from '@/components/ui/button'
 import { Alert, AlertDescription } from '@/components/ui/alert'
 import { narrativesApi } from '@/lib/api-helpers'
 import { PeriodNarrative } from '@/lib/types'
 import { AlertCircle, Loader2, Plus, Save, Trash2 } from 'lucide-react'
 import { ConfirmationModal } from '@/components/ConfirmationModal'
 
 interface NarrativesPanelProps {
   orgId: string
   projectId: string
   periodId: string
 }
 
 export function NarrativesPanel({ orgId, projectId, periodId }: NarrativesPanelProps) {
   const [narratives, setNarratives] = useState<PeriodNarrative[]>([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState('')
   const [savingId, setSavingId] = useState<string | null>(null)
   const [deleteId, setDeleteId] = useState<string | null>(null)
   const [showDeleteModal, setShowDeleteModal] = useState(false)
 
   const load = async () => {
     try {
       setLoading(true)
       setError('')
       const response = await narrativesApi.list(orgId, projectId, periodId)
       setNarratives(response.data || [])
     } catch (err: any) {
       setError(err.response?.data?.message || 'Failed to load narratives')
     } finally {
       setLoading(false)
     }
   }
 
   useEffect(() => {
     if (!orgId || !projectId || !periodId) return
     load()
   }, [orgId, projectId, periodId])
 
   const handleCreate = async () => {
     try {
       setError('')
       const response = await narrativesApi.create(orgId, {
         projectId,
         indicatorPeriodId: periodId,
         title: 'Narrative',
         content: '',
       })
       setNarratives((prev) => [response.data, ...prev])
     } catch (err: any) {
       setError(err.response?.data?.message || 'Failed to create narrative')
     }
   }
 
   const handleSave = async (narrative: PeriodNarrative) => {
     try {
       setSavingId(narrative.id)
       setError('')
       const response = await narrativesApi.update(orgId, narrative.id, {
         title: narrative.title,
         content: narrative.content,
       })
       setNarratives((prev) => prev.map((item) => (item.id === narrative.id ? response.data : item)))
     } catch (err: any) {
       setError(err.response?.data?.message || 'Failed to save narrative')
     } finally {
       setSavingId(null)
     }
   }
 
   const handleDelete = async () => {
     if (!deleteId) return
     try {
       await narrativesApi.delete(orgId, deleteId)
       setNarratives((prev) => prev.filter((item) => item.id !== deleteId))
     } catch (err: any) {
       setError(err.response?.data?.message || 'Failed to delete narrative')
     } finally {
       setShowDeleteModal(false)
       setDeleteId(null)
     }
   }
 
   if (loading) {
     return (
       <div className="flex items-center gap-2 text-muted-foreground">
         <Loader2 className="w-4 h-4 animate-spin" />
         Loading narratives...
       </div>
     )
   }
 
   return (
     <div className="space-y-4">
       <ConfirmationModal
         open={showDeleteModal}
         onOpenChange={setShowDeleteModal}
         onConfirm={handleDelete}
         title="Delete narrative?"
         description="This narrative will be removed from the reporting period."
         type="delete"
       />
 
       {error && (
         <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
           <AlertDescription>{error}</AlertDescription>
         </Alert>
       )}
 
       <div className="flex items-center justify-between">
         <p className="text-sm text-muted-foreground">
           Add contextual notes, explanations, and qualitative findings for this reporting period.
         </p>
         <Button variant="outline" size="sm" onClick={handleCreate}>
           <Plus className="w-4 h-4 mr-2" />
           Add Narrative
         </Button>
       </div>
 
       {narratives.length === 0 ? (
         <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-6">
           No narratives yet.
         </div>
       ) : (
         <div className="space-y-4">
           {narratives.map((narrative) => (
             <div key={narrative.id} className="border border-border rounded-lg p-4 bg-card space-y-3">
               <input
                 value={narrative.title}
                 onChange={(e) =>
                   setNarratives((prev) =>
                     prev.map((item) =>
                       item.id === narrative.id ? { ...item, title: e.target.value } : item
                     )
                   )
                 }
                 className="w-full text-sm font-medium border border-border rounded px-2 py-1 bg-background"
               />
               <textarea
                 value={narrative.content}
                 onChange={(e) =>
                   setNarratives((prev) =>
                     prev.map((item) =>
                       item.id === narrative.id ? { ...item, content: e.target.value } : item
                     )
                   )
                 }
                 rows={5}
                 placeholder="Write your narrative..."
                 className="w-full text-sm border border-border rounded px-2 py-2 bg-background"
               />
               <div className="flex items-center gap-2">
                 <Button variant="outline" size="sm" onClick={() => handleSave(narrative)} disabled={savingId === narrative.id}>
                   {savingId === narrative.id ? (
                     <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                   ) : (
                     <Save className="w-3 h-3 mr-1" />
                   )}
                   Save
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   className="text-destructive hover:text-destructive"
                   onClick={() => {
                     setDeleteId(narrative.id)
                     setShowDeleteModal(true)
                   }}
                 >
                   <Trash2 className="w-3 h-3 mr-1" />
                   Delete
                 </Button>
               </div>
             </div>
           ))}
         </div>
       )}
     </div>
   )
 }
