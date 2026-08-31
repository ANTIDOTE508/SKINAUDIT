'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type {
  SkinType,
  ExperienceLevel,
  ClimateZone,
  Season,
  GenderIdentity,
  HomeDeviceType,
  ProfessionalTreatmentType,
  SkinUndertone,
  PIHFrequency,
  PIHDuration,
  TanPattern,
  ProductReactivity,
  InflammatoryHistory,
  ProductReactionSeverity,
  BreakoutPattern,
} from '@prisma/client'
import {
  PREFERRED_NAME_MAX_LENGTH,
  PREFERRED_NAME_MIN_LENGTH,
  birthYearBounds,
  isValidSkinToneScale,
  isValidSunResponse,
} from '@/lib/onboarding-rules'

// ─── Auth helper ───────────────────────────────────────────────
async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user
}

// ─── Step 1 — About you (name, identity, birth month/year) ─────
export type IdentityPayload = {
  genderIdentity: GenderIdentity
  preferredName: string
  birthMonth: number
  birthYear: number
}

export async function saveIdentity(payload: IdentityPayload) {
  const user = await requireSession()

  const { genderIdentity, birthMonth, birthYear } = payload

  // Every answer on this step is required.
  if (!genderIdentity) throw new Error('Gender identity is required')

  const preferredName = payload.preferredName?.trim() ?? ''
  if (preferredName.length < PREFERRED_NAME_MIN_LENGTH) {
    throw new Error('Preferred name is required')
  }
  if (preferredName.length > PREFERRED_NAME_MAX_LENGTH) {
    throw new Error(`Preferred name must be ${PREFERRED_NAME_MAX_LENGTH} characters or fewer`)
  }

  if (!Number.isInteger(birthMonth) || birthMonth < 1 || birthMonth > 12) {
    throw new Error('Invalid birth month')
  }
  const { min, max } = birthYearBounds()
  if (!Number.isInteger(birthYear) || birthYear < min || birthYear > max) {
    throw new Error('Invalid birth year')
  }

  const values = { genderIdentity, preferredName, birthMonth, birthYear }

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...values,
      experienceLevel: 'BEGINNER',
      onboardingStep: 1,
    },
    update: {
      ...values,
      onboardingStep: 1,
    },
  })

  return { ok: true }
}

// ─── Step 2 — Skin tone & vitiligo ────────────────────────────
export type SkinTonePayload = {
  skinToneScale: number
  vitiligo: boolean
}

export async function saveSkinTone(payload: SkinTonePayload) {
  const user = await requireSession()

  const { skinToneScale } = payload

  // Tone is required to continue; the toggle defaults to off and is always
  // valid, so it is simply coerced to a boolean.
  if (!isValidSkinToneScale(skinToneScale)) {
    throw new Error('Invalid skin tone selection')
  }
  const vitiligo = payload.vitiligo === true

  const values = { skinToneScale, vitiligo }

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...values,
      experienceLevel: 'BEGINNER',
      onboardingStep: 2,
    },
    update: {
      ...values,
      onboardingStep: 2,
    },
  })

  return { ok: true }
}

// ─── Step 10 — Skin type (inferred from a behavioural scenario) ─
export type SkinProfilePayload = {
  skinType: SkinType
}

export async function saveSkinProfile(payload: SkinProfilePayload) {
  const user = await requireSession()

  if (!payload.skinType) throw new Error('Skin type is required')

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      skinType: payload.skinType,
      experienceLevel: 'BEGINNER',
      onboardingStep: 10,
    },
    update: {
      skinType: payload.skinType,
      onboardingStep: 10,
    },
  })

  return { ok: true }
}

// ─── Step 3 — Sun response (1–6, Fitzpatrick-style) ───────────
export async function saveSunResponse(sunResponse: number) {
  const user = await requireSession()

  if (!isValidSunResponse(sunResponse)) {
    throw new Error('Invalid sun response selection')
  }

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      sunResponse,
      experienceLevel: 'BEGINNER',
      onboardingStep: 3,
    },
    update: {
      sunResponse,
      onboardingStep: 3,
    },
  })

  return { ok: true }
}

// ─── Step 4 — Skin undertone (optional) ──────────────────────
export async function saveUndertone(undertone: SkinUndertone | null) {
  const user = await requireSession()

  // Undertone is optional — a null answer is valid and simply stored as-is.
  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      skinUndertone: undertone,
      experienceLevel: 'BEGINNER',
      onboardingStep: 4,
    },
    update: {
      skinUndertone: undertone,
      onboardingStep: 4,
    },
  })

  return { ok: true }
}

// ─── Step 5 — PIH frequency (dark marks after healing) ───────
export async function savePihFrequency(pihFrequency: PIHFrequency) {
  const user = await requireSession()

  if (!pihFrequency) throw new Error('PIH frequency is required')

  // "rarely" / "never" skip the follow-up duration screen (Screen 08), so
  // any previously-saved duration must be cleared. "often" / "sometimes"
  // leave it untouched (undefined) — the user is about to land on Screen 08.
  const skipsDuration = pihFrequency === 'RARELY' || pihFrequency === 'NEVER'

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      pihFrequency,
      pihDuration: skipsDuration ? null : undefined,
      experienceLevel: 'BEGINNER',
      onboardingStep: 5,
    },
    update: {
      pihFrequency,
      pihDuration: skipsDuration ? null : undefined,
      onboardingStep: 5,
    },
  })

  return { ok: true }
}

// ─── Step 6 — PIH duration (follow-up; only after often / sometimes) ──
export async function savePihDuration(pihDuration: PIHDuration | null) {
  const user = await requireSession()

  // Optional — a null answer is valid and stored as-is.
  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      pihDuration,
      experienceLevel: 'BEGINNER',
      onboardingStep: 6,
    },
    update: {
      pihDuration,
      onboardingStep: 6,
    },
  })

  return { ok: true }
}

// ─── Step 7 — Tan pattern (even tan vs. uneven patches) ──────
export async function saveUnevenPatches(unevenPatches: TanPattern) {
  const user = await requireSession()

  if (!unevenPatches) throw new Error('Tan pattern answer is required')

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      unevenPatches,
      experienceLevel: 'BEGINNER',
      onboardingStep: 7,
    },
    update: {
      unevenPatches,
      onboardingStep: 7,
    },
  })

  return { ok: true }
}

// ─── Step 8 — Product reactivity (stinging on new actives) ────
export async function saveProductReactivity(productReactivity: ProductReactivity) {
  const user = await requireSession()

  if (!productReactivity) throw new Error('Product reactivity answer is required')

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      productReactivity,
      experienceLevel: 'BEGINNER',
      onboardingStep: 8,
    },
    update: {
      productReactivity,
      onboardingStep: 8,
    },
  })

  return { ok: true }
}

// ─── Step 9 — Reaction history (conditional; two questions) ───
// Shown only when product reactivity was FREQUENT_STING or MILD_TRANSIENT.
export type ReactionHistoryPayload = {
  inflammatoryHistory: InflammatoryHistory
  productReactionSeverity: ProductReactionSeverity
}

export async function saveReactionHistory(payload: ReactionHistoryPayload) {
  const user = await requireSession()

  if (!payload.inflammatoryHistory || !payload.productReactionSeverity) {
    throw new Error('Both reaction-history answers are required')
  }

  const values = {
    inflammatoryHistory: payload.inflammatoryHistory,
    productReactionSeverity: payload.productReactionSeverity,
  }

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...values,
      experienceLevel: 'BEGINNER',
      onboardingStep: 9,
    },
    update: {
      ...values,
      onboardingStep: 9,
    },
  })

  return { ok: true }
}

// ─── Step 11 — Recurring breakouts (+ inline area follow-up) ──
export type BreakoutsPayload = {
  breakoutPattern: BreakoutPattern
  breakoutAreas: string[]
}

export async function saveBreakouts(payload: BreakoutsPayload) {
  const user = await requireSession()

  if (!payload.breakoutPattern) throw new Error('Breakout pattern is required')

  const areas = Array.isArray(payload.breakoutAreas) ? payload.breakoutAreas : []
  if (areas.some((a) => typeof a !== 'string' || a.trim().length === 0)) {
    throw new Error('Invalid breakout area selection')
  }
  // The area follow-up only applies to the "localised" answer.
  const breakoutAreas = payload.breakoutPattern === 'LOCALISED' ? areas : []

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      breakoutPattern: payload.breakoutPattern,
      breakoutAreas,
      experienceLevel: 'BEGINNER',
      onboardingStep: 11,
    },
    update: {
      breakoutPattern: payload.breakoutPattern,
      breakoutAreas,
      onboardingStep: 11,
    },
  })

  return { ok: true }
}

// ─── Step 12 — Sensitivity score (1–5) ────────────────────────
export async function saveSensitivity(sensitivityScore: number) {
  const user = await requireSession()

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      sensitivityScore,
      experienceLevel: 'BEGINNER',
      onboardingStep: 12,
    },
    update: {
      sensitivityScore,
      onboardingStep: 12,
    },
  })

  return { ok: true }
}

// ─── Step 13 — Skin Goals (max 3) ─────────────────────────────
export async function saveGoals(goals: string[]) {
  const user = await requireSession()

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      goals,
      experienceLevel: 'BEGINNER',
      onboardingStep: 13,
    },
    update: {
      goals,
      onboardingStep: 13,
    },
  })

  return { ok: true }
}

// ─── Step 14 — Environment ────────────────────────────────────
export type EnvironmentPayload = {
  city?: string
  countryCode?: string
  climateZone?: ClimateZone
  season?: Season
}

export async function saveEnvironment(payload: EnvironmentPayload) {
  const user = await requireSession()

  await prisma.userEnvironmentContext.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      locationSource: 'ONBOARDING',
      city: payload.city,
      countryCode: payload.countryCode,
      climateZone: payload.climateZone,
      season: payload.season,
    },
    update: {
      city: payload.city,
      countryCode: payload.countryCode,
      climateZone: payload.climateZone,
      season: payload.season,
      lastUpdatedAt: new Date(),
    },
  })

  await prisma.userProfile.updateMany({
    where: { userId: user.id, onboardingStep: { lt: 14 } },
    data: { onboardingStep: 14 },
  })

  return { ok: true }
}

// ─── Step 15 — Experience Level ───────────────────────────────
export async function saveExperienceLevel(level: ExperienceLevel) {
  const user = await requireSession()

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      experienceLevel: level,
      onboardingStep: 15,
    },
    update: {
      experienceLevel: level,
      onboardingStep: 15,
    },
  })

  return { ok: true }
}

// ─── Step 16 — Tools & Treatments ────────────────────────────
export type ToolsPayload = {
  homeDevices: HomeDeviceType[]
  professionalTreatments: ProfessionalTreatmentType[]
}

export async function saveToolsAndTreatments(payload: ToolsPayload) {
  const user = await requireSession()

  // Wrapped in a transaction: without it, a failure between the deletes and
  // the recreates (e.g. a transient DB error) would silently wipe the
  // user's previously-saved selections without restoring or replacing them.
  await prisma.$transaction([
    prisma.userHomeDevice.deleteMany({ where: { userId: user.id } }),
    prisma.userProfessionalTreatment.deleteMany({ where: { userId: user.id } }),
    ...(payload.homeDevices.length > 0
      ? [
          prisma.userHomeDevice.createMany({
            data: payload.homeDevices.map((deviceType) => ({ userId: user.id, deviceType })),
          }),
        ]
      : []),
    ...(payload.professionalTreatments.length > 0
      ? [
          prisma.userProfessionalTreatment.createMany({
            data: payload.professionalTreatments.map((treatmentType) => ({ userId: user.id, treatmentType })),
          }),
        ]
      : []),
    prisma.userProfile.updateMany({
      where: { userId: user.id, onboardingStep: { lt: 16 } },
      data: { onboardingStep: 16 },
    }),
  ])

  return { ok: true }
}

// ─── Step 17 — Interpretation notice ──────────────────────────
/**
 * The interpretation/scope screen carries no user input — acknowledging it
 * only advances the resume marker so returning users land past it instead
 * of re-reading it. `lt: 17` keeps a further-along user from being pulled
 * backwards if they navigate back to this screen and continue again.
 */
export async function acknowledgeInterpretation() {
  const user = await requireSession()

  await prisma.userProfile.updateMany({
    where: { userId: user.id, onboardingStep: { lt: 17 } },
    data: { onboardingStep: 17 },
  })

  return { ok: true }
}

// ─── Step 18 — "All set" transition ───────────────────────────
/**
 * The "All set" screen is a milestone marker, not the end of onboarding —
 * it sits between the questionnaire and the dossier-building steps.
 * Continuing past it only advances the resume marker.
 */
export async function acknowledgeAllSet() {
  const user = await requireSession()

  await prisma.userProfile.updateMany({
    where: { userId: user.id, onboardingStep: { lt: 18 } },
    data: { onboardingStep: 18 },
  })

  return { ok: true }
}

// ─── Step 19 — Dossier intro ──────────────────────────────────
/**
 * Like the interpretation screen, this one carries no user input —
 * acknowledging it only advances the resume marker so returning users land
 * on the product picker instead of re-reading the intro.
 */
export async function acknowledgeDossierIntro() {
  const user = await requireSession()

  await prisma.userProfile.updateMany({
    where: { userId: user.id, onboardingStep: { lt: 19 } },
    data: { onboardingStep: 19 },
  })

  return { ok: true }
}

// ─── Step 20 — Product search & add ──────────────────────────
export async function searchProducts(query: string) {
  await requireSession()
  if (!query.trim() || query.length < 2) return []

  const results = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { aliases: { some: { alias: { contains: query, mode: 'insensitive' } } } },
        { brand: { name: { contains: query, mode: 'insensitive' } } },
      ],
    },
    take: 8,
    select: {
      id: true,
      name: true,
      category: true,
      brand: { select: { name: true } },
    },
  })

  return results
}

export async function addProductToDossier(productId: number) {
  const user = await requireSession()

  await prisma.userDossierProduct.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    create: { userId: user.id, productId, status: 'ACTIVE' },
    update: { status: 'ACTIVE' },
  })

  return { ok: true }
}

// ─── Complete onboarding ───────────────────────────────────────
export async function completeOnboarding() {
  const user = await requireSession()

  await prisma.userProfile.updateMany({
    where: { userId: user.id },
    data: {
      onboardingStep: 20,
      onboardingCompletedAt: new Date(),
    },
  })

  return { ok: true }
}

// ─── Restart onboarding ────────────────────────────────────────
/**
 * Reopens the wizard for a user who already finished it. Only the two
 * progress markers are cleared — every answer already saved on the profile
 * stays put so each step reopens pre-filled with the previous choice.
 */
export async function resetOnboarding() {
  const user = await requireSession()

  await prisma.userProfile.updateMany({
    where: { userId: user.id },
    data: {
      onboardingStep: 0,
      onboardingCompletedAt: null,
    },
  })

  return { ok: true }
}

// ─── Check onboarding status ──────────────────────────────────
export async function getOnboardingStatus() {
  const user = await requireSession()

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: {
      skinType: true,
      skinToneScale: true,
      vitiligo: true,
      sensitivityScore: true,
      sunResponse: true,
      skinUndertone: true,
      pihFrequency: true,
      pihDuration: true,
      unevenPatches: true,
      genderIdentity: true,
      preferredName: true,
      birthMonth: true,
      birthYear: true,
      goals: true,
      experienceLevel: true,
      onboardingStep: true,
      onboardingCompletedAt: true,
    },
  })

  return {
    isComplete: profile?.onboardingCompletedAt != null,
    onboardingStep: profile?.onboardingStep ?? 0,
    profile,
    user: { id: user.id, email: user.email, name: user.name },
  }
}
