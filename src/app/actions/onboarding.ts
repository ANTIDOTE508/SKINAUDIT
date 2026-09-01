'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type {
  SkinType,
  ClimateZone,
  Season,
  GenderIdentity,
  HomeDeviceType,
  ProfessionalTreatmentType,
  ToolUsageFrequency,
  ToolLastUsed,
  SkinUndertone,
  PIHFrequency,
  PIHDuration,
  TanPattern,
  ProductReactivity,
  InflammatoryHistory,
  ProductReactionSeverity,
  BreakoutPattern,
  RednessPattern,
  FlushFadeSpeed,
  SkincareExperience,
  RecoveryTime,
  OilyAndTight,
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

// ─── Resume-marker helper ─────────────────────────────────────
/**
 * Advances the resume marker to `step`, but only if the user is not already
 * further along. The wizard supports Back navigation across the whole
 * questionnaire and re-submits each step on Continue, so an unconditional
 * write here would let "go Back, then Continue" pull `onboardingStep`
 * backwards and force the user to redo every step in between on their next
 * resume. Screens 15+ already guard their marker writes the same way.
 */
async function bumpOnboardingStep(userId: string, step: number) {
  await prisma.userProfile.updateMany({
    where: { userId, onboardingStep: { lt: step } },
    data: { onboardingStep: step },
  })
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
      onboardingStep: 1,
    },
    update: values,
  })

  await bumpOnboardingStep(user.id, 1)

  return { ok: true }
}

// ─── Step 2 — Skin tone ────────────────────────────────────────
export type SkinTonePayload = {
  skinToneScale: number
}

export async function saveSkinTone(payload: SkinTonePayload) {
  const user = await requireSession()

  const { skinToneScale } = payload

  if (!isValidSkinToneScale(skinToneScale)) {
    throw new Error('Invalid skin tone selection')
  }

  const values = { skinToneScale }

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...values,
      onboardingStep: 2,
    },
    update: values,
  })

  await bumpOnboardingStep(user.id, 2)

  return { ok: true }
}

// ─── Step 5 — Skin type self-identification (early, pre-behavioural) ─
/**
 * First-pass skin type: the user's own read of their skin, asked before any
 * behavioural question. Writes the same `skinType` column as saveSkinProfile
 * (Step 12), which can later refine it from a behavioural scenario.
 */
const SKIN_TYPE_VALUES: SkinType[] = [
  'BALANCED',
  'DRY',
  'OILY',
  'COMBINATION',
  'SENSITIVE',
  'ACNE_PRONE',
  'DEHYDRATED',
]

export async function saveSkinTypeSelfId(skinType: SkinType) {
  const user = await requireSession()

  if (!skinType || !SKIN_TYPE_VALUES.includes(skinType)) {
    throw new Error('Invalid skin type selection')
  }

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      skinType,
      onboardingStep: 5,
    },
    update: {
      skinType,
    },
  })

  await bumpOnboardingStep(user.id, 5)

  return { ok: true }
}

// ─── Step 6 — Primary concerns (multi-select, no maximum) ─────
const PRIMARY_CONCERN_VALUES = [
  'acne_breakouts',
  'aging_fine_lines',
  'pigmentation_dark_spots',
  'dryness_dehydration',
  'sensitivity_reactivity',
  'redness_rosacea',
  'uneven_texture_pores',
  'dullness',
] as const

export async function savePrimaryConcerns(primaryConcerns: string[]) {
  const user = await requireSession()

  const list = Array.isArray(primaryConcerns) ? primaryConcerns : []
  if (list.length === 0) throw new Error('At least one concern is required')
  if (list.some((c) => !PRIMARY_CONCERN_VALUES.includes(c as never))) {
    throw new Error('Invalid concern selection')
  }
  // De-dupe while preserving the user's selection order.
  const concerns = [...new Set(list)]

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      primaryConcerns: concerns,
      onboardingStep: 6,
    },
    update: {
      primaryConcerns: concerns,
    },
  })

  await bumpOnboardingStep(user.id, 6)

  return { ok: true }
}

// ─── Step 7 — Skin goals (multi-select, max 3, aspirational) ──
const GOAL_VALUES = [
  'lasting_hydration',
  'barrier_strength',
  'even_balanced_tone',
  'reduced_redness',
  'anti_aging_longevity',
  'clearer_skin_acne_control',
  'brighter_radiant_skin',
  'refined_pores_texture',
  'firmer_elastic_skin',
] as const

const MAX_GOALS = 3

export async function saveSkinGoals(goals: string[]) {
  const user = await requireSession()

  const list = Array.isArray(goals) ? goals : []
  if (list.length === 0) throw new Error('At least one goal is required')
  if (list.some((g) => !GOAL_VALUES.includes(g as never))) {
    throw new Error('Invalid goal selection')
  }
  // De-dupe (keeping selection order), then enforce the cap server-side.
  const deduped = [...new Set(list)]
  if (deduped.length > MAX_GOALS) {
    throw new Error(`Choose at most ${MAX_GOALS} goals`)
  }

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      goals: deduped,
      onboardingStep: 7,
    },
    update: {
      goals: deduped,
    },
  })

  await bumpOnboardingStep(user.id, 7)

  return { ok: true }
}

// ─── Step 8 — Experience level (single select) ────────────────
const EXPERIENCE_VALUES: SkincareExperience[] = [
  'NEW',
  'SOMEWHAT_EXPERIENCED',
  'EXPERIENCED',
  'OBSESSIVE',
]

export async function saveExperienceLevel(skincareExperience: SkincareExperience) {
  const user = await requireSession()

  if (!skincareExperience || !EXPERIENCE_VALUES.includes(skincareExperience)) {
    throw new Error('Invalid experience level selection')
  }

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      skincareExperience,
      onboardingStep: 8,
    },
    update: {
      skincareExperience,
    },
  })

  await bumpOnboardingStep(user.id, 8)

  return { ok: true }
}

// ─── Step 13 — Skin type (inferred from a behavioural scenario) ─
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
      onboardingStep: 13,
    },
    update: {
      skinType: payload.skinType,
    },
  })

  await bumpOnboardingStep(user.id, 13)

  return { ok: true }
}

// ─── Step 14 — Dehydration check (single select) ──────────────
const OILY_AND_TIGHT_VALUES: OilyAndTight[] = [
  'OFTEN',
  'SOMETIMES',
  'RARELY',
  'NEVER',
  'UNSURE',
]

export async function saveDehydrationCheck(oilyAndTight: OilyAndTight) {
  const user = await requireSession()

  if (!oilyAndTight || !OILY_AND_TIGHT_VALUES.includes(oilyAndTight)) {
    throw new Error('Invalid dehydration-check selection')
  }

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      oilyAndTight,
      onboardingStep: 14,
    },
    update: {
      oilyAndTight,
    },
  })

  await bumpOnboardingStep(user.id, 14)

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
      onboardingStep: 3,
    },
    update: {
      sunResponse,
    },
  })

  await bumpOnboardingStep(user.id, 3)

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
      onboardingStep: 4,
    },
    update: {
      skinUndertone: undertone,
    },
  })

  await bumpOnboardingStep(user.id, 4)

  return { ok: true }
}

// ─── Step 9 — PIH frequency (+ inline duration follow-up) ─────
// The duration follow-up is shown on the same screen when marks appear
// "often" or "sometimes"; for "rarely" / "never" it is skipped and any
// previously-saved duration is cleared.
export type PihFrequencyPayload = {
  pihFrequency: PIHFrequency
  pihDuration: PIHDuration | null
}

export async function savePihFrequency(payload: PihFrequencyPayload) {
  const user = await requireSession()

  if (!payload.pihFrequency) throw new Error('PIH frequency is required')

  const followUp =
    payload.pihFrequency === 'OFTEN' || payload.pihFrequency === 'SOMETIMES'
  // Duration is optional even when the follow-up applies.
  const pihDuration = followUp ? payload.pihDuration : null

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      pihFrequency: payload.pihFrequency,
      pihDuration,
      onboardingStep: 9,
    },
    update: {
      pihFrequency: payload.pihFrequency,
      pihDuration,
    },
  })

  await bumpOnboardingStep(user.id, 9)

  return { ok: true }
}

// ─── Step 10 — Tan pattern (even tan vs. uneven patches) ──────
export async function saveUnevenPatches(unevenPatches: TanPattern) {
  const user = await requireSession()

  if (!unevenPatches) throw new Error('Tan pattern answer is required')

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      unevenPatches,
      onboardingStep: 10,
    },
    update: {
      unevenPatches,
    },
  })

  await bumpOnboardingStep(user.id, 10)

  return { ok: true }
}

// ─── Step 11 — Product reactivity (+ inline reaction-history follow-up) ──
// The two-question reaction-history follow-up is shown on the same screen
// when the answer is FREQUENT_STING or MILD_TRANSIENT; otherwise it is
// skipped and any previously-saved answers are cleared.
export type ProductReactivityPayload = {
  productReactivity: ProductReactivity
  inflammatoryHistory: InflammatoryHistory | null
  productReactionSeverity: ProductReactionSeverity | null
}

export async function saveProductReactivity(payload: ProductReactivityPayload) {
  const user = await requireSession()

  if (!payload.productReactivity) {
    throw new Error('Product reactivity answer is required')
  }

  const followUp =
    payload.productReactivity === 'FREQUENT_STING' ||
    payload.productReactivity === 'MILD_TRANSIENT'
  if (followUp && (!payload.inflammatoryHistory || !payload.productReactionSeverity)) {
    throw new Error('Both follow-up answers are required')
  }
  const inflammatoryHistory = followUp ? payload.inflammatoryHistory : null
  const productReactionSeverity = followUp ? payload.productReactionSeverity : null

  const values = {
    productReactivity: payload.productReactivity,
    inflammatoryHistory,
    productReactionSeverity,
  }

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...values,
      onboardingStep: 11,
    },
    update: values,
  })

  await bumpOnboardingStep(user.id, 11)

  return { ok: true }
}

// ─── Step 12 — Recovery time (single select) ───────────────────
const RECOVERY_TIME_VALUES: RecoveryTime[] = [
  'FEW_HOURS',
  'NEXT_DAY',
  'FEW_DAYS',
  'WEEK_OR_LONGER',
  'VARIES',
  'UNSURE',
]

export async function saveRecoveryTime(recoveryTime: RecoveryTime) {
  const user = await requireSession()

  if (!recoveryTime || !RECOVERY_TIME_VALUES.includes(recoveryTime)) {
    throw new Error('Invalid recovery time selection')
  }

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      recoveryTime,
      onboardingStep: 12,
    },
    update: {
      recoveryTime,
    },
  })

  await bumpOnboardingStep(user.id, 12)

  return { ok: true }
}

// ─── Step 15 — Recurring breakouts (+ inline area follow-up) ──
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
      onboardingStep: 15,
    },
    update: {
      breakoutPattern: payload.breakoutPattern,
      breakoutAreas,
    },
  })

  await bumpOnboardingStep(user.id, 15)

  return { ok: true }
}

// ─── Step 16 — Persistent facial redness (+ inline follow-up) ──
// When redness is PERSISTENT or INTERMITTENT, the same screen also asks for
// the affected areas, the flushing triggers, and how quickly redness fades.
// For OCCASIONAL / NONE all of that is skipped and cleared.
export type RednessPayload = {
  rednessPattern: RednessPattern
  rednessAreas: string[]
  flushTriggers: string[]
  flushFadeSpeed: FlushFadeSpeed | null
}

export async function saveRedness(payload: RednessPayload) {
  const user = await requireSession()

  if (!payload.rednessPattern) throw new Error('Redness pattern is required')

  const followUp =
    payload.rednessPattern === 'PERSISTENT' ||
    payload.rednessPattern === 'INTERMITTENT'

  const areas = Array.isArray(payload.rednessAreas) ? payload.rednessAreas : []
  if (areas.some((a) => typeof a !== 'string' || a.trim().length === 0)) {
    throw new Error('Invalid redness area selection')
  }
  const rawTriggers = Array.isArray(payload.flushTriggers) ? payload.flushTriggers : []
  if (rawTriggers.some((t) => typeof t !== 'string' || t.trim().length === 0)) {
    throw new Error('Invalid flushing trigger selection')
  }

  if (followUp) {
    if (areas.length === 0) throw new Error('At least one redness area is required')
    if (rawTriggers.length === 0) {
      throw new Error('At least one flushing trigger is required')
    }
    if (!payload.flushFadeSpeed) throw new Error('Flush fade speed is required')
  }

  const rednessAreas = followUp ? areas : []
  // "none" is exclusive — normalise a mixed selection down to just "none".
  const flushTriggers = followUp
    ? rawTriggers.includes('none')
      ? ['none']
      : rawTriggers
    : []
  const flushFadeSpeed = followUp ? payload.flushFadeSpeed : null

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      rednessPattern: payload.rednessPattern,
      rednessAreas,
      flushTriggers,
      flushFadeSpeed,
      onboardingStep: 16,
    },
    update: {
      rednessPattern: payload.rednessPattern,
      rednessAreas,
      flushTriggers,
      flushFadeSpeed,
    },
  })

  await bumpOnboardingStep(user.id, 16)

  return { ok: true }
}

// ─── Step 17 — Current state (single select + inline follow-up) ─
// Prevents a temporary state (a flare, hormonal shift, stress) from being
// recorded as the permanent profile. `currentStateDiffs` is only kept when
// the answer is "mostly" or "no_different".
const CURRENT_STATE_NORMAL_VALUES = new Set([
  'yes_typical',
  'mostly',
  'no_different',
  'unsure',
])
const CURRENT_STATE_DIFF_VALUES = new Set([
  'breakouts_congestion',
  'dryness_tightness',
  'oiliness',
  'redness_irritation',
  'dark_marks_uneven_tone',
  'something_else',
])
const CURRENT_STATE_FOLLOWUP = new Set(['mostly', 'no_different'])

export type CurrentStatePayload = {
  currentStateNormal: string
  currentStateDiffs: string[]
}

export async function saveCurrentState(payload: CurrentStatePayload) {
  const user = await requireSession()

  if (!CURRENT_STATE_NORMAL_VALUES.has(payload.currentStateNormal)) {
    throw new Error('Invalid current-state selection')
  }
  const rawDiffs = Array.isArray(payload.currentStateDiffs) ? payload.currentStateDiffs : []
  if (rawDiffs.some((d) => !CURRENT_STATE_DIFF_VALUES.has(d))) {
    throw new Error('Invalid current-state difference selection')
  }
  const followUp = CURRENT_STATE_FOLLOWUP.has(payload.currentStateNormal)
  if (followUp && rawDiffs.length === 0) {
    throw new Error('Please select what has been different lately')
  }
  const currentStateDiffs = followUp ? [...new Set(rawDiffs)] : []

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      currentStateNormal: payload.currentStateNormal,
      currentStateDiffs,
      onboardingStep: 17,
    },
    update: {
      currentStateNormal: payload.currentStateNormal,
      currentStateDiffs,
    },
  })

  await bumpOnboardingStep(user.id, 17)

  return { ok: true }
}

// ─── Step 18 — Recent change (single select + inline follow-up) ─
// Captures regimen/environment context: a behavioural shift alongside a
// routine or environment change is exactly what the audit investigates.
// `recentChange` stores the boolean; `recentChangeDetail` is kept only when
// the answer is "yes" or "a_little".
const RECENT_CHANGE_ANSWER_VALUES = new Set(['yes', 'a_little', 'no', 'unsure'])
const RECENT_CHANGE_DETAIL_VALUES = new Set([
  'breakouts_congestion',
  'dryness_dehydration',
  'sensitivity_redness',
  'oiliness',
  'routine_changed',
  'environment_diet_changed',
  'something_else',
])
const RECENT_CHANGE_FOLLOWUP = new Set(['yes', 'a_little'])

export type RecentChangePayload = {
  answer: string
  recentChangeDetail: string[]
}

export async function saveRecentChange(payload: RecentChangePayload) {
  const user = await requireSession()

  if (!RECENT_CHANGE_ANSWER_VALUES.has(payload.answer)) {
    throw new Error('Invalid recent-change selection')
  }
  const rawDetail = Array.isArray(payload.recentChangeDetail) ? payload.recentChangeDetail : []
  if (rawDetail.some((d) => !RECENT_CHANGE_DETAIL_VALUES.has(d))) {
    throw new Error('Invalid recent-change detail selection')
  }
  const followUp = RECENT_CHANGE_FOLLOWUP.has(payload.answer)
  if (followUp && rawDetail.length === 0) {
    throw new Error('Please select what changed')
  }
  const recentChangeDetail = followUp ? [...new Set(rawDetail)] : []
  // "yes" / "a_little" both mean the skin's behaviour has shifted.
  const recentChange = followUp

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      recentChange,
      recentChangeDetail,
      onboardingStep: 18,
    },
    update: {
      recentChange,
      recentChangeDetail,
    },
  })

  await bumpOnboardingStep(user.id, 18)

  return { ok: true }
}

// ─── Step 19 — Darker areas (broad hyperpigmentation, + inline follow-up) ──
// Captures PIH, sun damage, and post-breakout marks through observable
// experience only. `darkerAreaTriggers` is kept only when Q1 was a "Yes".
const DARKER_AREAS_VALUES = new Set([
  'several_areas',
  'one_area',
  'faded',
  'no',
])
const DARKER_AREA_TRIGGER_VALUES = new Set([
  'sun',
  'irritation',
  'breakouts',
  'no_pattern',
  'not_applicable',
])
const DARKER_AREAS_FOLLOWUP = new Set(['several_areas', 'one_area'])

export type DarkerAreasPayload = {
  darkerAreas: string
  darkerAreaTriggers: string[]
}

export async function saveDarkerAreas(payload: DarkerAreasPayload) {
  const user = await requireSession()

  if (!DARKER_AREAS_VALUES.has(payload.darkerAreas)) {
    throw new Error('Invalid darker-areas selection')
  }
  const rawTriggers = Array.isArray(payload.darkerAreaTriggers)
    ? payload.darkerAreaTriggers
    : []
  if (rawTriggers.some((t) => !DARKER_AREA_TRIGGER_VALUES.has(t))) {
    throw new Error('Invalid darker-area trigger selection')
  }
  const followUp = DARKER_AREAS_FOLLOWUP.has(payload.darkerAreas)
  if (followUp && rawTriggers.length === 0) {
    throw new Error('Please select at least one option')
  }
  const darkerAreaTriggers = followUp ? [...new Set(rawTriggers)] : []

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      darkerAreas: payload.darkerAreas,
      darkerAreaTriggers,
      onboardingStep: 19,
    },
    update: {
      darkerAreas: payload.darkerAreas,
      darkerAreaTriggers,
    },
  })

  await bumpOnboardingStep(user.id, 19)

  return { ok: true }
}

// ─── Step 20 — Environment ────────────────────────────────────
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
    where: { userId: user.id, onboardingStep: { lt: 20 } },
    data: { onboardingStep: 20 },
  })

  return { ok: true }
}

// ─── Step 21 — Tools & Treatments (+ per-item follow-ups) ─────
export type ToolItem = {
  frequency: ToolUsageFrequency
  lastUsed: ToolLastUsed
  faceAreas: string[]
}
export type HomeDeviceItem = ToolItem & { type: HomeDeviceType }
export type ProfessionalTreatmentItem = ToolItem & { type: ProfessionalTreatmentType }
export type ToolsPayload = {
  homeDevices: HomeDeviceItem[]
  professionalTreatments: ProfessionalTreatmentItem[]
}

function assertItem(item: ToolItem, label: string) {
  if (!item.frequency) throw new Error(`${label}: usage frequency is required`)
  if (!item.lastUsed) throw new Error(`${label}: last-used answer is required`)
  const areas = Array.isArray(item.faceAreas) ? item.faceAreas : []
  if (areas.length === 0) throw new Error(`${label}: at least one face area is required`)
  if (areas.some((a) => typeof a !== 'string' || a.trim().length === 0)) {
    throw new Error(`${label}: invalid face area selection`)
  }
}

export async function saveToolsAndTreatments(payload: ToolsPayload) {
  const user = await requireSession()

  const homeDevices = Array.isArray(payload.homeDevices) ? payload.homeDevices : []
  const professionalTreatments = Array.isArray(payload.professionalTreatments)
    ? payload.professionalTreatments
    : []

  for (const d of homeDevices) assertItem(d, `Device "${d.type}"`)
  for (const t of professionalTreatments) assertItem(t, `Treatment "${t.type}"`)

  // Wrapped in a transaction: without it, a failure between the deletes and
  // the recreates (e.g. a transient DB error) would silently wipe the
  // user's previously-saved selections without restoring or replacing them.
  await prisma.$transaction([
    prisma.userHomeDevice.deleteMany({ where: { userId: user.id } }),
    prisma.userProfessionalTreatment.deleteMany({ where: { userId: user.id } }),
    ...(homeDevices.length > 0
      ? [
          prisma.userHomeDevice.createMany({
            data: homeDevices.map((d) => ({
              userId: user.id,
              deviceType: d.type,
              frequency: d.frequency,
              lastUsed: d.lastUsed,
              faceAreas: d.faceAreas,
            })),
          }),
        ]
      : []),
    ...(professionalTreatments.length > 0
      ? [
          prisma.userProfessionalTreatment.createMany({
            data: professionalTreatments.map((t) => ({
              userId: user.id,
              treatmentType: t.type,
              frequency: t.frequency,
              lastUsed: t.lastUsed,
              faceAreas: t.faceAreas,
            })),
          }),
        ]
      : []),
    prisma.userProfile.updateMany({
      where: { userId: user.id, onboardingStep: { lt: 21 } },
      data: { onboardingStep: 21 },
    }),
  ])

  return { ok: true }
}

// ─── Step 22 — Interpretation notice ──────────────────────────
/**
 * The interpretation/scope screen carries no user input — acknowledging it
 * only advances the resume marker so returning users land past it instead
 * of re-reading it. `lt: 22` keeps a further-along user from being pulled
 * backwards if they navigate back to this screen and continue again.
 */
export async function acknowledgeInterpretation() {
  const user = await requireSession()

  await prisma.userProfile.updateMany({
    where: { userId: user.id, onboardingStep: { lt: 22 } },
    data: { onboardingStep: 22 },
  })

  return { ok: true }
}

// ─── Step 23 — "All set" transition ───────────────────────────
/**
 * The "All set" screen is a milestone marker, not the end of onboarding —
 * it sits between the questionnaire and the dossier-building steps.
 * Continuing past it only advances the resume marker.
 */
export async function acknowledgeAllSet() {
  const user = await requireSession()

  await prisma.userProfile.updateMany({
    where: { userId: user.id, onboardingStep: { lt: 23 } },
    data: { onboardingStep: 23 },
  })

  return { ok: true }
}

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

// ─── Step 25 — Product search & add ──────────────────────────
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
      onboardingStep: 25,
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
      sunResponse: true,
      skinUndertone: true,
      pihFrequency: true,
      pihDuration: true,
      unevenPatches: true,
      genderIdentity: true,
      preferredName: true,
      birthMonth: true,
      birthYear: true,
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
