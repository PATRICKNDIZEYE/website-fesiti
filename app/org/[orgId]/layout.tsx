'use client'

import { AppShell } from '@/components/AppShell'

export default function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { orgId: string }
}) {
  return <AppShell orgId={params.orgId}>{children}</AppShell>
}
