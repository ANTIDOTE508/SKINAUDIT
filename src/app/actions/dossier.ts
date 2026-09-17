'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ProductCategory, DossierProductStatus, TimeOfDay } from '@prisma/client'

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user
}

export async function searchProducts(query: string) {
  await requireSession()

  const trimmed = query.trim()
  if (trimmed.length === 0) return []

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: trimmed, mode: 'insensitive' } },
        { brand: { name: { contains: trimmed, mode: 'insensitive' } } },
        { aliases: { some: { alias: { contains: trimmed, mode: 'insensitive' } } } },
        { brand: { aliases: { some: { alias: { contains: trimmed, mode: 'insensitive' } } } } },
      ],
    },
    include: { brand: true },
    take: 20,
  })

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    brandName: p.brand?.name ?? null,
    category: p.category,
    sizeLabel: p.sizeLabel,
  }))
}

export async function addProductToDossier(input: {
  productId: number
  category: ProductCategory
  status: DossierProductStatus
}) {
  const user = await requireSession()

  const result = await prisma.$transaction(async (tx) => {
    if (input.category) {
      await tx.product.update({
        where: { id: input.productId },
        data: { category: input.category },
      })
    }

    const dossierProduct = await tx.userDossierProduct.create({
      data: {
        userId: user.id,
        productId: input.productId,
        status: input.status,
      },
    })

    await tx.dossierProductEvent.create({
      data: {
        dossierProductId: dossierProduct.id,
        type: 'ADDED_TO_DOSSIER',
        metadata: { status: input.status },
      },
    })

    return dossierProduct
  })

  return { dossierProductId: result.id }
}

export async function listDossierProducts(filter?: {
  status?: DossierProductStatus
  category?: ProductCategory
  timeOfDay?: TimeOfDay
}) {
  const user = await requireSession()

  const items = await prisma.userDossierProduct.findMany({
    where: {
      userId: user.id,
      status: filter?.status,
      product: filter?.category ? { category: filter.category } : undefined,
      ritualItems: filter?.timeOfDay ? { some: { timeOfDay: filter.timeOfDay } } : undefined,
    },
    include: { product: { include: { brand: true } } },
    orderBy: { addedAt: 'desc' },
  })

  return items.map((item) => ({
    dossierProductId: item.id,
    status: item.status,
    productName: item.product.name,
    brandName: item.product.brand?.name ?? null,
    category: item.product.category,
  }))
}

export async function getProductDetail(dossierProductId: number) {
  const user = await requireSession()

  const item = await prisma.userDossierProduct.findFirstOrThrow({
    where: { id: dossierProductId, userId: user.id },
    include: {
      product: {
        include: {
          brand: true,
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              ingredients: {
                orderBy: { position: 'asc' },
                include: { canonicalIngredient: true },
              },
            },
          },
        },
      },
      ritualItems: true,
    },
  })

  const latestVersion = item.product.versions[0]
  const structuredIngredients =
    latestVersion?.ingredients.map((i) => ({
      inci: i.canonicalIngredient.inci,
      isKeyIngredient: i.isKeyIngredient,
      concentration: i.concentration,
    })) ?? []

  return {
    dossierProductId: item.id,
    status: item.status,
    productName: item.product.name,
    brandName: item.product.brand?.name ?? null,
    category: item.product.category,
    sizeLabel: item.product.sizeLabel,
    usedIn: item.ritualItems.map((r) => ({ timeOfDay: r.timeOfDay, stepOrder: r.stepOrder })),
    // Les produits importés (source=CATALOG_SEED) n'ont pas de matching fin
    // vers CanonicalIngredient (hors périmètre du chantier de sync OBF) —
    // en repli, on expose le texte brut d'ingrédients OBF tel quel pour
    // que l'écran Ingredients affiche quelque chose plutôt qu'une liste vide.
    ingredients: structuredIngredients,
    rawIngredientsText: structuredIngredients.length === 0 ? item.product.ingredientsText : null,
  }
}

export async function getDossierProductHistory(dossierProductId: number) {
  const user = await requireSession()

  await prisma.userDossierProduct.findFirstOrThrow({
    where: { id: dossierProductId, userId: user.id },
    select: { id: true },
  })

  const events = await prisma.dossierProductEvent.findMany({
    where: { dossierProductId },
    orderBy: { occurredAt: 'desc' },
  })

  return events.map((e) => ({ type: e.type, metadata: e.metadata, occurredAt: e.occurredAt }))
}

export async function updateDossierProductStatus(dossierProductId: number, status: DossierProductStatus) {
  const user = await requireSession()

  await prisma.$transaction(async (tx) => {
    const current = await tx.userDossierProduct.findFirstOrThrow({
      where: { id: dossierProductId, userId: user.id },
    })

    if (current.status === status) return

    await tx.userDossierProduct.update({
      where: { id: dossierProductId },
      data: { status },
    })

    await tx.dossierProductEvent.create({
      data: {
        dossierProductId,
        type: 'STATUS_CHANGED',
        metadata: { from: current.status, to: status },
      },
    })
  })
}

export async function updateDossierStep(step: number) {
  const user = await requireSession()

  await prisma.userProfile.updateMany({
    where: { userId: user.id, dossierStep: { lt: step } },
    data: { dossierStep: step },
  })
}

export async function getDossierBuildState() {
  const user = await requireSession()

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: { dossierStep: true, dossierCompletedAt: true },
  })

  return {
    dossierStep: profile?.dossierStep ?? 0,
    dossierCompletedAt: profile?.dossierCompletedAt ?? null,
  }
}

export async function finalizeDossierBuild() {
  const user = await requireSession()

  await prisma.userProfile.updateMany({
    where: { userId: user.id },
    data: {
      dossierStep: 6,
      dossierCompletedAt: new Date(),
    },
  })
}
