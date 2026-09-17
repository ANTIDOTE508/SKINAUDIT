# Decouple Dossier build from onboarding wizard

Date: 2026-09-17
Status: Approved by Gilles

## Context

The previous chantier (`2026-09-17-dossier-onboarding-integration-design.md`, already
implemented and merged into this branch) replaced the onboarding wizard's step 25
placeholder with a real 6-screen "add your first product" flow (`StepDossierBuild`,
screens 02→07 of the `templates/buildDossier/` mockup), and made `onboardingCompletedAt`
fire only once that flow completes (i.e. after the user's first product is added).

During manual testing, Gilles observed the onboarding wizard resuming directly on the
"Add a product" screen (mockup 03) at `25/25` — technically correct per that design, but
flagged a real architectural problem: **the Dossier-build workflow is not onboarding**.
The spec itself already said as much ("Screens 01→07 = the one-time add-first-product
flow... distinct from the permanent Dossier section"), yet the implementation nested it
inside `OnboardingWizard` and overloaded `onboardingCompletedAt` to mean two different
things depending on context: "finished the 24 profile questions" in every other reading
of that field elsewhere in the codebase, and "finished the 24 questions AND added a
product" as actually implemented. That's a latent bug magnet — anything else that reads
`onboardingCompletedAt` expecting "profile complete" would be wrong.

This chantier corrects that: Dossier build becomes its own route and its own workflow,
`onboardingCompletedAt` reverts to meaning only "profile complete" (end of step 24).

## Decisions

1. **`onboardingCompletedAt` redefined**: fires at the end of step 24
   (`StepDossierIntro`), not at the end of the Dossier build flow. `TOTAL_STEPS` in
   `OnboardingWizard.tsx` becomes `24`.
2. **New route `/dossier/build`**: hosts `StepDossierBuild` (the existing 6-screen
   sub-flow, screens 02→07) as a standalone page — no longer rendered by
   `OnboardingWizard`. Clicking step 24's "Fill My Dossier" CTA finalizes the profile
   and navigates straight to `/dossier/build` (no intermediate screen).
3. **Chrome**: `/dossier/build` reuses the onboarding page's visual chrome (full-bleed
   background, layout) for visual continuity with the screen the user just came from —
   minus the step-progress counter, since there is no longer a wizard step count to show.
4. **`dossierStep`/`dossierCompletedAt` unchanged**: same fields, same semantics, same
   anti-regression update pattern — only their trigger point moves (no longer wired
   through the wizard's step-25 slot).
5. **`DossierGate` simplified**: "Go to Dossier" now links directly to `/dossier/build`
   — the `/onboarding?dossier=1` escape-hatch from the previous chantier's fix wave is
   removed, since the redirect loop it worked around no longer exists (the loop existed
   *because* Dossier build lived inside `/onboarding`; removing that coupling removes
   the bug at its root rather than routing around it).

## Non-goals

- No change to `dossierStep`'s 0-6 encoding, `updateDossierStep`, `finalizeDossierBuild`,
  or any of the 6 screen components — they are relocated, not rewritten.
- No change to screens 08-12 (permanent Dossier section) — still out of scope, as before.
- No data migration for existing rows — this branch has not been merged/deployed, so no
  production users have `onboardingStep`/`dossierStep` combinations that would need
  reconciling under the new semantics.

## Architecture

### 1. `OnboardingWizard.tsx`

- `TOTAL_STEPS` changes from `25` to `24`.
- Remove the `StepDossierBuild` import and its render block (`state.step === 25`).
- `StepDossierIntro` (step 24) is now the wizard's last step. Its `onContinue` prop
  triggers a new server action that finalizes the profile and the client then navigates
  to `/dossier/build` (see below) — it no longer calls `goNext()` since there is no
  step 25 to advance to.

### 2. New finalize-profile action

Replace `acknowledgeDossierIntro()` (which only advanced the resume marker to 24, never
touched `onboardingCompletedAt`) with a new action that both marks step 24 done AND
completes onboarding in one write, since step 24 is now the wizard's final step:

```ts
// src/app/actions/onboarding.ts
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

This replaces both `acknowledgeDossierIntro()` and the old step-25-triggered
`completeOnboarding()` (which set `onboardingStep: 25`) — `completeOnboarding()` and
`acknowledgeDossierIntro()` are deleted as dead code once nothing calls them.

### 3. `StepDossierIntro.tsx`

`handleContinue` changes from:
```ts
await acknowledgeDossierIntro()
onContinue() // → goNext(), advances wizard to step 25
```
to:
```ts
await completeProfile()
router.push('/dossier/build')
```
This requires importing `useRouter` from `next/navigation` in this component (it
currently has no router dependency — `onContinue`/`onBack` are wizard-provided
callbacks). The `onContinue`/`onBack` props on `StepDossierIntro` are removed since
there is no next wizard step to advance to; `onBack` (→ previous step) is still needed
and stays.

### 4. New route: `src/app/dossier/build/page.tsx`

Server component, mirrors `src/app/onboarding/page.tsx`'s auth/redirect conventions:

```ts
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DossierBuildShell } from '@/components/dossierBuild/DossierBuildShell'

export default async function DossierBuildPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) redirect('/signin')

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { onboardingCompletedAt: true, dossierStep: true, dossierCompletedAt: true },
  })

  if (!profile?.onboardingCompletedAt) redirect('/onboarding')
  if (profile.dossierCompletedAt) redirect('/studio')

  return <DossierBuildShell initialDossierStep={profile.dossierStep} />
}
```

`DossierBuildShell` (new component, `src/components/dossierBuild/DossierBuildShell.tsx`)
provides the full-bleed background chrome (adapted from `OnboardingWizard`'s outer
layout — same background treatment, no `WizardProgress`) and renders the existing
`StepDossierBuild` inside it, with `onComplete` now doing:
```ts
const router = useRouter()
const onComplete = async () => {
  router.push('/studio')
}
```
(`finalizeDossierBuild()` already sets `dossierCompletedAt`; it no longer needs to touch
`onboardingStep`/`onboardingCompletedAt` at all — those are owned by the profile flow
now. `finalizeDossierBuild()` is updated to drop those two fields from its `updateMany`
payload.)

`StepDossierBuild.tsx` itself is unchanged (still takes `initialDossierStep` and
`onComplete`), only its caller changes.

### 5. `src/app/actions/dossier.ts` — `finalizeDossierBuild` payload

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
(Drops `onboardingStep: 25, onboardingCompletedAt: new Date()` from the previous
version — those concerns no longer belong to this action.)

### 6. `src/app/studio/page.tsx` and `src/components/studio/DossierGate.tsx`

- `studio/page.tsx`'s 3-branch logic is unchanged in shape (still reads
  `onboardingCompletedAt` and `dossierCompletedAt` the same way) — only the meaning of
  the first field changes, which requires no code change here, just correct expectations.
- Remove the `skipGate`/`?dossier=1` escape-hatch machinery added in the previous
  chantier's fix wave: `DossierGate`'s "Go to Dossier" link changes from
  `/onboarding?dossier=1` to `/dossier/build`. `onboarding/page.tsx`'s `searchParams`
  handling and the `dossier !== '1'` guard are removed — the redirect loop they existed
  to work around cannot occur anymore, since `/dossier/build` is a separate route from
  `/onboarding` and carries its own independent redirect rules (see section 4).
- `studio/page.tsx`'s own `skipGate` query-param handling (for "Go to Studio") is
  unrelated to this and stays as-is.

### 7. Resuming an interrupted session

- Steps 1-24: unchanged wizard resume logic (`resumeStep` formula), now bounded by
  `TOTAL_STEPS = 24` instead of 25.
- Dossier build resume: `/dossier/build` reads `dossierStep` fresh on every visit (server
  component, no client-side persistence needed) and passes it as `initialDossierStep` —
  simpler than before, since there's no wizard-level `initialStep` to reconcile it against.

## Testing

Manual verification of the three end-to-end paths (same three paths as the previous
chantier's spec, now against the new routing):
1. Onboarding never started → wizard from step 1, ends at step 24, redirects to
   `/dossier/build` on "Fill My Dossier".
2. Profile complete, Dossier build interrupted mid-way → sign back in → visiting
   `/studio` shows `DossierGate` → "Go to Dossier" → `/dossier/build` resumes at the
   correct screen (matching persisted `dossierStep`).
3. Both profile and Dossier complete → sign in → `/studio` shows `StudioShell` directly,
   no gate; visiting `/dossier/build` directly redirects to `/studio` (dossier already
   complete).

Also verify: visiting `/dossier/build` before finishing the profile (`onboardingCompletedAt`
null) redirects to `/onboarding`, not a broken/blank page.
