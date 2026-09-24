import { notFound } from 'next/navigation'
import {
  formatDossierDate,
  formatTimeInDossier,
  parseDossierProductId,
} from '@/lib/dossier-product'
import { prisma } from '@/lib/prisma'
import { loadStudioContext } from '@/lib/studio-context'
import { StudioShell } from '@/components/studio/StudioShell'
import { ProductDetail, type ProductDetailData } from '@/components/dossier/ProductDetail'

export default async function DossierProductPage({ params }: { params: Promise<{ id: string }> }) {
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
      product: {
        select: { name: true, category: true, sizeLabel: true, brand: { select: { name: true } } },
      },
    },
  })
  if (!row) notFound()

  const product: ProductDetailData = {
    id: row.id,
    status: row.status,
    productName: row.product.name,
    brandName: row.product.brand?.name ?? null,
    // The user's own category, else the catalogue's.
    category: row.category ?? row.product.category,
    sizeLabel: row.product.sizeLabel,
    addedLabel: formatDossierDate(row.addedAt),
    inDossierLabel: formatTimeInDossier(row.addedAt),
    notes: row.notes,
  }

  return (
    <StudioShell user={user} sidebarCollapsed={sidebarCollapsed}>
      {/* Keyed by id so the notes draft resets when navigating between products. */}
      <ProductDetail key={product.id} product={product} />
    </StudioShell>
  )
}
