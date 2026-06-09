# Onboarding Wizard — Technical Reference

> **Projet** : SkinAudit  
> **Document créé le** : 9 juin 2026  
> **Scope** : Architecture technique du wizard d'onboarding, flux de données, état en base

---

## Architecture générale

```
Browser (client)          Server (Next.js RSC)         Database (Neon/PostgreSQL)
─────────────────         ────────────────────         ──────────────────────────
/dashboard GET    ──────► DashboardPage()       ──────► auth.session (Better Auth)
                          ├─ getSession()               auth.user
                          └─ prisma.userProfile  ──────► app.user_profiles
                              .findUnique()
```

---

## Flux complet au login

### 1. Arrivée sur `/dashboard`

`DashboardPage` (Server Component) exécute :

```typescript
// 1. Vérifie la session Better Auth
const session = await auth.api.getSession({ headers })
// → lit auth.session WHERE token = $cookie, JOIN auth.user

// 2. Lit le profil onboarding
const profile = await prisma.userProfile.findUnique({
  where: { userId: session.user.id },
  select: { onboardingStep, onboardingCompletedAt, ... }
})

// 3. Décision d'affichage
if (profile?.onboardingCompletedAt) → Dashboard
else → OnboardingWizard(initialStep: profile?.onboardingStep ?? 0)
```

### 2. Décision de routing

| État en DB | Affiché |
|---|---|
| Aucun `user_profiles` row | Wizard step 1 (Welcome) |
| `onboarding_step = 2`, `onboarding_completed_at = null` | Wizard reprend step 3 |
| `onboarding_step = 5`, `onboarding_completed_at = null` | Wizard reprend step 6 |
| `onboarding_completed_at = timestamp` | Dashboard |

---

## Le Wizard — 7 étapes

### Arbre des composants

```
OnboardingWizard          — Client Component, useReducer, GSAP transitions
├─ WizardProgress         — barre de progression sienna (desktop)
├─ StepWelcome            — auto-advance 3.2s, GSAP entrance
├─ StepSkinProfile        — step 2
├─ StepSensitivity        — step 3
├─ StepEnvironment        — step 4
├─ StepExperience         — step 5
├─ StepEducation          — step 6 (pas de form, éducatif uniquement)
└─ StepProducts           — step 7
```

### State local (useReducer)

```typescript
{
  step: number          // step courant (1–7)
  isTransitioning: bool // bloque double-clic pendant animation GSAP
  skinType: string
  concerns: string[]
  sensitivity: string
  goals: string[]
  city: string
  countryCode: string
  climateZone: string
  season: string
  experienceLevel: string
}
```

Les données sont gardées en mémoire React — si l'utilisateur navigue back/forward dans le wizard, les sélections restent visibles sans re-fetch.

### Transitions GSAP

À chaque `goNext()` / `goBack()` :

```
contentRef → opacity: 0, y: -12   (350ms, power2.in)
             SET_STEP (synchrone, pas de flash)
             opacity: 1, y: 0     (550ms, power3.out)
```

---

## Ce qui se passe en database, étape par étape

### Step 2 — Skin Profile → `saveSkinProfile()`

```sql
-- UPSERT sur app.user_profiles
-- C'est ici que la row user_profiles est créée pour la première fois
INSERT INTO app.user_profiles (user_id, "skinType", sensitivity, concerns, "experienceLevel", onboarding_step)
VALUES ($userId, $skinType, 'MEDIUM', $concerns, 'BEGINNER', 2)
ON CONFLICT (user_id) DO UPDATE
SET "skinType" = $skinType, concerns = $concerns, onboarding_step = 2;
```

### Step 3 — Sensitivity → `saveSensitivity()`

```sql
UPDATE app.user_profiles
SET sensitivity = $sensitivity, onboarding_step = 3
WHERE user_id = $userId;
```

### Step 4 — Environment → `saveEnvironment()`

```sql
-- Table séparée pour le contexte environnemental
INSERT INTO app.user_environment_context
  (user_id, "locationSource", city, "countryCode", "climateZone", season)
VALUES ($userId, 'ONBOARDING', $city, $countryCode, $climateZone, $season)
ON CONFLICT (user_id) DO UPDATE
SET city = $city, "countryCode" = $countryCode,
    "climateZone" = $climateZone, season = $season,
    "lastUpdatedAt" = NOW();

-- Avance le step seulement si on n'est pas déjà plus loin
UPDATE app.user_profiles
SET onboarding_step = 4
WHERE user_id = $userId AND onboarding_step < 4;
```

### Step 5 — Experience → `saveExperienceLevel()`

```sql
UPDATE app.user_profiles
SET "experienceLevel" = $level, onboarding_step = 5
WHERE user_id = $userId;
```

### Step 6 — Education → `saveEducationStep()`

```sql
-- Pas de données saisies, avance uniquement le compteur
UPDATE app.user_profiles
SET onboarding_step = 6
WHERE user_id = $userId AND onboarding_step < 6;
```

### Step 7 — Products → `addProductToDossier()` + `completeOnboarding()`

```sql
-- Pour chaque produit ajouté (optionnel, peut être skippé)
INSERT INTO app.user_dossier_products (user_id, product_id, status)
VALUES ($userId, $productId, 'ACTIVE')
ON CONFLICT (user_id, product_id) DO UPDATE SET status = 'ACTIVE';

-- Au clic "Finish" ou "Skip" — marque l'onboarding comme terminé
UPDATE app.user_profiles
SET onboarding_step = 7,
    onboarding_completed_at = NOW()
WHERE user_id = $userId;
```

---

## État final en DB après onboarding complet

### `app.user_profiles`

| user_id | skinType | sensitivity | concerns | experienceLevel | onboarding_step | onboarding_completed_at |
|---|---|---|---|---|---|---|
| `TbBSyEM...` | `DRY` | `HIGH` | `{acne,aging}` | `INTERMEDIATE` | `7` | `2026-06-09 14:23:11` |

### `app.user_environment_context`

| user_id | locationSource | city | climateZone | season |
|---|---|---|---|---|
| `TbBSyEM...` | `ONBOARDING` | `Paris` | `TEMPERATE` | `SPRING` |

### `app.user_dossier_products` (si produits ajoutés au step 7)

| user_id | product_id | status | addedAt |
|---|---|---|---|
| `TbBSyEM...` | `42` | `ACTIVE` | `2026-06-09 14:23:45` |

---

## Logique de reprise (resume)

```typescript
// Dans OnboardingWizard — calcul du step de reprise
const resumeStep = initialStep >= 2
  ? initialStep + 1   // reprend à l'étape suivante celle sauvegardée
  : 1                 // repart du début (Welcome)
```

| `initialStep` (DB) | `resumeStep` (affiché) | Étape présentée |
|---|---|---|
| `0` | `1` | Welcome |
| `2` | `3` | Sensitivity |
| `3` | `4` | Environment |
| `4` | `5` | Experience |
| `5` | `6` | Education |
| `6` | `7` | Products |

Le Welcome (step 1) est toujours sauté au resume — l'utilisateur arrive directement sur l'étape manquante.

---

## Tables impliquées — vue d'ensemble

```
auth schema (géré par Better Auth)
  user                     ← identité, email, rôle
  session                  ← token de session JWT

app schema (domaine métier)
  user_profiles            ← créé au step 2, complété au step 7
                             contient onboarding_step + onboarding_completed_at
  user_environment_context ← créé au step 4
  user_dossier_products    ← alimenté au step 7 (optionnel)
  products                 ← référencé en lecture seule au step 7
```

---

## Fichiers source

| Fichier | Rôle |
|---|---|
| `src/app/dashboard/page.tsx` | Server Component — lit la session + le profil, décide wizard ou dashboard |
| `src/app/actions/onboarding.ts` | Toutes les Server Actions (save par step + completeOnboarding) |
| `src/components/onboarding/OnboardingWizard.tsx` | Orchestrateur client — useReducer + GSAP + routing entre steps |
| `src/components/onboarding/Step*.tsx` | Un composant par step (7 fichiers) |
| `src/components/onboarding/WizardProgress.tsx` | Indicateur de progression (dots + connecteurs) |
| `src/components/dashboard/DashboardHeader.tsx` | Header avec wordmark + SignOutButton |
| `src/components/dashboard/SignOutButton.tsx` | Client Component — signout Better Auth + redirect |
