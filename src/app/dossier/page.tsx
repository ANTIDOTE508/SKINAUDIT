import { prisma } from '@/lib/prisma'
import { loadStudioContext } from '@/lib/studio-context'
import { StudioShell } from '@/components/studio/StudioShell'
import { DossierList, type DossierListItem } from '@/components/dossier/DossierList'

export default async function DossierPage() {
  const { userId, user, sidebarCollapsed } = await loadStudioContext()

  // Every status, archived included: the status tabs filter client-side and
  // "All" counts archived products too (mockup 08: 22 = 14 + 4 + 4).
  const rows = await prisma.userDossierProduct.findMany({
    where: { userId },
    orderBy: { addedAt: 'desc' },
    select: {
      id: true,
      status: true,
      category: true,
      addedAt: true,
      product: { select: { name: true, category: true, brand: { select: { name: true } } } },
    },
  })

  const items: DossierListItem[] = rows.map((row) => ({
    id: row.id,
    status: row.status,
    productName: row.product.name,
    brandName: row.product.brand?.name ?? null,
    // The user's own category, else the catalogue's.
    category: row.category ?? row.product.category,
    addedAt: row.addedAt.toISOString(),
  }))

  return (
    <StudioShell user={user} sidebarCollapsed={sidebarCollapsed}>
      <DossierList items={items} />
    </StudioShell>
  )
}
