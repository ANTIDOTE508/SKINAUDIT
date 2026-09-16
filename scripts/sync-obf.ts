// scripts/sync-obf.ts
// Lancer avec : npx tsx scripts/sync-obf.ts
// Nécessite DATABASE_URL. Télécharge et streame le dump JSONL.gz complet
// d'OBF (peut faire plusieurs centaines de Mo compressé) — ne pas lancer
// ceci contre une base locale/dev à laquelle vous tenez sans comprendre le
// comportement d'upsert ci-dessous (Étape 4).

import { createGunzip } from 'node:zlib'
import { createInterface } from 'node:readline'
import { Readable } from 'node:stream'
import { prisma } from '../src/lib/prisma'
import { normalizeObfRecord, type NormalizedObfProduct, type ObfRecord } from './lib/obf-normalize'

const OBF_DUMP_URL = 'https://static.openbeautyfacts.org/data/openbeautyfacts-products.jsonl.gz'

// Calibré après le premier run réel (Tâche 3, Étape 5) — démarrer prudent et
// resserrer une fois les vrais chiffres de comptage filtré connus. Ceci
// existe spécifiquement pour attraper l'incident documenté d'incomplétude
// du dump OBF (voir
// docs/superpowers/specs/2026-09-14-obf-catalog-sync-design.md).
const MINIMUM_EXPECTED_UPSERTS = 500

type SyncStats = {
  linesRead: number
  parseErrors: number
  filteredOut: number
  normalized: number
  upserted: number
  upsertErrors: number
}

async function fetchDumpStream(): Promise<NodeJS.ReadableStream> {
  const response = await fetch(OBF_DUMP_URL)
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download OBF dump: HTTP ${response.status}`)
  }
  return Readable.fromWeb(response.body as unknown as import('stream/web').ReadableStream)
}

async function collectNormalizedProducts(): Promise<{ products: NormalizedObfProduct[]; stats: SyncStats }> {
  const stats: SyncStats = {
    linesRead: 0,
    parseErrors: 0,
    filteredOut: 0,
    normalized: 0,
    upserted: 0,
    upsertErrors: 0,
  }

  const rawStream = await fetchDumpStream()
  const gunzip = createGunzip()
  rawStream.pipe(gunzip)
  const lines = createInterface({ input: gunzip, crlfDelay: Infinity })

  const products: NormalizedObfProduct[] = []

  for await (const line of lines) {
    if (line.trim() === '') continue
    stats.linesRead++

    let record: ObfRecord
    try {
      record = JSON.parse(line)
    } catch {
      stats.parseErrors++
      continue
    }

    const normalized = normalizeObfRecord(record)
    if (!normalized) {
      stats.filteredOut++
      continue
    }

    stats.normalized++
    products.push(normalized)
  }

  return { products, stats }
}

const UPSERT_BATCH_SIZE = 500

async function upsertBatch(batch: NormalizedObfProduct[], stats: SyncStats) {
  for (const item of batch) {
    try {
      const brand = await prisma.brand.upsert({
        where: { name: item.brandName },
        update: {},
        create: {
          name: item.brandName,
          slug: slugify(item.brandName),
        },
      })

      await prisma.product.upsert({
        where: { barcode: item.barcode },
        update: {
          name: item.name,
          brandId: brand.id,
          category: item.category,
          sizeLabel: item.sizeLabel,
        },
        create: {
          name: item.name,
          slug: slugify(`${item.brandName}-${item.name}-${item.barcode}`),
          barcode: item.barcode,
          brandId: brand.id,
          category: item.category,
          sizeLabel: item.sizeLabel,
          source: 'CATALOG_SEED',
        },
      })

      stats.upserted++
    } catch (err) {
      stats.upsertErrors++
      console.error(`Upsert failed for barcode ${item.barcode}:`, err)
    }
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 200)
}

async function main() {
  console.log(`[sync-obf] Starting OBF sync at ${new Date().toISOString()}`)

  const { products, stats } = await collectNormalizedProducts()

  console.log(
    `[sync-obf] Parsed dump: ${stats.linesRead} lines read, ${stats.parseErrors} parse errors, ` +
      `${stats.filteredOut} filtered out, ${stats.normalized} normalized.`,
  )

  if (products.length < MINIMUM_EXPECTED_UPSERTS) {
    console.error(
      `[sync-obf] ABORTING: only ${products.length} products passed filtering, below the minimum ` +
        `expected threshold of ${MINIMUM_EXPECTED_UPSERTS}. This matches the documented OBF dump-` +
        `incompleteness failure mode (see spec) — refusing to upsert a partial/corrupt dump. ` +
        `No database writes were made.`,
    )
    process.exit(1)
  }

  for (let i = 0; i < products.length; i += UPSERT_BATCH_SIZE) {
    const batch = products.slice(i, i + UPSERT_BATCH_SIZE)
    await upsertBatch(batch, stats)
    console.log(`[sync-obf] Upserted batch ${i / UPSERT_BATCH_SIZE + 1}: ${stats.upserted} total so far.`)
  }

  console.log(
    `[sync-obf] Done. ${stats.upserted} upserted, ${stats.upsertErrors} upsert errors, ` +
      `${stats.parseErrors} parse errors.`,
  )

  if (stats.upsertErrors > 0) {
    console.error(`[sync-obf] Completed with ${stats.upsertErrors} upsert errors — check logs above.`)
    process.exit(1)
  }
}

main()
  .catch((err) => {
    console.error('[sync-obf] Fatal error:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
