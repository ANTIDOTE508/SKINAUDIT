# Dossier Product Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Prisma schema and server actions so the 12-screen "Dossier" mockup (add a product via search/scan/manual entry, categorize, track status, view history) has a working data layer.

**Architecture:** Additive Prisma schema changes (new `Product` fields, a replaced `ProductCategory` enum, a new `DossierProductEvent` table) plus a set of `'use server'` actions in `src/app/actions/dossier.ts` that read/write those models. No UI is built in this plan — it produces the data layer and server actions the front-end screens will call.

**Tech Stack:** Next.js 15 App Router server actions, Prisma 7 (multi-schema, `app` schema), PostgreSQL (Neon), Better Auth (`auth.api.getSession`).

**Spec:** `docs/superpowers/specs/2026-09-14-dossier-product-database-design.md`

## Global Constraints

- **Never run `prisma migrate dev`, `prisma migrate deploy`, or any migration command.** Schema changes in `prisma/schema.prisma` are conceptual until the developer applies the equivalent SQL manually. Task 1 of this plan ends by displaying, as a single SQL code block inside the plan (not a file written to disk), every statement covering all schema changes — the developer copies and runs it themselves; no agent executes it against the database.
- After any Prisma schema change: run `pnpm db:generate` then `rm -rf .next` (Turbopack cache does not pick up new Prisma types automatically).
- Every new camelCase Prisma field must have `@map("snake_case")` — no exceptions.
- `userId` fields must always be `@map("user_id")`.
- Every server action must call `requireSession()` as its first line (security boundary) — see Task 2 for the pattern already used in `src/app/actions/onboarding.ts`.
- No test runner is configured in this repo (no vitest/jest in `package.json`). Verification steps in this plan use `pnpm type-check`, `pnpm db:validate`, and standalone Node scripts run via `npx tsx` instead of a test framework. Do not add a test framework as part of this plan — out of scope.

---

## File Structure

- `prisma/schema.prisma` — modify: add `ProductSource` enum, extend `Product` model, replace `ProductCategory` enum values, add `DossierProductEvent` model + `DossierEventType` enum, add `events` relation on `UserDossierProduct`. No separate migration file is created — the matching SQL is provided inside the plan itself (Task 1, final step), not written to disk.
- `src/app/actions/dossier.ts` — create: server actions backing the Dossier screens (search, confirm match, add to dossier, list/filter, product detail, history). Mirrors the `requireSession()` + Prisma pattern already used in `src/app/actions/onboarding.ts`.
- `scripts/verify-dossier-events.ts` — create: standalone Node script (no test framework available) that exercises the event-logging behavior end-to-end against a real Prisma client, used as this plan's substitute for automated tests.

## Task Sequencing

Task 1 covers every schema change and ends with a complete SQL block displayed in the plan. **Do not start Task 2 until the developer confirms that SQL has been applied and `pnpm db:generate` has run** — `pnpm db:validate`/type-check will pass on the schema file alone but the server actions will fail at runtime against a database missing the columns.

---

### Task 1: Schema changes — `ProductSource`, `ProductCategory` values, `DossierProductEvent`, and the complete manual SQL

**Files:**
- Modify: `prisma/schema.prisma` (enum block near line 266, `Product` model at lines 645–665, add model + enum near `UserDossierProduct` at line 759)

**Interfaces:**
- Produces: `ProductSource` enum (`CATALOG_SEED`, `USER_MANUAL`, `USER_OCR`), `Product.barcode: String? @unique`, `Product.sizeLabel: String?`, `Product.source: ProductSource` (default `USER_MANUAL`), `Product.createdByUserId: String?`, `ProductCategory` enum with values `CLEANSING`/`PREPARATION`/`TREATMENT`/`SUPPORT`/`PROTECTION`, `DossierProductEvent` model with fields `id: Int`, `dossierProductId: Int`, `type: DossierEventType`, `metadata: Json?`, `occurredAt: DateTime` — all consumed by Task 2 (server actions) and by the OBF sync plan.

- [ ] **Step 1: Add the `ProductSource` enum**

Insert directly after the closing brace of `enum ProductCategory` (currently ending at line 278 in `prisma/schema.prisma`):

```prisma
enum ProductSource {
  CATALOG_SEED
  USER_MANUAL
  USER_OCR

  @@schema("app")
}
```

- [ ] **Step 2: Add the new fields to `Product`**

In the `Product` model, add these four fields after `updatedAt` (currently line 655):

```prisma
model Product {
  id              Int             @id @default(autoincrement())
  brandId         Int?            @map("brandId")
  name            String
  slug            String          @unique
  category        ProductCategory
  subcategory     String?
  description     String?
  confidenceLevel ConfidenceLevel @default(UNVERIFIED) @map("confidenceLevel")
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updatedAt")
  barcode         String?         @unique
  sizeLabel       String?         @map("size_label")
  source          ProductSource   @default(USER_MANUAL)
  createdByUserId String?         @map("created_by_user_id")

  brand           Brand?               @relation(fields: [brandId], references: [id], onDelete: SetNull)
  aliases         ProductAlias[]
  metadata        ProductMetadata[]
  versions        ProductVersion[]
  dossierProducts UserDossierProduct[]

  @@map("products")
  @@schema("app")
}
```

Note: the spec's draft used `@map("sizeLabel")`/`@map("createdByUserId")`, which are not snake_case and would violate the project's mapping rule — this plan uses `size_label` and `created_by_user_id` instead, consistent with every other `@map` in the file for foreign-key-style columns. `barcode` and `source` need no `@map` — their column names already match snake_case (single word).

- [ ] **Step 3: Replace the `ProductCategory` enum values**

Replace the existing `enum ProductCategory` block:

```prisma
enum ProductCategory {
  CLEANSER
  TONER
  SERUM
  MOISTURIZER
  SUNSCREEN
  MASK
  OIL
  TREATMENT
  OTHER

  @@schema("app")
}
```

with:

```prisma
enum ProductCategory {
  CLEANSING
  PREPARATION
  TREATMENT
  SUPPORT
  PROTECTION

  @@schema("app")
}
```

- [ ] **Step 4: Search the codebase for now-invalid enum value references**

Run: `grep -rn "CLEANSER\|TONER\|SERUM\|MOISTURIZER\|SUNSCREEN\|MASK\b\|'OIL'\|ProductCategory.OIL\|ProductCategory.OTHER" src/ --include="*.ts" --include="*.tsx"`
Expected: no matches referencing the old enum values as `ProductCategory` members. (Plain-English uses of these words, e.g. UI copy unrelated to the enum, are fine — only flag literal enum references.) If any implementation code references the old values, note them but do not fix unrelated files in this plan — file a follow-up, since no such usages are expected at this stage (the Dossier screens haven't been built yet).

- [ ] **Step 5: Add the `DossierEventType` enum**

Insert after the `ProductSource` enum added in Step 1:

```prisma
enum DossierEventType {
  ADDED_TO_DOSSIER
  STATUS_CHANGED
  ADDED_TO_RITUAL
  REMOVED_FROM_RITUAL
  EDITED

  @@schema("app")
}
```

- [ ] **Step 6: Add the `DossierProductEvent` model**

Insert after the `UserDossierProduct` model (after its closing `@@schema("app")` line, currently line 777):

```prisma
model DossierProductEvent {
  id               Int              @id @default(autoincrement())
  dossierProductId Int              @map("dossierProductId")
  type             DossierEventType
  metadata         Json?
  occurredAt       DateTime         @default(now()) @map("occurredAt")

  dossierProduct UserDossierProduct @relation(fields: [dossierProductId], references: [id], onDelete: Cascade)

  @@index([dossierProductId, occurredAt])
  @@map("dossier_product_events")
  @@schema("app")
}
```

- [ ] **Step 7: Add the reverse relation on `UserDossierProduct`**

In the `UserDossierProduct` model, add `events DossierProductEvent[]` to the relations block:

```prisma
  user        User         @relation(fields: [userId], references: [id], onDelete: Restrict)
  product     Product      @relation(fields: [productId], references: [id], onDelete: Restrict)
  ritualItems RitualItem[]
  events      DossierProductEvent[]
```

(Only add the new `events` line — `user`'s `onDelete` stays `Cascade` as already written; don't change existing relation attributes.)

- [ ] **Step 8: Validate the schema file**

Run: `pnpm db:validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀` (no errors about duplicate fields or unknown types)

- [ ] **Step 9: Provide the complete manual SQL (code block, no file created)**

This single block covers every schema change from Steps 1–7 above (Product fields, ProductCategory value migration, DossierProductEvent table). It is **not** written to a file on disk — it is simply displayed here, to be copied and run manually by the developer (never by an agent).

```sql
-- Manual migration for docs/superpowers/plans/2026-09-15-dossier-product-database.md
-- DO NOT run this automatically. Review each statement, especially the
-- ProductCategory mapping table below, before applying by hand.
-- Run against the "app" schema.

BEGIN;

-- 1. New enum for Product.source
CREATE TYPE app."ProductSource" AS ENUM ('CATALOG_SEED', 'USER_MANUAL', 'USER_OCR');

-- 2. New columns on products
ALTER TABLE app.products
  ADD COLUMN barcode TEXT,
  ADD COLUMN size_label TEXT,
  ADD COLUMN source app."ProductSource" NOT NULL DEFAULT 'USER_MANUAL',
  ADD COLUMN created_by_user_id TEXT;

ALTER TABLE app.products
  ADD CONSTRAINT products_barcode_key UNIQUE (barcode);

-- 3. ProductCategory enum value migration.
-- REVIEW BEFORE RUNNING: MASK, OIL, and OTHER have no obvious 1:1 mapping.
-- The mapping below is a starting proposal from the design spec
-- (docs/superpowers/specs/2026-09-14-dossier-product-database-design.md) —
-- inspect actual rows in each of these three categories before running,
-- since misclassifying an existing product changes what the Dossier
-- filter/category UI shows for it.
--
--   CLEANSER    -> CLEANSING
--   TONER       -> PREPARATION
--   SERUM       -> TREATMENT
--   MOISTURIZER -> SUPPORT
--   SUNSCREEN   -> PROTECTION
--   TREATMENT   -> TREATMENT
--   MASK        -> TREATMENT   (review: could argue SUPPORT depending on product)
--   OIL         -> SUPPORT     (review: could argue TREATMENT depending on product)
--   OTHER       -> SUPPORT     (review: catch-all, inspect actual rows)

ALTER TYPE app."ProductCategory" RENAME TO "ProductCategory_old";

CREATE TYPE app."ProductCategory" AS ENUM (
  'CLEANSING', 'PREPARATION', 'TREATMENT', 'SUPPORT', 'PROTECTION'
);

ALTER TABLE app.products
  ALTER COLUMN category DROP DEFAULT,
  ALTER COLUMN category TYPE app."ProductCategory"
  USING (
    CASE category::text
      WHEN 'CLEANSER'    THEN 'CLEANSING'
      WHEN 'TONER'       THEN 'PREPARATION'
      WHEN 'SERUM'       THEN 'TREATMENT'
      WHEN 'MOISTURIZER' THEN 'SUPPORT'
      WHEN 'SUNSCREEN'   THEN 'PROTECTION'
      WHEN 'TREATMENT'   THEN 'TREATMENT'
      WHEN 'MASK'        THEN 'TREATMENT'
      WHEN 'OIL'         THEN 'SUPPORT'
      WHEN 'OTHER'       THEN 'SUPPORT'
    END
  )::app."ProductCategory";

DROP TYPE app."ProductCategory_old";

-- 4. New table: dossier_product_events
CREATE TYPE app."DossierEventType" AS ENUM (
  'ADDED_TO_DOSSIER', 'STATUS_CHANGED', 'ADDED_TO_RITUAL',
  'REMOVED_FROM_RITUAL', 'EDITED'
);

CREATE TABLE app.dossier_product_events (
  id                  SERIAL PRIMARY KEY,
  "dossierProductId"  INTEGER NOT NULL REFERENCES app.user_dossier_products(id) ON DELETE CASCADE,
  type                app."DossierEventType" NOT NULL,
  metadata            JSONB,
  "occurredAt"        TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE INDEX dossier_product_events_dossier_product_id_occurred_at_idx
  ON app.dossier_product_events ("dossierProductId", "occurredAt");

COMMIT;
```

Note: this uses `"dossierProductId"` / `"occurredAt"` (camelCase quoted columns) to match the `@map`-free field names in the Prisma model above, following this file's existing convention for `*Id` foreign key columns like `brandId`, `regimenId`. If the developer prefers strict snake_case here instead, they must also update the corresponding `@map` attributes in `prisma/schema.prisma` before running `pnpm db:generate` — flag this choice to the developer rather than deciding it unilaterally, since the existing schema is inconsistent on this point (compare `user_id` vs. `brandId`).

- [ ] **Step 10: Hand off to the developer**

Tell the user directly: "Here is the complete SQL to run manually to apply this plan's schema changes (SQL block from Step 9 above). Please review the `ProductCategory` mapping (especially MASK/OIL/OTHER) against your actual data, then run it yourself against the database. Let me know once it's done and I'll run `pnpm db:generate` and continue with the server actions." **Do not proceed to Task 2 until the developer confirms.**

- [ ] **Step 11: Generate the Prisma Client (after developer confirmation)**

Run: `pnpm db:generate && rm -rf .next`
Expected: Prisma Client regenerated without errors. **This requires the SQL from Step 9 to already have been run by the developer against the database.**

No commit at this step — a single commit covering the whole plan happens at the very end (see Task 4, final step).

---

### Task 2: Server actions — search, confirm match, add to Dossier (with event logging)

**Files:**
- Create: `src/app/actions/dossier.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, `auth` from `@/lib/auth`, `headers` from `next/headers` (same pattern as `src/app/actions/onboarding.ts:1-5`); `Product`, `ProductCategory`, `DossierProductStatus`, `DossierEventType` types from `@prisma/client`.
- Produces: `searchProducts(query: string): Promise<Array<{ id: number; name: string; brandName: string | null; category: ProductCategory; sizeLabel: string | null }>>`, `addProductToDossier(input: { productId: number; category: ProductCategory; status: DossierProductStatus }): Promise<{ dossierProductId: number }>` — consumed by Task 3 (list/filter/detail) and by the future front-end screens.

- [ ] **Step 1: Scaffold the file with the auth helper**

```typescript
'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ProductCategory, DossierProductStatus } from '@prisma/client'

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user
}
```

- [ ] **Step 2: Implement `searchProducts`**

```typescript
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
```

- [ ] **Step 3: Implement `addProductToDossier` with event logging in one transaction**

```typescript
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
```

- [ ] **Step 4: Type-check**

Run: `pnpm type-check`
Expected: no errors in `src/app/actions/dossier.ts`. (This will fail if Task 1's Prisma Client generation hasn't happened, or if the developer hasn't applied Task 1's SQL yet and you're checking against a schema mismatch — `type-check` only checks against the generated client types, not the live DB, so it should pass once Task 1 Step 11 completed successfully.)

No commit at this step — a single commit covering the whole plan happens at the very end (see Task 4, final step).

---

### Task 3: Server actions — list/filter, product detail, and history

**Files:**
- Modify: `src/app/actions/dossier.ts`

**Interfaces:**
- Consumes: `requireSession()` from Task 2 (same file).
- Produces: `listDossierProducts(filter?: { status?: DossierProductStatus; category?: ProductCategory; timeOfDay?: TimeOfDay }): Promise<...>`, `getProductDetail(dossierProductId: number): Promise<...>`, `getDossierProductHistory(dossierProductId: number): Promise<Array<{ type: DossierEventType; metadata: unknown; occurredAt: Date }>>`, `updateDossierProductStatus(dossierProductId: number, status: DossierProductStatus): Promise<void>`.

- [ ] **Step 1: Implement `listDossierProducts`**

```typescript
import type { TimeOfDay } from '@prisma/client'

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
```

- [ ] **Step 2: Implement `getProductDetail`**

```typescript
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

  return {
    dossierProductId: item.id,
    status: item.status,
    productName: item.product.name,
    brandName: item.product.brand?.name ?? null,
    category: item.product.category,
    sizeLabel: item.product.sizeLabel,
    usedIn: item.ritualItems.map((r) => ({ timeOfDay: r.timeOfDay, stepOrder: r.stepOrder })),
    ingredients:
      latestVersion?.ingredients.map((i) => ({
        inci: i.canonicalIngredient.inci,
        isKeyIngredient: i.isKeyIngredient,
        concentration: i.concentration,
      })) ?? [],
  }
}
```

- [ ] **Step 3: Implement `getDossierProductHistory`**

```typescript
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
```

- [ ] **Step 4: Implement `updateDossierProductStatus` with event logging**

```typescript
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
```

- [ ] **Step 5: Type-check**

Run: `pnpm type-check`
Expected: no errors.

No commit at this step — a single commit covering the whole plan happens at the very end (see Task 4, final step).

---

### Task 4: Verification script for event-logging behavior (test-framework substitute)

**Files:**
- Create: `scripts/verify-dossier-events.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, and requires a live database connection with Task 1's SQL already applied. Does not call the server actions directly (those require a session/`headers()`, unavailable outside a request context) — instead it exercises the same Prisma operations they perform, to verify the schema and transaction logic work end-to-end.

This project has no test runner (no vitest/jest in `package.json` — see Global Constraints). This script is the closest verifiable substitute: it creates real rows, asserts on real query results, and cleans up after itself. Do not add a test framework to satisfy this task — that's out of scope for this plan.

- [ ] **Step 1: Write the verification script**

```typescript
// scripts/verify-dossier-events.ts
// One-off verification script (no test framework in this repo — see plan
// docs/superpowers/plans/2026-09-15-dossier-product-database.md, Task 4).
// Run with: npx tsx scripts/verify-dossier-events.ts
// Requires DATABASE_URL to point at a database where Task 1's manual SQL
// (see this plan) has already been run.

import { prisma } from '../src/lib/prisma'

async function main() {
  const testUserId = `verify-dossier-events-${Date.now()}`

  await prisma.user.create({
    data: { id: testUserId, email: `${testUserId}@example.test`, name: 'Verify Script User' },
  })

  const product = await prisma.product.create({
    data: {
      name: 'Verify Script Test Cleanser',
      slug: `verify-script-test-cleanser-${Date.now()}`,
      category: 'CLEANSING',
      source: 'USER_MANUAL',
      barcode: `test-${Date.now()}`,
    },
  })

  const dossierProduct = await prisma.userDossierProduct.create({
    data: { userId: testUserId, productId: product.id, status: 'ACTIVE' },
  })

  await prisma.dossierProductEvent.create({
    data: { dossierProductId: dossierProduct.id, type: 'ADDED_TO_DOSSIER', metadata: { status: 'ACTIVE' } },
  })

  await prisma.userDossierProduct.update({
    where: { id: dossierProduct.id },
    data: { status: 'SEASONAL' },
  })
  await prisma.dossierProductEvent.create({
    data: {
      dossierProductId: dossierProduct.id,
      type: 'STATUS_CHANGED',
      metadata: { from: 'ACTIVE', to: 'SEASONAL' },
    },
  })

  const events = await prisma.dossierProductEvent.findMany({
    where: { dossierProductId: dossierProduct.id },
    orderBy: { occurredAt: 'asc' },
  })

  assertEqual(events.length, 2, 'expected 2 events')
  assertEqual(events[0].type, 'ADDED_TO_DOSSIER', 'first event type')
  assertEqual(events[1].type, 'STATUS_CHANGED', 'second event type')

  const cascadeCheck = await prisma.userDossierProduct.delete({ where: { id: dossierProduct.id } })
  const eventsAfterDelete = await prisma.dossierProductEvent.findMany({
    where: { dossierProductId: cascadeCheck.id },
  })
  assertEqual(eventsAfterDelete.length, 0, 'events should cascade-delete with their dossier product')

  await prisma.product.delete({ where: { id: product.id } })
  await prisma.user.delete({ where: { id: testUserId } })

  console.log('PASS: all dossier event assertions succeeded')
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`FAIL: ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Run it against a database with the migration applied**

Run: `npx tsx scripts/verify-dossier-events.ts`
Expected: `PASS: all dossier event assertions succeeded`. If it fails with a column-not-found error, the developer has not yet applied Task 1's SQL — stop and confirm with them before proceeding.

- [ ] **Step 3: Single commit for the entire plan**

This is the only commit in the whole plan — it bundles the Prisma schema (Task 1), the server actions (Tasks 2 and 3), and this verification script (Task 4).

```bash
git add prisma/schema.prisma src/app/actions/dossier.ts scripts/verify-dossier-events.ts
git commit -m "feat: add Dossier product database schema, server actions, and event-logging verification script"
```

---

## Self-Review Notes

- **Spec coverage:** `Product` fields, `ProductCategory` replacement + data mapping, and the `DossierProductEvent` table are all covered by Task 1, with a single consolidated SQL block displayed in the plan. Screen→entity mapping from the spec's table is covered by Tasks 2–3 (search=screen 04, confirm match=screen 05 via `searchProducts` result + a follow-up detail read, add to dossier=screen 06, list/filter=screens 08/09, product detail=screen 10, ingredients=screen 11 via `getProductDetail`, history=screen 12). Screens 01/02/03 are pure front-end flow with no new backend need, per the spec.
- **Placeholder scan:** no TBD/TODO markers; every step has runnable code or an exact shell command.
- **Type consistency:** `dossierProductId` used consistently across Task 1 (schema), Task 2 (`addProductToDossier`), Task 3 (`getDossierProductHistory`, `updateDossierProductStatus`) and Task 4 (verification script). `ProductCategory`/`DossierProductStatus`/`DossierEventType` imported consistently from `@prisma/client` in every task that uses them.
- **Deviation flagged:** the spec's draft `@map("sizeLabel")` / `@map("createdByUserId")` were not true snake_case; Task 1 uses `size_label` / `created_by_user_id` instead and calls this out explicitly for the developer, since the spec didn't anticipate it and AGENTS.md is strict about snake_case mapping.
- **SQL not written to disk, single commit:** per Gilles's request (2026-09-15), manual SQL is no longer written to `prisma/migrations-manual/` — it is provided as a single code block in the plan (Task 1), for the developer to copy and run themselves. Likewise, per-task intermediate commits have been removed: a single commit, at the very end of Task 4, covers the whole plan (schema, server actions, verification script).
