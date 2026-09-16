# OBF Catalog Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Node script that downloads the nightly Open Beauty Facts (OBF) JSONL.gz dump, filters it to skincare products with a usable barcode, and upserts them into the `Product`/`Brand` catalog with `source = CATALOG_SEED`, running on a weekly GitHub Actions cron.

**Architecture:** A single streaming pipeline script (`scripts/sync-obf.ts`) — download stream → gunzip stream → line-by-line JSONL parse → filter → normalize → batched upsert — with a hard post-filter count guard that aborts before writing anything if the filtered count looks anomalously low (the documented OBF dump-incompleteness failure mode). No API polling, no Vercel Cron/Function — pure Node script triggered by GitHub Actions `schedule` + `workflow_dispatch`.

**Tech Stack:** Node.js streams (`zlib.createGunzip`, `readline`), `undici`/native `fetch` for the download stream, Prisma Client (batched `$transaction`), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-14-obf-catalog-sync-design.md`

## Global Constraints

- **Hard dependency:** this plan requires `Product.barcode`, `Product.sizeLabel`, `Product.source`, `Product.createdByUserId`, and the 5-value `ProductCategory` enum to already exist in the database. Those are built in `docs/superpowers/plans/2026-09-15-dossier-product-database.md` (Tasks 1–3). **Do not start Task 1 of this plan until that plan's Task 3 SQL has been applied by the developer and Task 4's `pnpm db:generate` has run** — otherwise the Prisma Client used here won't have the `barcode`/`source` fields.
- **Never run `prisma migrate dev/deploy`** — this plan introduces no new schema, so it should need no migration at all; if a task here seems to need one, stop and re-check against the Dossier plan instead of writing new schema.
- No Vercel Cron/Function for the actual sync — confirmed anti-pattern per the spec (payload/duration/memory limits incompatible with streaming a multi-hundred-MB dump). GitHub Actions only.
- No test runner configured in this repo (no vitest/jest in `package.json`). Verification uses `pnpm type-check`, a small fixture-based Node script run via `npx tsx`, and a real (rate-limited, small) dry run against OBF for the final integration check.
- License attribution: any UI displaying a `source = CATALOG_SEED` product must show attribution to Open Beauty Facts (ODbL) — this plan builds the sync only; wiring the attribution string into product-detail UI is out of scope here (tracked in the Dossier plan / future front-end work) but the data needed for it (`source` field) is what this pipeline sets.

---

## File Structure

- `scripts/sync-obf.ts` — create: the pipeline entry point (download → decompress → parse → filter → normalize → upsert → verify → log). Single file, since the pipeline is a single linear flow and the spec treats it as one script — no premature splitting.
- `scripts/lib/obf-normalize.ts` — create: pure functions mapping a raw OBF JSONL record to the `Product`/`Brand` upsert shape, and the category-tag → `ProductCategory` mapping. Split out from `sync-obf.ts` because this is the part with actual branching logic worth unit-testing in isolation, versus the stream plumbing which isn't.
- `scripts/verify-obf-normalize.ts` — create: standalone Node assertion script exercising `obf-normalize.ts` against fixture records (substitute for a test framework, same pattern as the Dossier plan's Task 7).
- `.github/workflows/sync-obf.yml` — create: weekly cron + manual dispatch trigger.

## Task Sequencing

Tasks 1–2 (normalization logic + its verification) have no database or network dependency and can be written and verified in isolation first. Task 3 (the streaming pipeline) depends on Task 1's normalizer and on the Dossier plan's schema fields being live in the database. Task 4 (GitHub Actions) depends on Task 3 being runnable.

---

### Task 1: OBF record normalization (category mapping, field extraction)

**Files:**
- Create: `scripts/lib/obf-normalize.ts`

**Interfaces:**
- Consumes: nothing (pure functions, no I/O).
- Produces: `type ObfRecord = { code: string; product_name?: string; brands?: string; categories_tags?: string[]; ingredients_text?: string; quantity?: string }`, `function mapObfCategoryToProductCategory(categoriesTags: string[]): ProductCategory | null`, `function isSkincareObfRecord(record: ObfRecord): boolean`, `function normalizeObfRecord(record: ObfRecord): NormalizedObfProduct | null` where `NormalizedObfProduct = { barcode: string; name: string; brandName: string; category: ProductCategory; sizeLabel: string | null; ingredientsText: string }`. Consumed by Task 2 (verification) and Task 3 (pipeline).

- [ ] **Step 1: Define the types and the skincare category mapping**

```typescript
// scripts/lib/obf-normalize.ts
import type { ProductCategory } from '@prisma/client'

export type ObfRecord = {
  code?: string
  product_name?: string
  brands?: string
  categories_tags?: string[]
  ingredients_text?: string
  quantity?: string
}

export type NormalizedObfProduct = {
  barcode: string
  name: string
  brandName: string
  category: ProductCategory
  sizeLabel: string | null
  ingredientsText: string
}

// OBF categories_tags use the `en:` taxonomy prefix (e.g. "en:face-cleansers").
// This mapping is a starting set covering the tags most likely to appear for
// skincare; extend it once the first real dry run (Task 3, Step 5) shows
// which tags actually occur in the filtered dump and are currently falling
// through to `null` (unmapped, so excluded — see isSkincareObfRecord).
const CATEGORY_TAG_MAP: Record<string, ProductCategory> = {
  'en:face-cleansers': 'CLEANSING',
  'en:cleansers': 'CLEANSING',
  'en:make-up-removers': 'CLEANSING',
  'en:toners': 'PREPARATION',
  'en:face-toners': 'PREPARATION',
  'en:serums': 'TREATMENT',
  'en:face-serums': 'TREATMENT',
  'en:face-masks': 'TREATMENT',
  'en:face-treatments': 'TREATMENT',
  'en:moisturisers': 'SUPPORT',
  'en:face-moisturisers': 'SUPPORT',
  'en:face-creams': 'SUPPORT',
  'en:face-oils': 'SUPPORT',
  'en:sunscreens': 'PROTECTION',
  'en:sun-protection': 'PROTECTION',
}

export function mapObfCategoryToProductCategory(categoriesTags: string[]): ProductCategory | null {
  for (const tag of categoriesTags) {
    const mapped = CATEGORY_TAG_MAP[tag]
    if (mapped) return mapped
  }
  return null
}
```

- [ ] **Step 2: Add the skincare filter and full normalizer**

```typescript
export function isSkincareObfRecord(record: ObfRecord): boolean {
  if (!record.code || record.code.trim() === '') return false
  if (!record.ingredients_text || record.ingredients_text.trim() === '') return false
  if (!record.brands || record.brands.trim() === '') return false
  if (!record.categories_tags || record.categories_tags.length === 0) return false
  return mapObfCategoryToProductCategory(record.categories_tags) !== null
}

export function normalizeObfRecord(record: ObfRecord): NormalizedObfProduct | null {
  if (!isSkincareObfRecord(record)) return null

  const category = mapObfCategoryToProductCategory(record.categories_tags!)
  if (!category) return null

  const brandName = record.brands!.split(',')[0].trim()
  if (brandName === '') return null

  return {
    barcode: record.code!.trim(),
    name: (record.product_name ?? '').trim() || `Unnamed product (${record.code})`,
    brandName,
    category,
    sizeLabel: record.quantity?.trim() || null,
    ingredientsText: record.ingredients_text!.trim(),
  }
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm type-check`
Expected: no errors. (This requires the Dossier plan's `ProductCategory` enum values — `SUPPORT`/`PREPARATION`/etc. — to already be generated in `@prisma/client`; if this fails with "Type '\"CLEANSING\"' is not assignable to type 'ProductCategory'", the Dossier plan's Task 4 `pnpm db:generate` hasn't been run yet in this environment.)

- [ ] **Step 4: Commit**

```bash
git add scripts/lib/obf-normalize.ts
git commit -m "feat: add OBF record normalization and category mapping"
```

---

### Task 2: Verification script for normalization logic

**Files:**
- Create: `scripts/verify-obf-normalize.ts`

**Interfaces:**
- Consumes: `mapObfCategoryToProductCategory`, `isSkincareObfRecord`, `normalizeObfRecord` from `./lib/obf-normalize` (Task 1).
- Produces: nothing consumed by later tasks — this is a leaf verification script, kept because there's no test framework in this repo (see Global Constraints).

- [ ] **Step 1: Write fixture-based assertions**

```typescript
// scripts/verify-obf-normalize.ts
// Run with: npx tsx scripts/verify-obf-normalize.ts
import {
  isSkincareObfRecord,
  mapObfCategoryToProductCategory,
  normalizeObfRecord,
  type ObfRecord,
} from './lib/obf-normalize'

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`FAIL: ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

// Case 1: valid skincare record maps cleanly
const cleanser: ObfRecord = {
  code: '1234567890123',
  product_name: 'Gentle Foaming Cleanser',
  brands: 'CeraVe,Some Distributor',
  categories_tags: ['en:cosmetics', 'en:face-cleansers'],
  ingredients_text: 'Aqua, Glycerin, Niacinamide',
  quantity: '236 ml',
}
assertEqual(isSkincareObfRecord(cleanser), true, 'cleanser should pass the skincare filter')
assertEqual(mapObfCategoryToProductCategory(cleanser.categories_tags!), 'CLEANSING', 'cleanser category mapping')
assertEqual(
  normalizeObfRecord(cleanser),
  {
    barcode: '1234567890123',
    name: 'Gentle Foaming Cleanser',
    brandName: 'CeraVe',
    category: 'CLEANSING',
    sizeLabel: '236 ml',
    ingredientsText: 'Aqua, Glycerin, Niacinamide',
  },
  'cleanser normalization',
)

// Case 2: missing barcode is rejected
const noBarcode: ObfRecord = { ...cleanser, code: '' }
assertEqual(isSkincareObfRecord(noBarcode), false, 'record without barcode should be rejected')
assertEqual(normalizeObfRecord(noBarcode), null, 'record without barcode should normalize to null')

// Case 3: missing ingredients_text is rejected
const noIngredients: ObfRecord = { ...cleanser, ingredients_text: '' }
assertEqual(isSkincareObfRecord(noIngredients), false, 'record without ingredients_text should be rejected')

// Case 4: missing brands is rejected
const noBrand: ObfRecord = { ...cleanser, brands: '' }
assertEqual(isSkincareObfRecord(noBrand), false, 'record without brands should be rejected')

// Case 5: unmapped category (e.g. a food product) is rejected
const unmapped: ObfRecord = { ...cleanser, categories_tags: ['en:cosmetics', 'en:shampoos'] }
assertEqual(isSkincareObfRecord(unmapped), false, 'unmapped category should be rejected')
assertEqual(mapObfCategoryToProductCategory(unmapped.categories_tags!), null, 'unmapped category returns null')

// Case 6: missing product_name falls back to a placeholder rather than crashing
const noName: ObfRecord = { ...cleanser, product_name: undefined }
const normalizedNoName = normalizeObfRecord(noName)
assertEqual(normalizedNoName?.name, 'Unnamed product (1234567890123)', 'missing product_name falls back to placeholder')

console.log('PASS: all OBF normalization assertions succeeded')
```

- [ ] **Step 2: Run it**

Run: `npx tsx scripts/verify-obf-normalize.ts`
Expected: `PASS: all OBF normalization assertions succeeded`

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-obf-normalize.ts
git commit -m "test: add standalone verification script for OBF normalization"
```

---

### Task 3: Streaming sync pipeline with post-filter count guard

**Files:**
- Create: `scripts/sync-obf.ts`

**Interfaces:**
- Consumes: `normalizeObfRecord` from `./lib/obf-normalize` (Task 1), `prisma` from `../src/lib/prisma`.
- Produces: a runnable script (`npx tsx scripts/sync-obf.ts`) with no exported interface — this is the pipeline entry point, consumed only by the GitHub Actions workflow in Task 4.

- [ ] **Step 1: Write the download → decompress → parse pipeline**

```typescript
// scripts/sync-obf.ts
// Run with: npx tsx scripts/sync-obf.ts
// Requires DATABASE_URL. Downloads and streams the full OBF JSONL.gz dump —
// do not run this against a local/dev database you care about without
// understanding the upsert behavior below (Step 4).

import { createGunzip } from 'node:zlib'
import { createInterface } from 'node:readline'
import { Readable } from 'node:stream'
import { prisma } from '../src/lib/prisma'
import { normalizeObfRecord, type NormalizedObfProduct, type ObfRecord } from './lib/obf-normalize'

const OBF_DUMP_URL = 'https://static.openbeautyfacts.org/data/openbeautyfacts-products.jsonl.gz'

// Calibrated after the first real run (Task 3, Step 5) — start conservative
// and tighten once real filtered-count numbers are known. This exists
// specifically to catch the documented OBF dump-incompleteness incident
// (see docs/superpowers/specs/2026-09-14-obf-catalog-sync-design.md).
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
```

- [ ] **Step 2: Add the batched upsert (Brand then Product, by barcode)**

```typescript
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
```

Note: `Brand.name` is the upsert key here, matching the existing `@unique` constraint on `Brand.name` (`prisma/schema.prisma:618`) — this means an OBF brand name that differs in casing/spacing from an existing manually-entered brand will create a duplicate `Brand` row rather than merging. This is accepted as documented dedup debt per the spec's "hors périmètre" section (inter-source deduplication is a future chantier) — do not attempt fuzzy brand matching in this task.

- [ ] **Step 3: Add the count guard, orchestration, and logging**

```typescript
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
```

- [ ] **Step 4: Type-check**

Run: `pnpm type-check`
Expected: no errors.

- [ ] **Step 5: Dry run against real OBF data with a disposable/dev database**

This step downloads the full real OBF dump (can be several hundred MB compressed) and writes to whatever `DATABASE_URL` is set. **Confirm with the developer which database this points at before running** — do not run this against production without their explicit go-ahead.

Run: `npx tsx scripts/sync-obf.ts`
Expected: log output ending in `[sync-obf] Done. N upserted, 0 upsert errors, M parse errors.` If it aborts with the `MINIMUM_EXPECTED_UPSERTS` guard, note the actual `stats.normalized` count from the log and report it to the developer — this is the real calibration data point the spec calls for; do not just lower the threshold to make it pass without discussing the number with them first.

- [ ] **Step 6: Commit**

```bash
git add scripts/sync-obf.ts
git commit -m "feat: add OBF catalog sync pipeline with streaming download and count-guard"
```

---

### Task 4: GitHub Actions weekly cron

**Files:**
- Create: `.github/workflows/sync-obf.yml`

**Interfaces:**
- Consumes: `scripts/sync-obf.ts` (Task 3), the `DATABASE_URL` repository secret (must already exist or be added by the developer — this task does not create secrets).
- Produces: nothing consumed by other tasks — this is the final integration point.

- [ ] **Step 1: Write the workflow file**

```yaml
name: Sync OBF Catalog

on:
  schedule:
    - cron: '0 3 * * 1' # every Monday at 03:00 UTC
  workflow_dispatch: {}

jobs:
  sync:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm db:generate

      - run: npx tsx scripts/sync-obf.ts
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

- [ ] **Step 2: Validate the YAML syntax**

Run: `npx -y js-yaml .github/workflows/sync-obf.yml > /dev/null && echo "valid YAML"`
Expected: `valid YAML`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/sync-obf.yml
git commit -m "ci: add weekly GitHub Actions cron for OBF catalog sync"
```

- [ ] **Step 4: Hand off to the developer**

Tell the user directly: "GitHub Actions workflow added at `.github/workflows/sync-obf.yml`, scheduled weekly (Mondays 03:00 UTC) with a manual `workflow_dispatch` trigger for testing. It needs a `DATABASE_URL` repository secret pointing at the target database — please confirm that secret exists (or add it) before the first scheduled run, and consider triggering it manually once first to watch the real log output and confirm the `MINIMUM_EXPECTED_UPSERTS` threshold (currently `500`, set in `scripts/sync-obf.ts`) is calibrated correctly against production data."

---

## Self-Review Notes

- **Spec coverage:** streaming download/decompress/parse ✓ (Task 3, Step 1), filter (barcode/ingredients_text/brands/category non-empty) ✓ (Task 1), field mapping table (`code`→`barcode`, `product_name`→`name`, `brands`→`Brand.name`, `categories_tags`→`category`, `ingredients_text` stored as-is, `quantity`→`sizeLabel`, fixed `source=CATALOG_SEED`) ✓ (Task 1 + Task 3 Step 2), batched upsert by barcode ✓ (Task 3, `UPSERT_BATCH_SIZE`), post-filter count guard with explicit failure rather than silent partial import ✓ (Task 3, Step 3), weekly GitHub Actions cron + manual dispatch ✓ (Task 4). Out-of-scope items from the spec (ingredient text matching to `CanonicalIngredient`, R2 image rehosting, formal ODbL/DBCL legal validation, cross-source dedup) are explicitly not tasked here, matching the spec's "hors périmètre" section.
- **Placeholder scan:** no TBD/TODO; the one open calibration value (`MINIMUM_EXPECTED_UPSERTS = 500`) is flagged as a starting value to be confirmed against real data in Task 3 Step 5, per the spec's own statement that real volumetry "n'est pas connue à l'avance" — this is a deliberate, spec-acknowledged unknown, not a plan gap.
- **Type consistency:** `NormalizedObfProduct` defined once in `obf-normalize.ts` (Task 1) and imported unchanged in Task 2 and Task 3. `ProductCategory` values used (`CLEANSING`/`PREPARATION`/`TREATMENT`/`SUPPORT`/`PROTECTION`) match exactly the enum defined in the Dossier plan's Task 2 — no drift.
- **Sequencing dependency made explicit:** Global Constraints and Task header both state this plan cannot run against a live database until the Dossier plan's schema fields exist, matching the spec's "Dépendance bloquante" section verbatim.
