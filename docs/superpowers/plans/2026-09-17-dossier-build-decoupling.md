# Decouple Dossier Build from Onboarding Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Dossier build sub-flow (`StepDossierBuild`, screens 02→07) out of the onboarding wizard's step 25 and into its own route `/dossier/build`, restoring `onboardingCompletedAt` to mean only "profile complete" (end of step 24) instead of "profile complete AND first product added".

**Architecture:** `OnboardingWizard.tsx` drops step 25 entirely (`TOTAL_STEPS` 25→24); its last step (24, `StepDossierIntro`) now finalizes the profile and navigates to the new route instead of advancing to a wizard step. The new route's server component redirects appropriately (incomplete profile → `/onboarding`, Dossier already done → `/studio`) and renders `StepDossierBuild` — unchanged internally — inside a new lightweight chrome component that mirrors the wizard's visual shell minus the step counter. `finalizeDossierBuild` drops the `onboardingStep`/`onboardingCompletedAt` fields it no longer owns. `DossierGate` and `onboarding/page.tsx` shed the `?dossier=1` escape-hatch machinery that only existed because of the old coupling.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma (Neon Postgres), React Server Actions (`'use server'`), inline styles with CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-09-17-dossier-build-decoupling-design.md`

## Global Constraints

- Never run `prisma migrate dev`/`deploy` or any migration command — this plan makes no schema changes, so this constraint has no effect here, but no task may introduce one.
- `StepDossierBuild.tsx` and its 6 screen components (`ScreenEmptyDossier`, `ScreenAddMethod`, `ScreenSearch`, `ScreenConfirmMatch`, `ScreenCategoryStatus`, `ScreenAdded`) are **not modified** — their prop contracts (`{initialDossierStep, onComplete}`) are already correct for the new caller.
- Every server action must call `requireSession()` (or the file's equivalent local helper) as its first line.
- Onboarding-family step components use inline styles with CSS custom properties (`var(--color-*)`, `var(--font-*)`), not Tailwind — the new `DossierBuildShell` component must follow this convention, matching `OnboardingWizard.tsx`'s outer chrome styling exactly (same background, header treatment).
- No data migration — this branch is unmerged, no production rows exist under the old semantics.

---

## File Structure

- **Modify** `src/app/actions/onboarding.ts` — replace `acknowledgeDossierIntro()` and `completeOnboarding()` with a single `completeProfile()`.
- **Modify** `src/app/actions/dossier.ts` — `finalizeDossierBuild()` drops `onboardingStep`/`onboardingCompletedAt` from its update payload.
- **Modify** `src/components/onboarding/StepDossierIntro.tsx` — `handleContinue` calls `completeProfile()` then navigates to `/dossier/build`; `onContinue` prop removed (no longer needed), `onBack` stays.
- **Modify** `src/components/onboarding/OnboardingWizard.tsx` — `TOTAL_STEPS` 25→24, remove `StepDossierBuild` import/render/`completeAndEnterStudio`, update `StepDossierIntro`'s render call.
- **Modify** `src/app/onboarding/page.tsx` — drop `searchParams`/`dossier` handling, simplify the redirect guard back to unconditional.
- **Create** `src/components/dossierBuild/DossierBuildShell.tsx` — new chrome wrapper (background/header, no step counter) hosting `StepDossierBuild`.
- **Create** `src/app/dossier/build/page.tsx` — new route: auth + redirect guards, renders `DossierBuildShell`.
- **Modify** `src/components/studio/DossierGate.tsx` — "Go to Dossier" link target changes from `/onboarding?dossier=1` to `/dossier/build`.

---

### Task 1: Split `completeProfile` out of the onboarding actions, update `finalizeDossierBuild`

**Files:**
- Modify: `src/app/actions/onboarding.ts:982-997` (delete `acknowledgeDossierIntro`), `:1036-1049` (delete `completeOnboarding`), add `completeProfile` in their place
- Modify: `src/app/actions/dossier.ts:220-231` (`finalizeDossierBuild` payload)

**Interfaces:**
- Consumes: `requireSession()` (local helper already defined in each file), `prisma.userProfile`
- Produces: `completeProfile(): Promise<{ok: true}>` in `src/app/actions/onboarding.ts` — consumed by Task 3 (`StepDossierIntro.tsx`)

- [ ] **Step 1: Replace `acknowledgeDossierIntro`/`completeOnboarding` with `completeProfile`**

In `src/app/actions/onboarding.ts`, find this block (currently lines 982-997):
```ts
// ─── Step 24 — Dossier intro ──────────────────────────────────
/**
 * Like the interpretation screen, this one carries no user input —
 * acknowledging it only advances the resume marker so returning users land
 * on the product picker instead of re-reading the intro.
 */
export async function acknowledgeDossierIntro() {
  const user = await requireSession()

  await prisma.userProfile.updateMany({
    where: { userId: user.id, onboardingStep: { lt: 24 } },
    data: { onboardingStep: 24 },
  })

  return { ok: true }
}
```
Replace it with:
```ts
// ─── Step 24 — Dossier intro / profile completion ─────────────
/**
 * Step 24 is the wizard's final step. Continuing from it both advances the
 * resume marker and marks the profile complete — there is no trailing
 * completion screen, and the Dossier build that follows is a separate
 * workflow (see /dossier/build), not part of onboarding.
 */
export async function completeProfile() {
  const user = await requireSession()

  await prisma.userProfile.updateMany({
    where: { userId: user.id },
    data: {
      onboardingStep: 24,
      onboardingCompletedAt: new Date(),
    },
  })

  return { ok: true }
}
```

Then find the old `completeOnboarding` block (currently lines 1036-1049):
```ts
// ─── Complete onboarding ───────────────────────────────────────
export async function completeOnboarding() {
  const user = await requireSession()

  await prisma.userProfile.updateMany({
    where: { userId: user.id },
    data: {
      onboardingStep: 25,
      onboardingCompletedAt: new Date(),
    },
  })

  return { ok: true }
}
```
Delete it entirely (no replacement — `completeProfile` now covers this).

- [ ] **Step 2: Update `finalizeDossierBuild`'s payload**

In `src/app/actions/dossier.ts`, change:
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
to:
```ts
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
```

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: errors will appear in `src/components/onboarding/StepDossierIntro.tsx` (still imports the now-deleted `acknowledgeDossierIntro`) and `src/components/onboarding/OnboardingWizard.tsx` (still imports the now-deleted `completeOnboarding`) — these are expected and fixed in Tasks 2-3. No errors should appear in `onboarding.ts` or `dossier.ts` themselves.

- [ ] **Step 4: Commit**

```bash
git add src/app/actions/onboarding.ts src/app/actions/dossier.ts
git commit -m "refactor: replace acknowledgeDossierIntro/completeOnboarding with completeProfile"
```

---

### Task 2: Update `StepDossierIntro` to finalize the profile and navigate to `/dossier/build`

**Files:**
- Modify: `src/components/onboarding/StepDossierIntro.tsx`

**Interfaces:**
- Consumes: `completeProfile()` from `@/app/actions/onboarding` (Task 1)
- Produces: `StepDossierIntro({onBack}: {onBack: () => void})` — the `onContinue` prop is removed; Task 3 updates the only call site

- [ ] **Step 1: Update the import and the component's props/logic**

In `src/components/onboarding/StepDossierIntro.tsx`, change the import (currently line 8):
```ts
import { acknowledgeDossierIntro } from '@/app/actions/onboarding'
```
to:
```ts
import { useRouter } from 'next/navigation'
import { completeProfile } from '@/app/actions/onboarding'
```

Change the `Props` type (currently lines 10-13):
```ts
type Props = {
  onContinue: () => void
  onBack: () => void
}
```
to:
```ts
type Props = {
  onBack: () => void
}
```

Change the component signature (currently line 19):
```ts
export function StepDossierIntro({ onContinue, onBack }: Props) {
```
to:
```ts
export function StepDossierIntro({ onBack }: Props) {
```

Add a router instance right after the existing state declarations (after the `const [mounted, setMounted] = useState(false)` line):
```ts
  const router = useRouter()
```

Change `handleContinue` (currently lines 53-63):
```ts
  const handleContinue = () => {
    setError(null)
    startTransition(async () => {
      try {
        await acknowledgeDossierIntro()
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }
```
to:
```ts
  const handleContinue = () => {
    setError(null)
    startTransition(async () => {
      try {
        await completeProfile()
        router.push('/dossier/build')
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: the `StepDossierIntro.tsx` error from Task 1 is now resolved. A new error will appear in `OnboardingWizard.tsx` at its `StepDossierIntro` render call (still passes an `onContinue` prop that no longer exists) — expected, fixed in Task 3. The pre-existing `completeOnboarding` import error in `OnboardingWizard.tsx` from Task 1 also still shows — also fixed in Task 3.

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/StepDossierIntro.tsx
git commit -m "feat: finalize profile and navigate to /dossier/build from step 24"
```

---

### Task 3: Remove step 25 from the wizard, drop `TOTAL_STEPS` to 24

**Files:**
- Modify: `src/components/onboarding/OnboardingWizard.tsx`

**Interfaces:**
- Consumes: `StepDossierIntro({onBack})` (Task 2's new signature)
- Produces: `OnboardingWizard` still accepts `initialDossierStep?: number` after this task (removed in Task 5) — this task only removes step-25 rendering, not the prop itself

- [ ] **Step 1: Remove the `StepDossierBuild` import**

Delete this line (currently line 24):
```ts
import { StepDossierBuild } from './dossierBuild/StepDossierBuild'
```

- [ ] **Step 2: Remove the `completeOnboarding` import**

Delete this line (currently line 6):
```ts
import { completeOnboarding } from '@/app/actions/onboarding'
```

- [ ] **Step 3: Change `TOTAL_STEPS`**

Change (currently line 208):
```ts
const TOTAL_STEPS = 25
```
to:
```ts
const TOTAL_STEPS = 24
```

- [ ] **Step 4: Remove `completeAndEnterStudio`**

Delete this block entirely (currently lines 347-354):
```ts
  // The Dossier build sub-flow is the final step, so it — not a trailing
  // completion screen — is what marks onboarding complete and hands the user
  // to the Studio. See StepDossierBuild for its own error handling around
  // finalization.
  const completeAndEnterStudio = useCallback(async () => {
    await completeOnboarding()
    router.push('/studio')
  }, [router])
```

`router` (from `useRouter()`, declared just above this block as `const router = useRouter()`) has no other usage anywhere else in this file — confirmed by grep before this plan was written. Remove that declaration too, and remove the now-unused `import { useRouter } from 'next/navigation'` line as well.

- [ ] **Step 5: Update the step 24 render and remove the step 25 render**

Change (currently lines 828-834):
```ts
          {state.step === 24 && (
            <StepDossierIntro onContinue={goNext} onBack={goBack} />
          )}

          {state.step === 25 && (
            <StepDossierBuild initialDossierStep={initialDossierStep} onComplete={completeAndEnterStudio} />
          )}
```
to:
```ts
          {state.step === 24 && (
            <StepDossierIntro onBack={goBack} />
          )}
```

- [ ] **Step 6: Check for unused props**

Search the file for `initialDossierStep` — after Step 5, it should have no remaining usages in the render logic (it was only ever passed to `StepDossierBuild`). Do NOT remove the `initialDossierStep` prop from the component's props destructuring/type yet — that's Task 5's job, since `onboarding/page.tsx` still passes it until that task runs, and removing it here first would cause a type error (`page.tsx` passing a prop the component no longer declares). This project's `tsconfig.json` has neither `noUnusedParameters` nor `noUnusedLocals` set, so the now-unused `initialDossierStep` value causes no type-check error in this task — it will be cleanly removed in Task 5.

- [ ] **Step 7: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors in `OnboardingWizard.tsx` or `StepDossierIntro.tsx`. An error may still appear in `src/app/onboarding/page.tsx` if it references anything now removed — expected, fixed in Task 4.

- [ ] **Step 8: Commit**

```bash
git add src/components/onboarding/OnboardingWizard.tsx
git commit -m "refactor: remove Dossier build sub-flow from onboarding wizard, TOTAL_STEPS 25->24"
```

---

### Task 4: New route `/dossier/build` with `DossierBuildShell` chrome

**Files:**
- Create: `src/components/dossierBuild/DossierBuildShell.tsx`
- Create: `src/app/dossier/build/page.tsx`

**Interfaces:**
- Consumes: `StepDossierBuild({initialDossierStep, onComplete})` (unchanged, `src/components/onboarding/dossierBuild/StepDossierBuild.tsx`), `prisma.userProfile` fields `onboardingCompletedAt`/`dossierStep`/`dossierCompletedAt`
- Produces: `DossierBuildShell({initialDossierStep: number}): JSX.Element` — client component, owns navigation to `/studio` on completion internally (no prop needed from the page for this, since `useRouter` is available inside client components)

- [ ] **Step 1: Create `DossierBuildShell.tsx`**

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { StepDossierBuild } from '@/components/onboarding/dossierBuild/StepDossierBuild'
import { OnboardingSignOut } from '@/components/onboarding/OnboardingSignOut'

type Props = {
  initialDossierStep: number
}

/**
 * Chrome for the standalone Dossier build route — mirrors OnboardingWizard's
 * outer shell (background, header) minus the step-progress counter, since
 * this is no longer a wizard step.
 */
export function DossierBuildShell({ initialDossierStep }: Props) {
  const router = useRouter()

  const onComplete = async () => {
    router.push('/studio')
  }

  return (
    <div
      style={{
        height: '100dvh',
        backgroundColor: 'var(--color-obsidian-950)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `
            radial-gradient(circle at 10% 90%, rgba(184,134,61,0.05) 0%, transparent 50%),
            radial-gradient(circle at 90% 10%, rgba(184,134,61,0.04) 0%, transparent 45%)
          `,
        }}
      />

      <header
        style={{
          position: 'relative', zIndex: 10,
          padding: 'clamp(1.25rem, 3vw, 2rem) clamp(1.5rem, 5vw, 4rem)',
          display: 'flex', alignItems: 'center', gap: '2rem',
          borderBottom: '1px solid rgba(184,134,61,0.1)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '11px', fontWeight: 300, letterSpacing: '0.24em',
            color: 'var(--color-alabaster-400)', textTransform: 'uppercase', flexShrink: 0,
          }}
        >
          S K I N A U D I T
        </span>

        <OnboardingSignOut />
      </header>

      <main
        style={{
          position: 'relative', zIndex: 10, flex: 1,
          display: 'flex', alignItems: 'safe center', justifyContent: 'center',
          padding: 'clamp(1rem, 3vh, 2.5rem) clamp(1.5rem, 5vw, 4rem)',
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: '680px' }}>
          <StepDossierBuild initialDossierStep={initialDossierStep} onComplete={onComplete} />
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create the route `src/app/dossier/build/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DossierBuildShell } from '@/components/dossierBuild/DossierBuildShell'

export default async function DossierBuildPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user?.id) {
    redirect('/signin')
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      onboardingCompletedAt: true,
      dossierStep: true,
      dossierCompletedAt: true,
    },
  })

  if (!profile?.onboardingCompletedAt) {
    redirect('/onboarding')
  }

  if (profile.dossierCompletedAt) {
    redirect('/studio')
  }

  return <DossierBuildShell initialDossierStep={profile.dossierStep} />
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors in either new file.

- [ ] **Step 4: Commit**

```bash
git add src/components/dossierBuild/DossierBuildShell.tsx src/app/dossier/build/page.tsx
git commit -m "feat: add standalone /dossier/build route with DossierBuildShell chrome"
```

---

### Task 5: Simplify `onboarding/page.tsx`, update `DossierGate`, remove `initialDossierStep` from the wizard

**Files:**
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/components/studio/DossierGate.tsx`
- Modify: `src/components/onboarding/OnboardingWizard.tsx` (remove now-unused `initialDossierStep` prop, deferred from Task 3)

**Interfaces:**
- Consumes: `OnboardingWizard`'s props type (Task 3 left `initialDossierStep` in place; this task removes it)
- Produces: none new — this task removes the `?dossier=1` escape hatch and its now-dead plumbing

- [ ] **Step 1: Simplify `onboarding/page.tsx`'s redirect guard**

Change the function signature (currently lines 7-11):
```ts
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ dossier?: string }>
}) {
```
to:
```ts
export default async function OnboardingPage() {
```

Remove this line (currently line 18):
```ts
  const { dossier } = await searchParams
```

Remove `dossierStep: true,` from the Prisma `select` block (currently line 25) — it's no longer read anywhere in this file once `initialDossierStep` is removed from the `OnboardingWizard` call below.

Change the redirect guard (currently lines 60-65):
```ts
  // Onboarding is complete only when onboardingCompletedAt is set. The
  // `dossier=1` escape hatch lets DossierGate's "Go to Dossier" link resume
  // the Dossier build sub-flow (step 25) instead of bouncing back to Studio.
  if (profile?.onboardingCompletedAt && dossier !== '1') {
    redirect('/studio')
  }
```
to:
```ts
  // Onboarding is complete only when onboardingCompletedAt is set
  if (profile?.onboardingCompletedAt) {
    redirect('/studio')
  }
```

Remove the `initialDossierStep={profile?.dossierStep ?? 0}` prop from the `<OnboardingWizard ... />` call at the end of the file (currently line 154, right before the closing `/>`).

- [ ] **Step 2: Remove `initialDossierStep` from `OnboardingWizard`'s props**

In `src/components/onboarding/OnboardingWizard.tsx`, find the component's props (from Task 3's Step 6, this prop was left in place):
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
Remove `initialDossierStep = 0,` from the destructuring and `initialDossierStep?: number` from the type, leaving:
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

- [ ] **Step 3: Update `DossierGate`'s "Go to Dossier" link**

In `src/components/studio/DossierGate.tsx`, change (currently line 48):
```tsx
        <Link
          href="/onboarding?dossier=1"
```
to:
```tsx
        <Link
          href="/dossier/build"
```

- [ ] **Step 4: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: fully clean, zero errors.

- [ ] **Step 5: Manual verification**

Run `pnpm dev`. With a test account:
1. Walk onboarding to step 24, click "Fill My Dossier" — should land on `/dossier/build` showing the Empty Dossier screen (or wherever `dossierStep` resumes), NOT back inside `/onboarding`.
2. Visit `/onboarding` directly with a profile that has `onboardingCompletedAt` set — should redirect straight to `/studio` (no `?dossier=1` param involved anymore).
3. From `/studio` showing `DossierGate` (profile complete, Dossier not complete), click "Go to Dossier" — should land on `/dossier/build`, not bounce through `/onboarding`.
4. Visit `/dossier/build` directly with `dossierCompletedAt` already set — should redirect to `/studio`.
5. Visit `/dossier/build` directly with `onboardingCompletedAt` still null — should redirect to `/onboarding`.

- [ ] **Step 6: Commit**

```bash
git add src/app/onboarding/page.tsx src/components/onboarding/OnboardingWizard.tsx src/components/studio/DossierGate.tsx
git commit -m "refactor: remove dossier=1 escape hatch, point DossierGate at /dossier/build"
```

---

## Self-Review Notes

- **Spec coverage:** all 7 sections of the spec (redefinition, wizard change, chrome, unchanged fields, DossierGate simplification, resume, non-goals) map to a task. `finalizeDossierBuild`'s updated payload (spec §5) is Task 1; `DossierGate`/`onboarding/page.tsx` cleanup (spec §6) is Task 5.
- **Type consistency:** `StepDossierBuild({initialDossierStep, onComplete})` used identically in both its old caller (removed, Task 3) and new caller (`DossierBuildShell`, Task 4) — no signature drift, since the component itself is untouched per Global Constraints.
- **Ordering rationale:** Tasks 1-3 sequentially break and fix `tsc` errors across 3 files in a chain (`onboarding.ts` → `StepDossierIntro.tsx` → `OnboardingWizard.tsx`) — each task's "expected errors" note tells the next task's implementer what they're walking into, so a fresh implementer isn't alarmed by pre-existing red ink that isn't theirs to fix. Task 4 is fully independent (new files only) and could run in parallel with 1-3, but is sequenced after them here for simplicity; Task 5 depends on Task 3 (removing `initialDossierStep`) and Task 4 (route must exist before `DossierGate` links to it) and closes out all remaining loose ends in one pass.
