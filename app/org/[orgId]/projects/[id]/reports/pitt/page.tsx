'use client'

import { useParams } from 'next/navigation'
import { PittView } from '@/components/PittView'

export default function PittPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const projectId = params.id as string

  return (
    <div className="container max-w-6xl py-6">
      <PittView orgId={orgId} projectId={projectId} />
    </div>
  )
}
