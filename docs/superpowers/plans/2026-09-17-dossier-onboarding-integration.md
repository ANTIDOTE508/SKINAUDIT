# Dossier Build Screens — Onboarding Integration & Post-Login Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the onboarding's step 25 placeholder ("Add your first product") with the real 6-screen "add a product to your Dossier" flow from the mockup (screens 02→07), track its progress and completion with new `UserProfile` fields, and add a post-login gate screen for users who finished onboarding but haven't added a product yet.

**Architecture:** `StepProducts.tsx` is replaced by a new `StepDossierBuild.tsx` container that manages its own internal screen state (1-6, mapped to mockup screens 02-07) without touching the parent wizard's `TOTAL_STEPS`/`SET_STEP`. Progress persists via a new `dossierStep` field (same anti-regression update pattern as `onboardingStep`). Reaching screen 07 sets `dossierCompletedAt` and finalizes onboarding in the same action. `src/app/studio/page.tsx` gains a branch: onboarding done + Dossier not done → render a new `DossierGate` component instead of `StudioShell`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma (Neon Postgres), React Server Actions (`'use server'`), GSAP (`gsap.context`), inline styles with CSS custom properties (no Tailwind in onboarding components), lucide-react icons.

**Spec:** `docs/superpowers/specs/2026-09-17-dossier-onboarding-integration-design.md`

## Global Constraints

- Never run `prisma migrate dev`/`deploy` or any migration command — schema changes are applied manually by Gilles via raw SQL. Just edit `schema.prisma`.
- After any Prisma schema change: run `pnpm db:generate` then `rm -rf .next`.
- All camelCase Prisma fields must have `@map("snake_case")`.
- Every server action must call `requireSession()` (or equivalent local helper) as its first line.
- GSAP code wrapped in `gsap.context()`, cleanup via `ctx.revert()`; capture `const node = ref.current` before any tween.
- Onboarding step components use **inline styles with CSS custom properties** (`var(--color-*)`, `var(--font-*)`), not Tailwind utility classes — follow `StepDossierIntro.tsx` / `StepProducts.tsx` conventions exactly, including the `btn-primary btn-primary-accent` class for primary CTAs.
- Screens 08→12 (permanent Dossier section) are **out of scope** for this plan.
- Scan / Enter-manually entry points stay disabled "coming soon", same treatment as today.
- Product images use a new `BottlePlaceholder` component (created in Task 1) — no real product photos.

---

## File Structure

- **Modify** `prisma/schema.prisma` — add `dossierStep`, `dossierCompletedAt` to `UserProfile`.
- **Create** `src/components/studio/BottlePlaceholder.tsx` — small SVG/gradient bottle placeholder, reused across screens 05/06/07.
- **Modify** `src/app/actions/dossier.ts` — add `updateDossierStep`, `getDossierBuildState`, `finalizeDossierBuild` server actions.
- **Create** `src/components/onboarding/dossierBuild/StepDossierBuild.tsx` — container managing internal screen state 1-6.
- **Create** `src/components/onboarding/dossierBuild/ScreenEmptyDossier.tsx` — mockup screen 02.
- **Create** `src/components/onboarding/dossierBuild/ScreenAddMethod.tsx` — mockup screen 03.
- **Create** `src/components/onboarding/dossierBuild/ScreenSearch.tsx` — mockup screen 04.
- **Create** `src/components/onboarding/dossierBuild/ScreenConfirmMatch.tsx` — mockup screen 05.
- **Create** `src/components/onboarding/dossierBuild/ScreenCategoryStatus.tsx` — mockup screen 06.
- **Create** `src/components/onboarding/dossierBuild/ScreenAdded.tsx` — mockup screen 07.
- **Modify** `src/components/onboarding/OnboardingWizard.tsx` — swap `StepProducts` for `StepDossierBuild` at `state.step === 25`, pass `initialDossierStep`.
- **Modify** `src/app/onboarding/page.tsx` — fetch and pass `dossierStep`.
- **Create** `src/components/studio/DossierGate.tsx` — 2-choice post-login gate screen.
- **Modify** `src/app/studio/page.tsx` — branch on `dossierCompletedAt`.
- **Delete** `src/components/onboarding/StepProducts.tsx` (superseded).

---

### Task 1: Schema fields + BottlePlaceholder component

**Files:**
- Modify: `prisma/schema.prisma:511-512`
- Create: `src/components/studio/BottlePlaceholder.tsx`
- Test: manual (type-check only, no DB round-trip in this task)

**Interfaces:**
- Produces: `UserProfile.dossierStep: number`, `UserProfile.dossierCompletedAt: Date | null` (Prisma Client fields, available after `pnpm db:generate`); `BottlePlaceholder(props: { size?: 'sm' | 'md' | 'lg' }): JSX.Element`

- [ ] **Step 1: Add the two fields to the Prisma schema**

Edit `prisma/schema.prisma`, right after line 512 (`onboardingCompletedAt`):

```prisma
  onboardingStep        Int              @default(0) @map("onboarding_step")
  onboardingCompletedAt DateTime?        @map("onboarding_completed_at")
  dossierStep           Int              @default(0) @map("dossier_step")
  dossierCompletedAt    DateTime?        @map("dossier_completed_at")
  createdAt             DateTime         @default(now()) @map("created_at")
```

- [ ] **Step 2: Regenerate the Prisma client and clear the Turbopack cache**

Run:
```bash
pnpm db:generate
rm -rf .next
```
Expected: command completes without error; `UserProfile` type in `@prisma/client` now includes `dossierStep` and `dossierCompletedAt`.

Do **not** run any `prisma migrate` command. Tell Gilles the raw SQL needed:
```sql
ALTER TABLE app.user_profiles
  ADD COLUMN dossier_step INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN dossier_completed_at TIMESTAMP(3) NULL;
```

- [ ] **Step 3: Create the BottlePlaceholder component**

Create `src/components/studio/BottlePlaceholder.tsx`:

```tsx
type Props = {
  size?: 'sm' | 'md' | 'lg'
}

const DIMENSIONS: Record<NonNullable<Props['size']>, { width: number; height: number }> = {
  sm: { width: 44, height: 64 },
  md: { width: 64, height: 92 },
  lg: { width: 96, height: 138 },
}

/**
 * Stand-in for a product photo until Product gains a real image field.
 * Renders a simple gradient bottle silhouette via inline SVG.
 */
export function BottlePlaceholder({ size = 'md' }: Props) {
  const { width, height } = DIMENSIONS[size]

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 92"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="bottle-placeholder-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-alabaster-400)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-alabaster-400)" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <rect x="24" y="4" width="16" height="10" rx="2" fill="url(#bottle-placeholder-gradient)" />
      <rect x="14" y="16" width="36" height="72" rx="6" fill="url(#bottle-placeholder-gradient)" />
    </svg>
  )
}
```

- [ ] **Step 4: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `BottlePlaceholder.tsx` or `schema.prisma`-derived types.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/components/studio/BottlePlaceholder.tsx
git commit -m "feat: add dossierStep/dossierCompletedAt fields and BottlePlaceholder component"
```

---

### Task 2: Dossier build server actions

**Files:**
- Modify: `src/app/actions/dossier.ts` (append after `updateDossierProductStatus`, line 195)
- Test: manual invocation via a temporary script or the Task 4 UI (no test runner is configured for server actions in this repo — verify by wiring into the UI in later tasks and exercising it manually)

**Interfaces:**
- Consumes: `requireSession()` (local helper, `dossier.ts:8-12`), `prisma.userProfile` model with `dossierStep`/`dossierCompletedAt` (from Task 1), `addProductToDossier` (existing, `dossier.ts:42-77`)
- Produces:
  - `updateDossierStep(step: number): Promise<void>`
  - `getDossierBuildState(): Promise<{ dossierStep: number; dossierCompletedAt: Date | null }>`
  - `finalizeDossierBuild(): Promise<void>`

- [ ] **Step 1: Add `updateDossierStep`**

Append to `src/app/actions/dossier.ts`:

```ts
export async function updateDossierStep(step: number) {
  const user = await requireSession()

  await prisma.userProfile.updateMany({
    where: { userId: user.id, dossierStep: { lt: step } },
    data: { dossierStep: step },
  })
}
```

- [ ] **Step 2: Add `getDossierBuildState`**

```ts
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
```

- [ ] **Step 3: Add `finalizeDossierBuild`**

This mirrors `completeOnboarding` in `onboarding.ts:1037-1049` but also stamps `dossierCompletedAt`, and is called once the user reaches screen 07 (has added at least one product):

```ts
export async function finalizeDossierBuild() {
  const user = await requireSession()

  await prisma.userProfile.updateMany({
    where: { userId: user.id },
    data: {
      dossierStep: 6,
      dossierCompletedAt: new Date(),
      onboardingStep: 25,
      onboardingCompletedAt: new Date(),
    },
  })
}
```

- [ ] **Step 4: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors in `src/app/actions/dossier.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/dossier.ts
git commit -m "feat: add dossier build progress and finalization server actions"
```

---

### Task 3: Screen components (02→06)

**Files:**
- Create: `src/components/onboarding/dossierBuild/ScreenEmptyDossier.tsx`
- Create: `src/components/onboarding/dossierBuild/ScreenAddMethod.tsx`
- Create: `src/components/onboarding/dossierBuild/ScreenSearch.tsx`
- Create: `src/components/onboarding/dossierBuild/ScreenConfirmMatch.tsx`
- Create: `src/components/onboarding/dossierBuild/ScreenCategoryStatus.tsx`

**Interfaces:**
- Consumes: `StepHeader` (`src/components/onboarding/StepHeader.tsx`, props `{eyebrow?, title, subtitle?}`), `BottlePlaceholder` (Task 1), `searchProducts(query: string)` from `dossier.ts:14-40` (returns `{id, name, brandName, category, sizeLabel}[]`), `ProductCategory`/`DossierProductStatus` types from `@prisma/client`
- Produces: five presentational components consumed by `StepDossierBuild` (Task 4). Each is a plain function component — no server actions called directly except `ScreenSearch` (calls `searchProducts`). Prop shapes below are exact and must match Task 4's usage.

- [ ] **Step 1: `ScreenEmptyDossier.tsx` (mockup screen 02)**

```tsx
'use client'

import { StepHeader } from '../StepHeader'
import { ArrowRight } from 'lucide-react'

type Props = {
  onAddProduct: () => void
}

export function ScreenEmptyDossier({ onAddProduct }: Props) {
  return (
    <div>
      <StepHeader title="Dossier" subtitle="Your Dossier is empty" />
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '0.875rem',
          lineHeight: 1.7,
          color: 'var(--color-alabaster-300)',
          textAlign: 'center',
          margin: '1rem 0 2.5rem',
        }}
      >
        Add your skincare products to get started. Products in your Dossier
        can be used in your rituals, but are not evaluated until they&apos;re
        assigned.
      </p>
      <button
        type="button"
        onClick={onAddProduct}
        className="btn-primary btn-primary-accent"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          width: '100%',
          minHeight: '58px',
          paddingInline: '1.5rem',
        }}
      >
        <span aria-hidden="true" style={{ width: 20, flexShrink: 0 }} />
        + Add Product
        <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" style={{ flexShrink: 0 }} />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: `ScreenAddMethod.tsx` (mockup screen 03)**

```tsx
'use client'

import { Search, Camera, Pencil } from 'lucide-react'
import { StepHeader } from '../StepHeader'

const ICON_SIZE = 26
const ICON_STROKE = 1.5

type Props = {
  onChooseSearch: () => void
}

export function ScreenAddMethod({ onChooseSearch }: Props) {
  return (
    <div>
      <StepHeader title="Add a product" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <button
          type="button"
          onClick={onChooseSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-accent-border)',
            backgroundColor: 'var(--color-surface)',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <Search size={ICON_SIZE} strokeWidth={ICON_STROKE} color="var(--color-sienna-400)" aria-hidden="true" />
          <span>
            <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-alabaster-100)' }}>
              Search
            </span>
            <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-alabaster-400)' }}>
              Find a product by brand or name.
            </span>
          </span>
        </button>

        <div
          aria-label="Scan — coming soon"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-accent-border)',
            backgroundColor: 'var(--color-surface)',
            opacity: 0.6,
          }}
        >
          <Camera size={ICON_SIZE} strokeWidth={ICON_STROKE} color="var(--color-sienna-400)" aria-hidden="true" />
          <span>
            <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-alabaster-100)' }}>
              Scan
            </span>
            <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-alabaster-400)' }}>
              Photograph the product or ingredient list. Coming soon.
            </span>
          </span>
        </div>

        <div
          aria-label="Enter manually — coming soon"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-accent-border)',
            backgroundColor: 'var(--color-surface)',
            opacity: 0.6,
          }}
        >
          <Pencil size={ICON_SIZE} strokeWidth={ICON_STROKE} color="var(--color-sienna-400)" aria-hidden="true" />
          <span>
            <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-alabaster-100)' }}>
              Enter manually
            </span>
            <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-alabaster-400)' }}>
              Add a product that isn&apos;t in our database. Coming soon.
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: `ScreenSearch.tsx` (mockup screen 04)**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { StepHeader } from '../StepHeader'
import { BottlePlaceholder } from '@/components/studio/BottlePlaceholder'
import { searchProducts } from '@/app/actions/dossier'

type SearchResult = Awaited<ReturnType<typeof searchProducts>>[number]

type Props = {
  onBack: () => void
  onSelectProduct: (product: SearchResult) => void
}

export function ScreenSearch({ onBack, onSelectProduct }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isPending, startTransition] = useTransition()

  const handleChange = (value: string) => {
    setQuery(value)
    startTransition(async () => {
      setResults(value.trim().length >= 2 ? await searchProducts(value) : [])
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1rem' }}
      >
        <ArrowLeft size={20} strokeWidth={1.5} color="var(--color-alabaster-300)" />
      </button>

      <StepHeader title="Find your product" />

      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search by brand or product name"
        style={{
          width: '100%',
          padding: '0.875rem 1rem',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-accent-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-alabaster-100)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9375rem',
          marginBottom: '1.25rem',
        }}
      />

      {isPending && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-alabaster-400)' }}>
          Searching…
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {results.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelectProduct(product)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.875rem',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-accent-border)',
              backgroundColor: 'var(--color-surface)',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <BottlePlaceholder size="sm" />
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-alabaster-400)' }}>
                {product.brandName ?? 'Unknown brand'}
              </span>
              <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-alabaster-100)' }}>
                {product.name}
              </span>
              {product.sizeLabel && (
                <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-alabaster-400)' }}>
                  {product.sizeLabel}
                </span>
              )}
            </span>
            <ChevronRight size={18} strokeWidth={1.5} color="var(--color-alabaster-400)" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: `ScreenConfirmMatch.tsx` (mockup screen 05)**

```tsx
'use client'

import { StepHeader } from '../StepHeader'
import { BottlePlaceholder } from '@/components/studio/BottlePlaceholder'

type Product = {
  id: number
  name: string
  brandName: string | null
  sizeLabel: string | null
}

type Props = {
  product: Product
  onConfirm: () => void
  onNotMyProduct: () => void
}

export function ScreenConfirmMatch({ product, onConfirm, onNotMyProduct }: Props) {
  return (
    <div>
      <StepHeader title="Is this your product?" />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.25rem',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-accent-border)',
          backgroundColor: 'var(--color-surface)',
          marginBottom: '0.75rem',
        }}
      >
        <BottlePlaceholder size="lg" />
        <span>
          <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-alabaster-400)' }}>
            {product.brandName ?? 'Unknown brand'}
          </span>
          <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-alabaster-100)' }}>
            {product.name}
          </span>
          {product.sizeLabel && (
            <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-alabaster-400)' }}>
              {product.sizeLabel}
            </span>
          )}
        </span>
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-alabaster-400)', margin: '0 0 2rem' }}>
        Packaging may vary.
      </p>

      <button
        type="button"
        onClick={onConfirm}
        className="btn-primary btn-primary-accent"
        style={{ width: '100%', minHeight: '52px', marginBottom: '0.75rem' }}
      >
        Yes, this is my product
      </button>
      <button
        type="button"
        onClick={onNotMyProduct}
        style={{
          width: '100%',
          minHeight: '52px',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-accent-border)',
          backgroundColor: 'transparent',
          color: 'var(--color-alabaster-200)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          cursor: 'pointer',
        }}
      >
        Not my product
      </button>
    </div>
  )
}
```

- [ ] **Step 5: `ScreenCategoryStatus.tsx` (mockup screen 06)**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { StepHeader } from '../StepHeader'
import { BottlePlaceholder } from '@/components/studio/BottlePlaceholder'
import type { ProductCategory, DossierProductStatus } from '@prisma/client'

type Product = {
  id: number
  name: string
  brandName: string | null
  sizeLabel: string | null
  category: ProductCategory
}

type Props = {
  product: Product
  onSubmit: (input: { category: ProductCategory; status: DossierProductStatus }) => Promise<void>
}

const STATUS_OPTIONS: { value: DossierProductStatus; label: string; description: string }[] = [
  { value: 'ACTIVE', label: 'Active', description: 'Currently using' },
  { value: 'SEASONAL', label: 'Seasonal', description: 'Used during certain periods' },
  { value: 'ARCHIVED', label: 'Archived', description: 'No longer using' },
]

export function ScreenCategoryStatus({ product, onSubmit }: Props) {
  const [category, setCategory] = useState<ProductCategory>(product.category)
  const [status, setStatus] = useState<DossierProductStatus>('ACTIVE')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    startTransition(async () => {
      await onSubmit({ category, status })
    })
  }

  return (
    <div>
      <StepHeader title="Add to your Dossier" />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-accent-border)',
          backgroundColor: 'var(--color-surface)',
          marginBottom: '1.5rem',
        }}
      >
        <BottlePlaceholder size="md" />
        <span>
          <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-alabaster-400)' }}>
            {product.brandName ?? 'Unknown brand'}
          </span>
          <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-alabaster-100)' }}>
            {product.name}
          </span>
        </span>
      </div>

      <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-alabaster-300)', marginBottom: '0.5rem' }}>
        Category
      </label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as ProductCategory)}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-accent-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-alabaster-100)',
          fontFamily: 'var(--font-body)',
          marginBottom: '1.5rem',
        }}
      >
        <option value="CLEANSING">Cleansing</option>
        <option value="PREPARATION">Preparation</option>
        <option value="TREATMENT">Treatment</option>
        <option value="SUPPORT">Support</option>
        <option value="PROTECTION">Protection</option>
      </select>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-alabaster-300)', marginBottom: '0.75rem' }}>
        Status
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '2rem' }}>
        {STATUS_OPTIONS.map((option) => (
          <label
            key={option.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-accent-border)',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="status"
              checked={status === option.value}
              onChange={() => setStatus(option.value)}
            />
            <span>
              <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-alabaster-100)' }}>
                {option.label}
              </span>
              <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-alabaster-400)' }}>
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="btn-primary btn-primary-accent"
        style={{ width: '100%', minHeight: '58px' }}
      >
        {isPending ? 'Adding…' : 'Add to Dossier'}
      </button>
    </div>
  )
}
```

- [ ] **Step 6: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors in the 5 new files (existing unrelated errors, if any, are out of scope).

- [ ] **Step 7: Commit**

```bash
git add src/components/onboarding/dossierBuild/ScreenEmptyDossier.tsx \
        src/components/onboarding/dossierBuild/ScreenAddMethod.tsx \
        src/components/onboarding/dossierBuild/ScreenSearch.tsx \
        src/components/onboarding/dossierBuild/ScreenConfirmMatch.tsx \
        src/components/onboarding/dossierBuild/ScreenCategoryStatus.tsx
git commit -m "feat: add Dossier build screens 02-06 (empty state through category/status)"
```

---

### Task 4: `ScreenAdded` + `StepDossierBuild` container

**Files:**
- Create: `src/components/onboarding/dossierBuild/ScreenAdded.tsx`
- Create: `src/components/onboarding/dossierBuild/StepDossierBuild.tsx`
- Delete: `src/components/onboarding/StepProducts.tsx`

**Interfaces:**
- Consumes: all 5 screens from Task 3, `updateDossierStep`/`finalizeDossierBuild` (Task 2), `addProductToDossier` (`dossier.ts:42-77`, signature `(input: {productId: number, category: ProductCategory, status: DossierProductStatus}) => Promise<{dossierProductId: number}>`)
- Produces: `StepDossierBuild(props: { initialDossierStep: number; onComplete: () => Promise<void> }): JSX.Element` — this is what `OnboardingWizard.tsx` renders in place of `StepProducts` (Task 5)

- [ ] **Step 1: `ScreenAdded.tsx` (mockup screen 07)**

```tsx
'use client'

import { Check, ArrowRight } from 'lucide-react'
import { BottlePlaceholder } from '@/components/studio/BottlePlaceholder'

type Props = {
  productName: string
  isFinishing: boolean
  onAddAnother: () => void
  onContinueToStudio: () => void
}

export function ScreenAdded({ productName, isFinishing, onAddAnother, onContinueToStudio }: Props) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        aria-hidden="true"
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '1px solid var(--color-accent-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}
      >
        <Check size={22} strokeWidth={1.5} color="var(--color-sienna-400)" />
      </div>

      <h2
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 300,
          fontSize: '1.5rem',
          color: 'var(--color-alabaster-50)',
          margin: '0 0 1.5rem',
        }}
      >
        Added to your Dossier
      </h2>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-accent-border)',
          backgroundColor: 'var(--color-surface)',
          textAlign: 'left',
          marginBottom: '2rem',
        }}
      >
        <BottlePlaceholder size="md" />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-alabaster-100)' }}>
          {productName}
        </span>
      </div>

      <button
        type="button"
        onClick={onAddAnother}
        disabled={isFinishing}
        style={{
          width: '100%',
          minHeight: '52px',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-accent-border)',
          backgroundColor: 'transparent',
          color: 'var(--color-alabaster-200)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          cursor: isFinishing ? 'default' : 'pointer',
          marginBottom: '0.75rem',
        }}
      >
        Add another product
      </button>

      <button
        type="button"
        onClick={onContinueToStudio}
        disabled={isFinishing}
        className="btn-primary btn-primary-accent"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          width: '100%',
          minHeight: '58px',
          paddingInline: '1.5rem',
        }}
      >
        <span aria-hidden="true" style={{ width: 20, flexShrink: 0 }} />
        {isFinishing ? 'Setting up your space…' : 'Continue to Studio'}
        <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" style={{ flexShrink: 0 }} />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: `StepDossierBuild.tsx` container**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { ScreenEmptyDossier } from './ScreenEmptyDossier'
import { ScreenAddMethod } from './ScreenAddMethod'
import { ScreenSearch } from './ScreenSearch'
import { ScreenConfirmMatch } from './ScreenConfirmMatch'
import { ScreenCategoryStatus } from './ScreenCategoryStatus'
import { ScreenAdded } from './ScreenAdded'
import { updateDossierStep, finalizeDossierBuild, addProductToDossier } from '@/app/actions/dossier'
import type { searchProducts } from '@/app/actions/dossier'
import type { ProductCategory, DossierProductStatus } from '@prisma/client'

type SearchResult = Awaited<ReturnType<typeof searchProducts>>[number]

// Internal screen numbers, matching dossierStep persistence (see spec §1):
// 1 = Empty Dossier, 2 = Add Method, 3 = Search, 4 = Confirm Match,
// 5 = Category & Status, 6 = Added.
type Screen = 1 | 2 | 3 | 4 | 5 | 6

type Props = {
  initialDossierStep: number
  onComplete: () => Promise<void>
}

export function StepDossierBuild({ initialDossierStep, onComplete }: Props) {
  const [screen, setScreen] = useState<Screen>(
    (Math.min(Math.max(initialDossierStep, 0), 5) + 1) as Screen
  )
  const [selectedProduct, setSelectedProduct] = useState<SearchResult | null>(null)
  const [isFinishing, setIsFinishing] = useState(false)
  const [, startTransition] = useTransition()

  const goTo = (next: Screen) => {
    setScreen(next)
    startTransition(async () => {
      await updateDossierStep(next - 1)
    })
  }

  const handleSubmitCategoryStatus = async (input: { category: ProductCategory; status: DossierProductStatus }) => {
    if (!selectedProduct) return
    await addProductToDossier({ productId: selectedProduct.id, ...input })
    goTo(6)
  }

  const handleContinueToStudio = async () => {
    setIsFinishing(true)
    try {
      await finalizeDossierBuild()
      await onComplete()
    } catch {
      setIsFinishing(false)
    }
  }

  switch (screen) {
    case 1:
      return <ScreenEmptyDossier onAddProduct={() => goTo(2)} />
    case 2:
      return <ScreenAddMethod onChooseSearch={() => goTo(3)} />
    case 3:
      return (
        <ScreenSearch
          onBack={() => goTo(2)}
          onSelectProduct={(product) => {
            setSelectedProduct(product)
            goTo(4)
          }}
        />
      )
    case 4:
      return selectedProduct ? (
        <ScreenConfirmMatch
          product={selectedProduct}
          onConfirm={() => goTo(5)}
          onNotMyProduct={() => goTo(3)}
        />
      ) : null
    case 5:
      return selectedProduct ? (
        <ScreenCategoryStatus product={selectedProduct} onSubmit={handleSubmitCategoryStatus} />
      ) : null
    case 6:
      return (
        <ScreenAdded
          productName={selectedProduct?.name ?? 'Your product'}
          isFinishing={isFinishing}
          onAddAnother={() => {
            setSelectedProduct(null)
            goTo(2)
          }}
          onContinueToStudio={handleContinueToStudio}
        />
      )
  }
}
```

- [ ] **Step 3: Delete the superseded placeholder**

```bash
rm src/components/onboarding/StepProducts.tsx
```

- [ ] **Step 4: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: errors appear in `OnboardingWizard.tsx` (still imports `StepProducts` — fixed in Task 5). No errors in the new `dossierBuild/` files themselves.

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/dossierBuild/ScreenAdded.tsx \
        src/components/onboarding/dossierBuild/StepDossierBuild.tsx
git rm src/components/onboarding/StepProducts.tsx
git commit -m "feat: add StepDossierBuild container and screen 07, remove StepProducts placeholder"
```

---

### Task 5: Wire `StepDossierBuild` into the wizard and onboarding page

**Files:**
- Modify: `src/components/onboarding/OnboardingWizard.tsx:24` (import), `:257-266` (props type), `:829-830` (render), `:348-351` (completion callback reused as-is)
- Modify: `src/app/onboarding/page.tsx:16-19` (select `dossierStep`), `:85-146` (pass new prop)

**Interfaces:**
- Consumes: `StepDossierBuild` (Task 4), `getDossierBuildState` not needed here (page.tsx queries Prisma directly like it already does for `onboardingStep`)
- Produces: `OnboardingWizard` now accepts `initialDossierStep?: number`

- [ ] **Step 1: Swap the import in `OnboardingWizard.tsx`**

Replace line 24:
```ts
import { StepProducts } from './StepProducts'
```
with:
```ts
import { StepDossierBuild } from './dossierBuild/StepDossierBuild'
```

- [ ] **Step 2: Add `initialDossierStep` to the component's props**

At `OnboardingWizard.tsx:257-266`, change:
```ts
export function OnboardingWizard({
  initialStep = 0,
  initialProfile,
}: {
  user?: WizardUser
  initialStep?: number
  initialProfile?: WizardInitialProfile | null
}) {
```
to:
```ts
export function OnboardingWizard({
  initialStep = 0,
  initialProfile,
  initialDossierStep = 0,
}: {
  user?: WizardUser
  initialStep?: number
  initialProfile?: WizardInitialProfile | null
  initialDossierStep?: number
}) {
```

- [ ] **Step 3: Swap the render at step 25**

Replace `OnboardingWizard.tsx:829-830`:
```tsx
{state.step === 25 && (
  <StepProducts onComplete={completeAndEnterStudio} />
)}
```
with:
```tsx
{state.step === 25 && (
  <StepDossierBuild initialDossierStep={initialDossierStep} onComplete={completeAndEnterStudio} />
)}
```

`completeAndEnterStudio` (line 348-351) is reused unchanged — it calls `completeOnboarding()` then `router.push('/studio')`. Since `finalizeDossierBuild` (Task 2) already sets `onboardingCompletedAt`, the follow-up `completeOnboarding()` call inside `completeAndEnterStudio` is a harmless no-op re-write of the same fields; leave it as-is to avoid touching wizard completion plumbing used elsewhere.

- [ ] **Step 4: Pass `dossierStep` from the onboarding page**

In `src/app/onboarding/page.tsx`, add `dossierStep: true` to the `select` block (after line 18 `onboardingCompletedAt: true,`):
```ts
    select: {
      onboardingStep: true,
      onboardingCompletedAt: true,
      dossierStep: true,
```

Then pass it to the wizard — change the closing of the component call (around line 145) from:
```tsx
      }
    />
  )
}
```
to:
```tsx
      }
      initialDossierStep={profile?.dossierStep ?? 0}
    />
  )
}
```

- [ ] **Step 5: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual verification**

Run `pnpm dev`, sign in as a test user with `onboardingStep` at 24 (or walk through onboarding to step 24), confirm:
- Step 25 now renders the Empty Dossier screen (not the old 3-card placeholder).
- Searching a real product (any seeded OBF product name) returns results.
- Completing the flow (confirm → category/status → Added → Continue to Studio) redirects to `/studio`.

- [ ] **Step 7: Commit**

```bash
git add src/components/onboarding/OnboardingWizard.tsx src/app/onboarding/page.tsx
git commit -m "feat: wire StepDossierBuild into onboarding wizard step 25"
```

---

### Task 6: Post-login `DossierGate` screen

**Files:**
- Create: `src/components/studio/DossierGate.tsx`
- Modify: `src/app/studio/page.tsx`

**Interfaces:**
- Consumes: `dossierCompletedAt` field (Task 1), `StudioShell` (existing, `src/components/studio/StudioShell.tsx`)
- Produces: `DossierGate(props: { userName: string | null }): JSX.Element`, rendered by `studio/page.tsx` as an alternative to `StudioShell`

- [ ] **Step 1: Create `DossierGate.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

type Props = {
  userName: string | null
}

export function DossierGate({ userName }: Props) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: 'var(--color-obsidian-950)',
      }}
    >
      <div style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            color: 'var(--color-alabaster-50)',
            margin: '0 0 0.75rem',
          }}
        >
          Welcome back{userName ? `, ${userName}` : ''}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.9375rem',
            color: 'var(--color-alabaster-300)',
            margin: '0 0 2.5rem',
          }}
        >
          Where would you like to go?
        </p>

        <Link
          href="/onboarding"
          className="btn-primary btn-primary-accent"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            width: '100%',
            minHeight: '58px',
            paddingInline: '1.5rem',
            marginBottom: '0.875rem',
            textDecoration: 'none',
          }}
        >
          <span aria-hidden="true" style={{ width: 20, flexShrink: 0 }} />
          Go to Dossier
          <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" style={{ flexShrink: 0 }} />
        </Link>

        <Link
          href="/studio?skipGate=1"
          style={{
            display: 'block',
            width: '100%',
            minHeight: '52px',
            lineHeight: '52px',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-accent-border)',
            color: 'var(--color-alabaster-200)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            textDecoration: 'none',
          }}
        >
          Go to Studio
        </Link>
      </div>
    </div>
  )
}
```

`"Go to Dossier"` links to `/onboarding`, which (per Task 5's `resumeStep` logic, unchanged) resumes the wizard at step 25 for a user whose `onboardingStep` is already 25 — landing back in `StepDossierBuild` at the correct internal screen via `initialDossierStep`.

- [ ] **Step 2: Update `studio/page.tsx`**

Replace the full file:

```tsx
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StudioShell } from '@/components/studio/StudioShell'
import { DossierGate } from '@/components/studio/DossierGate'

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ skipGate?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user?.id) {
    redirect('/signin')
  }

  const user = {
    name: session.user.name ?? null,
    email: session.user.email,
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      onboardingCompletedAt: true,
      dossierCompletedAt: true,
    },
  })

  // Onboarding is complete only when onboardingCompletedAt is set
  if (!profile?.onboardingCompletedAt) {
    redirect('/onboarding')
  }

  const { skipGate } = await searchParams

  // Onboarding done, Dossier build not done yet: show the entry gate unless
  // the user explicitly chose "Go to Studio" from it (skipGate=1).
  if (!profile.dossierCompletedAt && skipGate !== '1') {
    return <DossierGate userName={user.name} />
  }

  return <StudioShell user={user} />
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification**

With `pnpm dev` running:
1. A user with `onboardingCompletedAt` set and `dossierCompletedAt` null visiting `/studio` sees `DossierGate`.
2. Clicking "Go to Dossier" lands back in the onboarding wizard at the Dossier build sub-flow.
3. Clicking "Go to Studio" renders `StudioShell` (via `?skipGate=1`), and revisiting `/studio` plainly (no query param) shows the gate again — confirms the gate reappears until the Dossier is actually completed, not just skipped once.
4. A user with both timestamps set sees `StudioShell` directly, no gate, regardless of query param.

- [ ] **Step 5: Commit**

```bash
git add src/components/studio/DossierGate.tsx src/app/studio/page.tsx
git commit -m "feat: add post-login DossierGate for completed onboarding, incomplete Dossier"
```

---

## Self-Review Notes

- **Spec coverage:** schema fields (Task 1), screens 02-07 (Tasks 3-4), resume via `dossierStep` (Task 4 step 1 + Task 5), finalization semantics (Task 2 step 3), post-login gate with permanent dismissal only on real completion (Task 6). All spec sections have a corresponding task.
- **Type consistency:** `updateDossierStep(step: number)` used consistently in `StepDossierBuild` (`goTo`) with `next - 1` to match the 0-6 `dossierStep` encoding from the spec; `finalizeDossierBuild` sets `dossierStep: 6` to keep the persisted value consistent with "screen 07 reached" even though the UI has already moved on.
- **Out of scope confirmed:** no task touches screens 08-12; `DossierGate`'s "Go to Dossier" link intentionally routes back into onboarding (the only implemented surface), not a dedicated `/dossier` route, since that section doesn't exist yet.
