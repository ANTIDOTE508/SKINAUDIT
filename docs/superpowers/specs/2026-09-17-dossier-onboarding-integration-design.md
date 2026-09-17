# Dossier build screens — onboarding integration & post-login gate

Date: 2026-09-17
Status: Approved by Gilles (CEO decisions relayed 2026-09-17)

## Context

The onboarding wizard (`src/components/onboarding/OnboardingWizard.tsx`) has 25
steps. Step 24 (`StepDossierIntro.tsx`) is a built "first-time Dossier" intro
screen. Step 25 (`StepProducts.tsx`) is currently a disabled placeholder (3
cards: Search / Scan / Add manually, all `disabled`), whose only working
action is "Continue to Studio", which finalizes onboarding
(`onboardingStep: 25`, `onboardingCompletedAt: now()`).

The mockup `templates/buildDossier/` defines 12 screens (`BuildDossier_01.png`
… `_12.png`). Screen 01 maps to the already-built `StepDossierIntro.tsx`.
Screens 02→12 need to be built and must replace the step 25 placeholder.

CEO decisions (relayed by Gilles, 2026-09-17):
1. The Dossier build screens appear right after the onboarding's existing
   step 24, in place of the current step 25 "Add your first product"
   placeholder.
2. If a user disconnects before finishing onboarding (including mid-way
   through the Dossier build sub-flow), the next sign-in resumes at the last
   step/screen reached — this is already the onboarding wizard's behavior for
   steps 1-25 and must extend to the Dossier sub-flow.
3. If onboarding is complete but the Dossier build is not, the next sign-in
   must show a simple 2-choice gate screen: "Go to Dossier" / "Go to Studio".
   This is the permanent entry door into the app post-onboarding, until the
   Dossier is complete (at which point it disappears for that user for good,
   who then lands directly on the Studio dashboard).

**Correction (2026-09-17, after reviewing the mockups screen-by-screen):**
the 12 mockup screens split into two distinct groups, not one linear
sequence:
- **Screens 01→07** = the one-time "add your first product" flow: Empty
  Dossier → Add Product (choose method) → Search → Confirm Match → Set
  Category & Status → Added confirmation → "Continue to Studio". This is
  the actual onboarding sub-flow replacing step 25.
- **Screens 08→12** = the permanent Dossier section of the Studio (list with
  filter/sort, product detail sheet, ingredients, history). These are
  ordinary navigation views a user opens repeatedly after onboarding, not
  steps to "complete" once. They are **out of scope for this plan** (see
  Non-goals) and belong to a separate future chantier.

Consequently: **`dossierCompletedAt` is set as soon as the user adds their
first product** (reaching/confirming screen 07's "Continue to Studio"), not
after some notion of finishing screens 08-12 (which have no "done" state).

## Non-goals (known gaps, deliberately deferred)

- **Screens 08→12** (permanent Dossier section: filterable/sortable list,
  product detail sheet, ingredients, history): separate future chantier, not
  built in this plan. "Go to Dossier" from the entry gate, once a product
  already exists, may link to a placeholder route rather than a full
  implementation.
- **Product images**: `Product` has no image field, and `obf-normalize.ts`
  does not extract `image_url`. Screens 02→07 use a new, small
  `components/studio/ProductImagePlaceholder.tsx` component (does not exist yet —
  created as part of this plan) wherever the mockup shows a product image.
- **Scan / OCR**: no OCR integration exists anywhere in the repo. The "Scan"
  entry point on screen 03 stays disabled / "coming soon", same treatment as
  today's step 25 placeholder.

These gaps are pre-existing (confirmed during 2026-09-16/17 exploration) and
are explicitly out of scope for this design.

## Architecture

### 1. Schema changes (`schema.prisma`, model `UserProfile`)

Two new fields, following the existing `onboardingStep` pattern:

```prisma
dossierStep        Int       @default(0) @map("dossier_step")
dossierCompletedAt DateTime? @map("dossier_completed_at")
```

`dossierStep` ranges 0-6 (0 = not started, 1 = screen 02 Empty Dossier, 2 =
screen 03 Add Product method, 3 = screen 04 Search, 4 = screen 05 Confirm
Match, 5 = screen 06 Category & Status, 6 = screen 07 Added confirmation)
and tracks position inside the Dossier build sub-flow, independently of the
onboarding wizard's own step counter.

After schema edit: run `pnpm db:generate` then `rm -rf .next` per project
rules. The actual `ALTER TABLE` is applied manually by Gilles via raw SQL —
no `prisma migrate` command is to be run by Claude.

### 2. Step 25 becomes a self-contained sub-flow (screens 02→07)

- `StepProducts.tsx` is replaced by a new container component (working name:
  `StepDossierBuild.tsx`) rendered at the same wizard position (step 25).
- `OnboardingWizard.tsx`'s `TOTAL_STEPS` stays `25`. The wizard's own
  `SET_STEP` / progress counter (`WizardProgress`) does not change while the
  user is inside this sub-flow — from the wizard's point of view, the user is
  still "on step 25".
- Internally, `StepDossierBuild` manages its own local progression across
  screens 02→07 (6 screens: Empty Dossier, Add Product method choice,
  Search, Confirm Match, Category & Status, Added confirmation), seeded from
  `dossierStep` on mount (resume) and persisted via a new server action
  after each screen transition:

  ```ts
  // src/app/actions/dossier.ts
  updateDossierStep(step: number): Promise<void>
  ```

  Anti-regression semantics identical to the existing onboarding step update
  (`{ dossierStep: { lt: step } } → step`, never move backwards).

- On reaching screen 07 ("Continue to Studio", after at least one product
  was added): set `dossierCompletedAt: now()`, **and** trigger the same
  finalization the current "Continue to Studio" button performs
  (`onboardingStep: 25`, `onboardingCompletedAt: now()`). Onboarding and
  Dossier build complete together, in the same user action.

### 3. Screens 02→07 implementation

Built from the `templates/buildDossier/` mockup (`BuildDossier_02.png`
through `_07.png`), wired to the existing server actions in `dossier.ts`:

- `searchProducts` (screen 04, text-only — no barcode/scan)
- `addProductToDossier` (screen 06 "Set Category & Status")
- new: `updateDossierStep`

Product imagery uses the new `components/studio/ProductImagePlaceholder.tsx`
throughout (screens 05, 06, 07). The "Scan" affordance on screen 03 is
rendered disabled with a "coming soon" label, consistent with today's
placeholder treatment. "Enter manually" on screen 03 is also out of scope
for this plan — disabled "coming soon" as well, unless trivial to wire to
`addProductToDossier` directly (decided during implementation).

### 4. Resuming an interrupted session

- Steps 1-25: unchanged (`initialStep` / `resumeStep` formula in
  `OnboardingWizard.tsx`).
- If `initialStep === 25` and `dossierCompletedAt == null`:
  `StepDossierBuild` reads `dossierStep` and resumes at the mapped internal
  screen per the table in section 1 (e.g. `dossierStep === 3` resumes on
  screen 04 Search).

### 5. Post-login entry gate

`src/app/studio/page.tsx` currently does:

```
onboardingCompletedAt == null  → redirect('/onboarding')
onboardingCompletedAt != null  → render StudioShell
```

Extended to:

```
onboardingCompletedAt == null                                → redirect('/onboarding')   (unchanged)
onboardingCompletedAt != null && dossierCompletedAt == null   → render DossierGate (new)
dossierCompletedAt != null                                    → render StudioShell        (unchanged)
```

`DossierGate` (new component): simple 2-choice screen, "Go to Dossier" /
"Go to Studio". "Go to Studio" always available (per CEO answer — the gate
does not force the user through the Dossier build). "Go to Dossier" routes
into the same `StepDossierBuild` sub-flow logic used inside onboarding,
resuming from `dossierStep` — exact route (e.g. `/dossier/build` vs. a modal
vs. re-entering the wizard shell) is an implementation detail, not
structural to this design.

Once `dossierCompletedAt != null`, `DossierGate` never renders again for
that user — direct `StudioShell`.

## Testing

Manual verification of the three end-to-end paths:
1. Onboarding never started → wizard from step 1.
2. Onboarding complete, Dossier build interrupted mid-way → sign back in →
   `DossierGate` shown → "Go to Dossier" resumes at the correct screen
   (matching persisted `dossierStep`).
3. Both onboarding and Dossier complete → sign in → `StudioShell` directly,
   no gate.

Also verify `dossierStep` persists correctly across a disconnect mid-flow
(steps 1-25 general resume logic already covered by existing behavior, not
re-tested here).
