import { notFound } from 'next/navigation'
import { parseDossierProductId } from '@/lib/dossier-product'
import { parseInci } from '@/lib/inci'
import { prisma } from '@/lib/prisma'
import { loadStudioContext } from '@/lib/studio-context'
import { StudioShell } from '@/components/studio/StudioShell'
import { ProductIngredients } from '@/components/dossier/ProductIngredients'

export default async function DossierProductIngredientsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const dossierProductId = parseDossierProductId(id)

  const { userId, user, sidebarCollapsed } = await loadStudioContext()

  // Structured ingredients (product_versions → canonical_ingredients) are not
  // populated yet and their tables drift from the Prisma @map names, so the
  // screen reads the raw INCI text every product source provides.
  const row = await prisma.userDossierProduct.findFirst({
    where: { id: dossierProductId, userId },
    select: {
      id: true,
      product: {
        select: {
          name: true,
          source: true,
          ingredientsText: true,
          brand: { select: { name: true } },
        },
      },
    },
  })
  if (!row) notFound()

  return (
    <StudioShell user={user} sidebarCollapsed={sidebarCollapsed}>
      <ProductIngredients
        dossierProductId={row.id}
        brandName={row.product.brand?.name ?? null}
        productName={row.product.name}
        source={row.product.source}
        ingredients={parseInci(row.product.ingredientsText)}
      />
    </StudioShell>
  )
}
