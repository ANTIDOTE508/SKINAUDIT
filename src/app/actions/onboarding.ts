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
} from '@prisma/client'

// ─── Auth helper ───────────────────────────────────────────────
async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user
}

// ─── Step 1 — Gender Identity ──────────────────────────────────
export async function saveGenderIdentity(genderIdentity: GenderIdentity) {
  const user = await requireSession()

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      genderIdentity,
      experienceLevel: 'BEGINNER',
      onboardingStep: 1,
    },
    update: {
      genderIdentity,
      onboardingStep: 1,
    },
  })

  return { ok: true }
}

// ─── Step 2 — Skin Type ────────────────────────────────────────
export type SkinProfilePayload = {
  skinType: SkinType
}

export async function saveSkinProfile(payload: SkinProfilePayload) {
  const user = await requireSession()

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      skinType: payload.skinType,
      experienceLevel: 'BEGINNER',
      onboardingStep: 2,
    },
    update: {
      skinType: payload.skinType,
      onboardingStep: 2,
    },
  })

  return { ok: true }
}

// ─── Step 3 — Sensitivity score (1–5) ─────────────────────────
export async function saveSensitivity(sensitivityScore: number) {
  const user = await requireSession()

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      sensitivityScore,
      experienceLevel: 'BEGINNER',
      onboardingStep: 3,
    },
    update: {
      sensitivityScore,
      onboardingStep: 3,
    },
  })

  return { ok: true }
}

// ─── Step 4 — Skin Goals (max 3) ──────────────────────────────
export async function saveGoals(goals: string[]) {
  const user = await requireSession()

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      goals,
      experienceLevel: 'BEGINNER',
      onboardingStep: 4,
    },
    update: {
      goals,
      onboardingStep: 4,
    },
  })

  return { ok: true }
}

// ─── Step 5 — Environment ──────────────────────────────────────
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
    where: { userId: user.id, onboardingStep: { lt: 5 } },
    data: { onboardingStep: 5 },
  })

  return { ok: true }
}

// ─── Step 6 — Experience Level ────────────────────────────────
export async function saveExperienceLevel(level: ExperienceLevel) {
  const user = await requireSession()

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      experienceLevel: level,
      onboardingStep: 6,
    },
    update: {
      experienceLevel: level,
      onboardingStep: 6,
    },
  })

  return { ok: true }
}

// ─── Step 7 — Tools & Treatments ─────────────────────────────
export type ToolsPayload = {
  homeDevices: HomeDeviceType[]
  professionalTreatments: ProfessionalTreatmentType[]
}

export async function saveToolsAndTreatments(payload: ToolsPayload) {
  const user = await requireSession()

  await prisma.userHomeDevice.deleteMany({ where: { userId: user.id } })
  await prisma.userProfessionalTreatment.deleteMany({ where: { userId: user.id } })

  if (payload.homeDevices.length > 0) {
    await prisma.userHomeDevice.createMany({
      data: payload.homeDevices.map((deviceType) => ({ userId: user.id, deviceType })),
    })
  }

  if (payload.professionalTreatments.length > 0) {
    await prisma.userProfessionalTreatment.createMany({
      data: payload.professionalTreatments.map((treatmentType) => ({ userId: user.id, treatmentType })),
    })
  }

  await prisma.userProfile.updateMany({
    where: { userId: user.id, onboardingStep: { lt: 7 } },
    data: { onboardingStep: 7 },
  })

  return { ok: true }
}

// ─── Step 8 — Product search & add ───────────────────────────
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
      onboardingStep: 9,
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
      sensitivityScore: true,
      genderIdentity: true,
      goals: true,
      concerns: true,
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
