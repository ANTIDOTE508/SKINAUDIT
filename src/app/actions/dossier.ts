'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
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

export type AddProductToDossierResult =
  | { ok: true; dossierProductId: number }
  | { ok: false; reason: 'ALREADY_IN_DOSSIER' }

/**
 * Adds a catalogue product to the user's Dossier. The chosen category is
 * stored on the user's own row — the shared catalogue is never edited.
 * An archived copy is reactivated; an active/seasonal one is left untouched.
 */
export async function addProductToDossier(input: {
  productId: number
  category: ProductCategory
  status: DossierProductStatus
}): Promise<AddProductToDossierResult> {
  const user = await requireSession()

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.userDossierProduct.findUnique({
        where: { userId_productId: { userId: user.id, productId: input.productId } },
        select: { id: true, status: true },
      })

      if (existing && existing.status !== 'ARCHIVED') {
        return { ok: false, reason: 'ALREADY_IN_DOSSIER' } as const
      }

      if (existing) {
        await tx.userDossierProduct.update({
          where: { id: existing.id },
          data: { status: input.status, category: input.category, archivedAt: null },
        })
        await tx.dossierProductEvent.create({
          data: {
            dossierProductId: existing.id,
            type: 'STATUS_CHANGED',
            metadata: { from: existing.status, to: input.status, category: input.category },
          },
        })
        return { ok: true, dossierProductId: existing.id } as const
      }

      const created = await tx.userDossierProduct.create({
        data: {
          userId: user.id,
          productId: input.productId,
          status: input.status,
          category: input.category,
        },
      })
      await tx.dossierProductEvent.create({
        data: {
          dossierProductId: created.id,
          type: 'ADDED_TO_DOSSIER',
          metadata: { status: input.status, category: input.category },
        },
      })
      return { ok: true, dossierProductId: created.id } as const
    })
  } catch (error) {
    // A concurrent add (double submit) lost the race on @@unique([userId, productId]).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, reason: 'ALREADY_IN_DOSSIER' }
    }
    throw error
  }
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
      // Effective category: the user's own, else the catalogue's.
      OR: filter?.category
        ? [
            { category: filter.category },
            { category: null, product: { category: filter.category } },
          ]
        : undefined,
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
    category: item.category ?? item.product.category,
  }))
}

export async function updateDossierProductStatus(
  dossierProductId: number,
  status: DossierProductStatus
) {
  const user = await requireSession()

  await prisma.$transaction(async (tx) => {
    const current = await tx.userDossierProduct.findFirstOrThrow({
      where: { id: dossierProductId, userId: user.id },
    })

    if (current.status === status) return

    await tx.userDossierProduct.update({
      where: { id: dossierProductId },
      data: { status, archivedAt: status === 'ARCHIVED' ? new Date() : null },
    })

    await tx.dossierProductEvent.create({
      data: {
        dossierProductId,
        type: 'STATUS_CHANGED',
        metadata: { from: current.status, to: status },
      },
    })
  })

  revalidateDossierProduct(dossierProductId)
}

const NOTES_MAX_LENGTH = 2000

/** The Dossier list plus every screen of one product (detail, ingredients, history). */
function revalidateDossierProduct(dossierProductId: number) {
  revalidatePath('/dossier')
  for (const screen of ['', '/ingredients', '/history']) {
    revalidatePath(`/dossier/${dossierProductId}${screen}`)
  }
}

/** Personal notes on a Dossier product (mockup 10). Blank clears them. */
export async function updateDossierProductNotes(dossierProductId: number, notes: string) {
  const user = await requireSession()

  const trimmed = notes.trim().slice(0, NOTES_MAX_LENGTH)
  const next = trimmed.length > 0 ? trimmed : null

  await prisma.$transaction(async (tx) => {
    const current = await tx.userDossierProduct.findFirstOrThrow({
      where: { id: dossierProductId, userId: user.id },
      select: { notes: true },
    })

    if (current.notes === next) return

    await tx.userDossierProduct.update({
      where: { id: dossierProductId },
      data: { notes: next },
    })

    await tx.dossierProductEvent.create({
      data: {
        dossierProductId,
        type: 'EDITED',
        // The text is kept so the History timeline (mockup 12) can quote it.
        metadata: {
          field: 'notes',
          change: next === null ? 'removed' : current.notes === null ? 'added' : 'updated',
          text: next,
        },
      },
    })
  })

  revalidateDossierProduct(dossierProductId)
}

/** Permanently deletes a Dossier product; its events and ritual items cascade. */
export async function removeDossierProduct(dossierProductId: number) {
  const user = await requireSession()

  const { count } = await prisma.userDossierProduct.deleteMany({
    where: { id: dossierProductId, userId: user.id },
  })
  if (count === 0) throw new Error('Dossier product not found')

  revalidatePath('/dossier')
}
