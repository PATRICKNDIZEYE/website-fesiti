'use client'

import { useParams } from 'next/navigation'
import { SubmissionsOverview } from '@/components/SubmissionsOverview'

export default function SubmissionsOverviewPage() {
  const params = useParams()
  const orgId = params.orgId as string

  return <SubmissionsOverview orgId={orgId} />
}
