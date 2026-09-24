import { notFound } from 'next/navigation'
import { toTimelineEntry } from '@/lib/dossier-history'
import { daysInDossier, parseDossierProductId } from '@/lib/dossier-product'
import { prisma } from '@/lib/prisma'
import { loadStudioContext } from '@/lib/studio-context'
import { StudioShell } from '@/components/studio/StudioShell'
import { ProductHistory } from '@/components/dossier/ProductHistory'

export default async function DossierProductHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const dossierProductId = parseDossierProductId(id)

  const { userId, user, sidebarCollapsed } = await loadStudioContext()

  const row = await prisma.userDossierProduct.findFirst({
    where: { id: dossierProductId, userId },
    select: {
      id: true,
      status: true,
      category: true,
      addedAt: true,
      notes: true,
      product: { select: { name: true, category: true, brand: { select: { name: true } } } },
    },
  })
  if (!row) notFound()

  // Queried on their own: loading `events` through the relation returns an
  // empty list against this database (see the camelCase/@map drift).
  const events = await prisma.dossierProductEvent.findMany({
    where: { dossierProductId: row.id },
    orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
    select: { id: true, type: true, metadata: true, occurredAt: true },
  })

  const category = row.category ?? row.product.category

  return (
    <StudioShell user={user} sidebarCollapsed={sidebarCollapsed}>
      <ProductHistory
        key={row.id}
        dossierProductId={row.id}
        brandName={row.product.brand?.name ?? null}
        productName={row.product.name}
        status={row.status}
        daysInDossier={daysInDossier(row.addedAt)}
        notes={row.notes}
        timeline={events.map((event) => toTimelineEntry(event, category))}
      />
    </StudioShell>
  )
}
