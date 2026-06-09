'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type {
  SkinType,
  SensitivityLevel,
  ExperienceLevel,
  ClimateZone,
  Season,
} from '@prisma/client'

// ─── Auth helper ───────────────────────────────────────────────
async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user
}

// ─── Step 2 — Skin Profile ─────────────────────────────────────
export type SkinProfilePayload = {
  skinType: SkinType
  concerns: string[]
}

export async function saveSkinProfile(payload: SkinProfilePayload) {
  const user = await requireSession()

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      skinType: payload.skinType,
      concerns: payload.concerns,
      sensitivity: 'MEDIUM',
      experienceLevel: 'BEGINNER',
      onboardingStep: 2,
    },
    update: {
      skinType: payload.skinType,
      concerns: payload.concerns,
      onboardingStep: 2,
    },
  })

  return { ok: true }
}

// ─── Step 3 — Sensitivity & Goals ─────────────────────────────
export type SensitivityPayload = {
  sensitivity: SensitivityLevel
  goals: string[]
}

export async function saveSensitivity(payload: SensitivityPayload) {
  const user = await requireSession()

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      skinType: 'NORMAL',
      concerns: [],
      sensitivity: payload.sensitivity,
      goals: payload.goals,
      experienceLevel: 'BEGINNER',
      onboardingStep: 3,
    },
    update: {
      sensitivity: payload.sensitivity,
      goals: payload.goals,
      onboardingStep: 3,
    },
  })

  return { ok: true }
}

// ─── Step 4 — Environment ──────────────────────────────────────
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
    where: { userId: user.id, onboardingStep: { lt: 4 } },
    data: { onboardingStep: 4 },
  })

  return { ok: true }
}

// ─── Step 5 — Experience Level ────────────────────────────────
export async function saveExperienceLevel(level: ExperienceLevel) {
  const user = await requireSession()

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      skinType: 'NORMAL',
      concerns: [],
      sensitivity: 'MEDIUM',
      experienceLevel: level,
      onboardingStep: 5,
    },
    update: {
      experienceLevel: level,
      onboardingStep: 5,
    },
  })

  return { ok: true }
}

// ─── Step 6 — Education (no data, just advance) ───────────────
export async function saveEducationStep() {
  const user = await requireSession()

  await prisma.userProfile.updateMany({
    where: { userId: user.id, onboardingStep: { lt: 6 } },
    data: { onboardingStep: 6 },
  })

  return { ok: true }
}

// ─── Step 7 — Complete onboarding ─────────────────────────────
export async function completeOnboarding() {
  const user = await requireSession()

  await prisma.userProfile.updateMany({
    where: { userId: user.id },
    data: {
      onboardingStep: 7,
      onboardingCompletedAt: new Date(),
    },
  })

  return { ok: true }
}

// ─── Step 7 — First product search ───────────────────────────
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

// ─── Check onboarding status ──────────────────────────────────
export async function getOnboardingStatus() {
  const user = await requireSession()

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: {
      skinType: true,
      sensitivity: true,
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
