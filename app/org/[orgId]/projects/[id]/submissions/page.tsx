 'use client'
 
 import { useParams } from 'next/navigation'
 import { SubmissionsOverview } from '@/components/SubmissionsOverview'
 
 export default function ProjectSubmissionsPage() {
   const params = useParams()
   const orgId = params.orgId as string
   const projectId = params.id as string
 
   return <SubmissionsOverview orgId={orgId} projectId={projectId} />
 }
