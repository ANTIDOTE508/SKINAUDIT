'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeObfRecord, slugify, type ObfRecord } from '@/lib/obf-normalize'
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

  return products.map(toProductSummary)
}

function toProductSummary(p: Prisma.ProductGetPayload<{ include: { brand: true } }>) {
  return {
    id: p.id,
    name: p.name,
    brandName: p.brand?.name ?? null,
    category: p.category,
    sizeLabel: p.sizeLabel,
  }
}

export type BarcodeLookupResult =
  | { status: 'found'; product: ReturnType<typeof toProductSummary> }
  | { status: 'not_found'; barcode: string }
  | { status: 'invalid' }

const OBF_PRODUCT_URL = 'https://world.openbeautyfacts.org/api/v2/product'
const OBF_FIELDS =
  'code,product_name,product_name_en,brands,categories_tags,ingredients_text,quantity'
// Open Beauty Facts asks API clients to identify themselves.
const OBF_USER_AGENT = 'SkinAudit/0.1 (+https://theantidoteagency.com)'

/**
 * A UPC-A code (12 digits) is the same product as its EAN-13 form with a
 * leading zero — scanners and OBF don't agree on which one they report, so
 * both spellings are tried.
 */
function barcodeVariants(code: string): string[] {
  if (code.length === 12) return [code, `0${code}`]
  if (code.length === 13 && code.startsWith('0')) return [code, code.slice(1)]
  return [code]
}

async function fetchObfProduct(code: string): Promise<ObfRecord | null> {
  try {
    const res = await fetch(`${OBF_PRODUCT_URL}/${code}?fields=${OBF_FIELDS}`, {
      headers: { 'User-Agent': OBF_USER_AGENT },
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const body = (await res.json()) as { status?: number; product?: ObfRecord }
    return body.status === 1 && body.product ? body.product : null
  } catch {
    // Network failure or timeout — treated as "not found" so the user can
    // still fall back to search.
    return null
  }
}

/**
 * Brand.name and Brand.slug are both unique, so an existing brand is matched
 * on either — a brand created with the same name but another slug must not
 * make the insert fail. A name with no Latin characters slugifies to '', so
 * it gets a slug derived from the barcode instead of sharing an empty one.
 */
async function findOrCreateBrand(name: string, barcode: string) {
  const slug = slugify(name) || `brand-${barcode}`
  const where = { OR: [{ name }, { slug }] }
  const existing = await prisma.brand.findFirst({ where })
  if (existing) return existing
  try {
    return await prisma.brand.create({ data: { name, slug } })
  } catch (error) {
    // A concurrent scan created it between the lookup and the insert.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const created = await prisma.brand.findFirst({ where })
      if (created) return created
    }
    throw error
  }
}

/**
 * Resolves a scanned barcode: our catalogue first, then a live Open Beauty
 * Facts lookup for products added there since the last catalogue sync. A
 * product found on OBF is saved to the catalogue so the next scan is local.
 */
export async function lookupProductByBarcode(rawCode: string): Promise<BarcodeLookupResult> {
  await requireSession()

  const code = rawCode.trim()
  if (!/^\d{8,14}$/.test(code)) return { status: 'invalid' }

  const variants = barcodeVariants(code)
  const existing = await prisma.product.findFirst({
    where: { barcode: { in: variants } },
    include: { brand: true },
  })
  if (existing) return { status: 'found', product: toProductSummary(existing) }

  for (const variant of variants) {
    const record = await fetchObfProduct(variant)
    if (!record) continue

    const normalized = normalizeObfRecord(record)
    // On OBF but not a skincare product we can categorise — same filter as
    // the catalogue sync, so scanned products stay consistent with it.
    if (!normalized) break

    const brand = await findOrCreateBrand(normalized.brandName, normalized.barcode)
    const product = await prisma.product.upsert({
      where: { barcode: normalized.barcode },
      update: {},
      create: {
        name: normalized.name,
        slug: slugify(`${normalized.brandName}-${normalized.name}-${normalized.barcode}`),
        barcode: normalized.barcode,
        brandId: brand.id,
        category: normalized.category,
        sizeLabel: normalized.sizeLabel,
        ingredientsText: normalized.ingredientsText,
        source: 'CATALOG_SEED',
      },
      include: { brand: true },
    })
    return { status: 'found', product: toProductSummary(product) }
  }

  return { status: 'not_found', barcode: code }
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
