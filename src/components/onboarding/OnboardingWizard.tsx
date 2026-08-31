'use client'

import { useReducer, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { completeOnboarding } from '@/app/actions/onboarding'
import { StepWelcome } from './StepWelcome'
import { StepIdentity } from './StepIdentity'
import { StepSkinType } from './StepSkinType'
import { StepSunResponse } from './StepSunResponse'
import { StepUndertone } from './StepUndertone'
import { StepPihFrequency } from './StepPihFrequency'
import { StepPihDuration } from './StepPihDuration'
import { StepUnevenPatches } from './StepUnevenPatches'
import { StepSkinTone } from './StepSkinTone'
import { StepEnvironment } from './StepEnvironment'
import { StepTools } from './StepTools'
import type { ToolItemState } from './StepTools'
import { StepInterpretation } from './StepInterpretation'
import { StepDossierIntro } from './StepDossierIntro'
import { StepProducts } from './StepProducts'
import { StepCompletion } from './StepCompletion'
import { StepCounter } from './StepCounter'
import { OnboardingSignOut } from './OnboardingSignOut'
import {
  InterstitialScreen,
  findInterstitialAfter,
  getInterstitialById,
} from './interstitials'
import { StepProductReactivity } from './StepProductReactivity'
import { StepReactionHistory } from './StepReactionHistory'
import { StepBreakouts } from './StepBreakouts'
import { StepRedness } from './StepRedness'
import { StepFlushing } from './StepFlushing'
import { StepMelasma } from './StepMelasma'
import type {
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
  MelasmaPattern,
} from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────
export type WizardUser = {
  id: string
  email: string
  name: string | null
}

type WizardState = {
  step: number
  // When non-null, the wizard shows this transition screen *instead of* the
  // step content. `step` still points at the step just finished, so the
  // counter and every other derived value stay put. Interstitials never
  // persist and are forward-flow only (Back from one returns to `step`).
  interstitialId: string | null
  isTransitioning: boolean
  genderIdentity: string
  preferredName: string
  birthMonth: string
  birthYear: string
  skinType: string
  skinToneScale: number | null
  vitiligo: boolean
  sunResponse: number | null
  skinUndertone: SkinUndertone | null
  pihFrequency: PIHFrequency | null
  pihDuration: PIHDuration | null
  unevenPatches: TanPattern | null
  productReactivity: ProductReactivity | null
  inflammatoryHistory: InflammatoryHistory | null
  productReactionSeverity: ProductReactionSeverity | null
  breakoutPattern: BreakoutPattern | null
  breakoutAreas: string[]
  rednessPattern: RednessPattern | null
  rednessAreas: string[]
  flushTriggers: string[]
  flushFadeSpeed: FlushFadeSpeed | null
  melasmaPattern: MelasmaPattern | null
  melasmaTriggers: string[]
  city: string
  countryCode: string
  climateZone: string
  season: string
  homeDevices: ToolItemState[]
  professionalTreatments: ToolItemState[]
}

type WizardAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SHOW_INTERSTITIAL'; id: string }
  | { type: 'CLEAR_INTERSTITIAL' }
  | { type: 'SET_TRANSITIONING'; value: boolean }
  | { type: 'SET_GENDER'; value: string }
  | { type: 'SET_PREFERRED_NAME'; value: string }
  | { type: 'SET_BIRTH_MONTH'; value: string }
  | { type: 'SET_BIRTH_YEAR'; value: string }
  | { type: 'SET_SKIN_TYPE'; value: string }
  | { type: 'SET_SKIN_TONE'; value: number }
  | { type: 'SET_VITILIGO'; value: boolean }
  | { type: 'SET_SUN_RESPONSE'; value: number }
  | { type: 'SET_UNDERTONE'; value: SkinUndertone }
  | { type: 'SET_PIH_FREQUENCY'; value: PIHFrequency }
  | { type: 'SET_PIH_DURATION'; value: PIHDuration }
  | { type: 'SET_UNEVEN_PATCHES'; value: TanPattern }
  | { type: 'SET_PRODUCT_REACTIVITY'; value: ProductReactivity }
  | { type: 'SET_INFLAMMATORY_HISTORY'; value: InflammatoryHistory }
  | { type: 'SET_PRODUCT_REACTION_SEVERITY'; value: ProductReactionSeverity }
  | { type: 'SET_BREAKOUT_PATTERN'; value: BreakoutPattern }
  | { type: 'SET_BREAKOUT_AREAS'; value: string[] }
  | { type: 'SET_REDNESS_PATTERN'; value: RednessPattern }
  | { type: 'SET_REDNESS_AREAS'; value: string[] }
  | { type: 'SET_FLUSH_TRIGGERS'; value: string[] }
  | { type: 'SET_FLUSH_FADE_SPEED'; value: FlushFadeSpeed }
  | { type: 'SET_MELASMA_PATTERN'; value: MelasmaPattern }
  | { type: 'SET_MELASMA_TRIGGERS'; value: string[] }
  | { type: 'SET_ENVIRONMENT'; city: string; countryCode: string; climateZone: string; season: string }
  | { type: 'SET_HOME_DEVICES'; value: ToolItemState[] }
  | { type: 'SET_PRO_TREATMENTS'; value: ToolItemState[] }

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':           return { ...state, step: action.step, interstitialId: null }
    case 'SHOW_INTERSTITIAL':  return { ...state, interstitialId: action.id }
    case 'CLEAR_INTERSTITIAL': return { ...state, interstitialId: null }
    case 'SET_TRANSITIONING':  return { ...state, isTransitioning: action.value }
    case 'SET_GENDER':         return { ...state, genderIdentity: action.value }
    case 'SET_PREFERRED_NAME': return { ...state, preferredName: action.value }
    case 'SET_BIRTH_MONTH':    return { ...state, birthMonth: action.value }
    case 'SET_BIRTH_YEAR':     return { ...state, birthYear: action.value }
    case 'SET_SKIN_TYPE':      return { ...state, skinType: action.value }
    case 'SET_SKIN_TONE':      return { ...state, skinToneScale: action.value }
    case 'SET_VITILIGO':       return { ...state, vitiligo: action.value }
    case 'SET_SUN_RESPONSE':   return { ...state, sunResponse: action.value }
    case 'SET_UNDERTONE':      return { ...state, skinUndertone: action.value }
    case 'SET_PIH_FREQUENCY':  return { ...state, pihFrequency: action.value }
    case 'SET_PIH_DURATION':   return { ...state, pihDuration: action.value }
    case 'SET_UNEVEN_PATCHES': return { ...state, unevenPatches: action.value }
    case 'SET_PRODUCT_REACTIVITY': return { ...state, productReactivity: action.value }
    case 'SET_INFLAMMATORY_HISTORY': return { ...state, inflammatoryHistory: action.value }
    case 'SET_PRODUCT_REACTION_SEVERITY': return { ...state, productReactionSeverity: action.value }
    case 'SET_BREAKOUT_PATTERN': return { ...state, breakoutPattern: action.value }
    case 'SET_BREAKOUT_AREAS': return { ...state, breakoutAreas: action.value }
    case 'SET_REDNESS_PATTERN': return { ...state, rednessPattern: action.value }
    case 'SET_REDNESS_AREAS': return { ...state, rednessAreas: action.value }
    case 'SET_FLUSH_TRIGGERS': return { ...state, flushTriggers: action.value }
    case 'SET_FLUSH_FADE_SPEED': return { ...state, flushFadeSpeed: action.value }
    case 'SET_MELASMA_PATTERN': return { ...state, melasmaPattern: action.value }
    case 'SET_MELASMA_TRIGGERS': return { ...state, melasmaTriggers: action.value }
    case 'SET_ENVIRONMENT':    return { ...state, city: action.city, countryCode: action.countryCode, climateZone: action.climateZone, season: action.season }
    case 'SET_HOME_DEVICES':   return { ...state, homeDevices: action.value }
    case 'SET_PRO_TREATMENTS': return { ...state, professionalTreatments: action.value }
    default: return state
  }
}

// step 0 = welcome, steps 1–20 = wizard steps. Step 20 (product picker) is
// the last one and completes onboarding itself, so there is no separate
// completion step beyond it. TOTAL_STEPS is the count of *possible* screens;
// the number shown to the user is derived from activeScreens() below, which
// drops any screen skipped for this user's answers.
const TOTAL_STEPS = 20

// Screen 6 (PIH duration) is a follow-up shown only when PIH frequency is
// "often" or "sometimes". Every other screen is always shown.
const CONDITIONAL_SCREEN_PIH_DURATION = 6

// Screen 9 (reaction history) is a follow-up shown only when product
// reactivity was "frequent stinging" or "mild transient reaction".
const CONDITIONAL_SCREEN_REACTION_HISTORY = 9

// Screen 13 (flushing triggers + fade speed) is a follow-up shown only when
// the redness pattern was "persistent" or "intermittent".
const CONDITIONAL_SCREEN_FLUSHING = 13

/**
 * Ordered list of the wizard screen numbers active for this user's current
 * answers. Skipped conditional screens simply don't appear, so navigating
 * and the progress counter both renumber automatically — add a screen to
 * this filter and nothing else needs to change.
 */
type ConditionalAnswers = Pick<
  WizardState,
  'pihFrequency' | 'productReactivity' | 'rednessPattern'
>

function computeActiveScreens(answers: ConditionalAnswers): number[] {
  const pihDurationApplies =
    answers.pihFrequency === 'OFTEN' || answers.pihFrequency === 'SOMETIMES'
  const reactionHistoryApplies =
    answers.productReactivity === 'FREQUENT_STING' ||
    answers.productReactivity === 'MILD_TRANSIENT'
  const flushingApplies =
    answers.rednessPattern === 'PERSISTENT' ||
    answers.rednessPattern === 'INTERMITTENT'
  const screens: number[] = []
  for (let n = 1; n <= TOTAL_STEPS; n++) {
    if (n === CONDITIONAL_SCREEN_PIH_DURATION && !pihDurationApplies) continue
    if (n === CONDITIONAL_SCREEN_REACTION_HISTORY && !reactionHistoryApplies) continue
    if (n === CONDITIONAL_SCREEN_FLUSHING && !flushingApplies) continue
    screens.push(n)
  }
  return screens
}

function activeScreens(state: WizardState): number[] {
  return computeActiveScreens(state)
}

/** Answers already saved on the profile, used to repopulate fields on resume. */
export type WizardInitialProfile = {
  genderIdentity?: string | null
  preferredName?: string | null
  birthMonth?: number | null
  birthYear?: number | null
  skinToneScale?: number | null
  vitiligo?: boolean | null
  sunResponse?: number | null
  skinUndertone?: SkinUndertone | null
  pihFrequency?: PIHFrequency | null
  pihDuration?: PIHDuration | null
  unevenPatches?: TanPattern | null
  productReactivity?: ProductReactivity | null
  inflammatoryHistory?: InflammatoryHistory | null
  productReactionSeverity?: ProductReactionSeverity | null
  breakoutPattern?: BreakoutPattern | null
  breakoutAreas?: string[] | null
  rednessPattern?: RednessPattern | null
  rednessAreas?: string[] | null
  flushTriggers?: string[] | null
  flushFadeSpeed?: FlushFadeSpeed | null
  melasmaPattern?: MelasmaPattern | null
  melasmaTriggers?: string[] | null
  skinType?: string | null
  city?: string | null
  countryCode?: string | null
  climateZone?: string | null
  season?: string | null
  homeDevices?: ToolItemState[] | null
  professionalTreatments?: ToolItemState[] | null
}

export function OnboardingWizard({
  user,
  initialStep = 0,
  initialProfile,
}: {
  user: WizardUser
  initialStep?: number
  initialProfile?: WizardInitialProfile | null
}) {
  const rawResumeStep = initialStep >= 2 ? initialStep + 1 : 1
  // The stored onboardingStep can land exactly on a conditional screen this
  // user's answers skip (e.g. leaving right after PIH frequency = "never",
  // whose stored step is 5, would resume at 6 — the duration follow-up that
  // branch is meant to skip). Snap forward to the first screen that is
  // actually active for these answers so the counter and Back button, which
  // both index into activeScreens(), never see an out-of-list step.
  const resumeActiveScreens = computeActiveScreens({
    pihFrequency: initialProfile?.pihFrequency ?? null,
    productReactivity: initialProfile?.productReactivity ?? null,
    rednessPattern: initialProfile?.rednessPattern ?? null,
  })
  const resumeStep =
    rawResumeStep <= 1
      ? 1
      : resumeActiveScreens.find((n) => n >= rawResumeStep) ??
        resumeActiveScreens[resumeActiveScreens.length - 1]

  const [state, dispatch] = useReducer(wizardReducer, {
    step: resumeStep > TOTAL_STEPS ? TOTAL_STEPS : resumeStep,
    // Interstitials never persist — a resuming user simply doesn't see the
    // one that would have followed the step they left off on.
    interstitialId: null,
    isTransitioning: false,
    genderIdentity: initialProfile?.genderIdentity ?? '',
    preferredName: initialProfile?.preferredName ?? '',
    birthMonth: initialProfile?.birthMonth ? String(initialProfile.birthMonth) : '',
    birthYear: initialProfile?.birthYear ? String(initialProfile.birthYear) : '',
    skinType: initialProfile?.skinType ?? '',
    skinToneScale: initialProfile?.skinToneScale ?? null,
    // null (never answered) and false both open the toggle in its off state.
    vitiligo: initialProfile?.vitiligo ?? false,
    sunResponse: initialProfile?.sunResponse ?? null,
    skinUndertone: initialProfile?.skinUndertone ?? null,
    pihFrequency: initialProfile?.pihFrequency ?? null,
    pihDuration: initialProfile?.pihDuration ?? null,
    unevenPatches: initialProfile?.unevenPatches ?? null,
    productReactivity: initialProfile?.productReactivity ?? null,
    inflammatoryHistory: initialProfile?.inflammatoryHistory ?? null,
    productReactionSeverity: initialProfile?.productReactionSeverity ?? null,
    breakoutPattern: initialProfile?.breakoutPattern ?? null,
    breakoutAreas: initialProfile?.breakoutAreas ?? [],
    rednessPattern: initialProfile?.rednessPattern ?? null,
    rednessAreas: initialProfile?.rednessAreas ?? [],
    flushTriggers: initialProfile?.flushTriggers ?? [],
    flushFadeSpeed: initialProfile?.flushFadeSpeed ?? null,
    melasmaPattern: initialProfile?.melasmaPattern ?? null,
    melasmaTriggers: initialProfile?.melasmaTriggers ?? [],
    city: initialProfile?.city ?? '',
    countryCode: initialProfile?.countryCode ?? '',
    climateZone: initialProfile?.climateZone ?? '',
    season: initialProfile?.season ?? '',
    homeDevices: initialProfile?.homeDevices ?? [],
    professionalTreatments: initialProfile?.professionalTreatments ?? [],
  })

  const contentRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // The product picker is the final step, so it — not a trailing completion
  // screen — is what marks onboarding complete and hands the user to the
  // Studio. Errors propagate to StepProducts, which surfaces them.
  const completeAndEnterStudio = useCallback(async () => {
    await completeOnboarding()
    router.push('/studio')
  }, [router])

  useEffect(() => {
    const node = containerRef.current
    const ctx = gsap.context(() => {
      gsap.fromTo(node, { opacity: 0 }, { opacity: 1, duration: 1.0, ease: 'power2.out' })
    })
    return () => ctx.revert()
  }, [])

  // Shared fade-out → apply → fade-in choreography. `applyChange` dispatches
  // whatever swaps the visible screen (a step change, or showing/clearing an
  // interstitial); the animation around it is identical either way.
  const runTransition = useCallback((applyChange: () => void) => {
    const node = contentRef.current
    if (state.isTransitioning || !node) {
      applyChange()
      return
    }
    dispatch({ type: 'SET_TRANSITIONING', value: true })
    gsap.to(node, {
      opacity: 0,
      y: -12,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        applyChange()
        const target = contentRef.current
        if (!target) { dispatch({ type: 'SET_TRANSITIONING', value: false }); return }
        gsap.fromTo(target, { opacity: 0, y: 18 }, {
          opacity: 1, y: 0, duration: 0.55, ease: 'power3.out',
          onComplete: () => dispatch({ type: 'SET_TRANSITIONING', value: false }),
        })
      },
    })
  }, [state.isTransitioning])

  const transitionToStep = useCallback((nextStep: number) => {
    runTransition(() => dispatch({ type: 'SET_STEP', step: nextStep }))
  }, [runTransition])

  // Navigation walks the *active* screens for this user, so a skipped
  // conditional screen (e.g. PIH duration after "rarely" / "never") is
  // stepped straight over in both directions with no special-casing.
  const screens = activeScreens(state)

  const goNext = useCallback(() => {
    // On an interstitial: Continue clears it and advances to the real step.
    if (state.interstitialId) {
      const list = activeScreens(state)
      const i = list.indexOf(state.step)
      const next = i >= 0 && i < list.length - 1 ? list[i + 1] : state.step + 1
      transitionToStep(next)
      return
    }
    // On a step: if an interstitial is registered after it, show that first
    // and leave `step` where it is — goNext() called again from the
    // interstitial then advances to the real next step.
    const pending = findInterstitialAfter(state.step, state)
    if (pending) {
      runTransition(() => dispatch({ type: 'SHOW_INTERSTITIAL', id: pending.id }))
      return
    }
    const list = activeScreens(state)
    const i = list.indexOf(state.step)
    const next = i >= 0 && i < list.length - 1 ? list[i + 1] : state.step + 1
    transitionToStep(next)
  }, [state, transitionToStep, runTransition])

  const goBack = useCallback(() => {
    // Back from an interstitial just returns to the step it followed.
    if (state.interstitialId) {
      runTransition(() => dispatch({ type: 'CLEAR_INTERSTITIAL' }))
      return
    }
    const list = activeScreens(state)
    const i = list.indexOf(state.step)
    if (i > 0) transitionToStep(list[i - 1])
  }, [state, transitionToStep, runTransition])

  // Screen 07 (PIH frequency, step 5) routing per its spec:
  //   often | sometimes → Screen 08 (step 6, the duration follow-up)
  //   rarely | never    → Screen 09 (step 7, skipping the follow-up)
  // The answer is already in state by the time this fires, so activeScreens()
  // reflects it and goNext() lands on the right screen on its own.
  const handlePihContinue = useCallback(() => goNext(), [goNext])

  // steps 1–TOTAL_STEPS show the counter (the step 0 welcome screen doesn't);
  // interstitials hide it — they are framing, not a counted step.
  const showCounter =
    state.step >= 1 && state.step <= TOTAL_STEPS && !state.interstitialId
  const activeInterstitial = state.interstitialId
    ? getInterstitialById(state.interstitialId)
    : null
  // Position within the screens active for this user, not the raw step number.
  const counterCurrent = Math.max(1, screens.indexOf(state.step) + 1)
  const counterTotal = screens.length

  return (
    <div
      ref={containerRef}
      style={{
        height: '100dvh',
        backgroundColor: 'var(--color-obsidian-950)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        opacity: 0,
        overflow: 'hidden',
      }}
    >
      {/* Ambient gradient */}
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

      {/* Top bar */}
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

        {showCounter && <StepCounter current={counterCurrent} total={counterTotal} />}

        <OnboardingSignOut />
      </header>

      {/* Main content */}
      <main
        style={{
          position: 'relative', zIndex: 10, flex: 1,
          display: 'flex', alignItems: 'safe center', justifyContent: 'center',
          padding: 'clamp(1rem, 3vh, 2.5rem) clamp(1.5rem, 5vw, 4rem)',
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        <div ref={contentRef} style={{ width: '100%', maxWidth: '680px' }}>

          {activeInterstitial ? (
            <InterstitialScreen
              interstitial={activeInterstitial}
              onContinue={goNext}
              onBack={goBack}
            />
          ) : (
          <>

          {state.step === 0 && <StepWelcome user={user} onContinue={goNext} />}

          {state.step === 1 && (
            <StepIdentity
              value={state.genderIdentity}
              onChange={(v) => dispatch({ type: 'SET_GENDER', value: v })}
              preferredName={state.preferredName}
              onPreferredNameChange={(v) => dispatch({ type: 'SET_PREFERRED_NAME', value: v })}
              birthMonth={state.birthMonth}
              onBirthMonthChange={(v) => dispatch({ type: 'SET_BIRTH_MONTH', value: v })}
              birthYear={state.birthYear}
              onBirthYearChange={(v) => dispatch({ type: 'SET_BIRTH_YEAR', value: v })}
              onContinue={goNext}
            />
          )}

          {state.step === 2 && (
            <StepSkinTone
              value={state.skinToneScale}
              onChange={(v) => dispatch({ type: 'SET_SKIN_TONE', value: v })}
              vitiligo={state.vitiligo}
              onVitiligoChange={(v) => dispatch({ type: 'SET_VITILIGO', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 3 && (
            <StepSunResponse
              value={state.sunResponse}
              onChange={(v) => dispatch({ type: 'SET_SUN_RESPONSE', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 4 && (
            <StepUndertone
              value={state.skinUndertone}
              onChange={(v) => dispatch({ type: 'SET_UNDERTONE', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 5 && (
            <StepPihFrequency
              value={state.pihFrequency}
              onChange={(v) => dispatch({ type: 'SET_PIH_FREQUENCY', value: v })}
              onContinue={handlePihContinue}
              onBack={goBack}
            />
          )}

          {state.step === 6 && (
            <StepPihDuration
              value={state.pihDuration}
              onChange={(v) => dispatch({ type: 'SET_PIH_DURATION', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 7 && (
            <StepUnevenPatches
              value={state.unevenPatches}
              onChange={(v) => dispatch({ type: 'SET_UNEVEN_PATCHES', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 8 && (
            <StepProductReactivity
              value={state.productReactivity}
              onChange={(v) => dispatch({ type: 'SET_PRODUCT_REACTIVITY', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 9 && (
            <StepReactionHistory
              historyValue={state.inflammatoryHistory}
              severityValue={state.productReactionSeverity}
              onHistoryChange={(v) => dispatch({ type: 'SET_INFLAMMATORY_HISTORY', value: v })}
              onSeverityChange={(v) => dispatch({ type: 'SET_PRODUCT_REACTION_SEVERITY', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 10 && (
            <StepSkinType
              value={state.skinType}
              onChange={(v) => dispatch({ type: 'SET_SKIN_TYPE', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 11 && (
            <StepBreakouts
              pattern={state.breakoutPattern}
              areas={state.breakoutAreas}
              onPatternChange={(v) => dispatch({ type: 'SET_BREAKOUT_PATTERN', value: v })}
              onAreasChange={(v) => dispatch({ type: 'SET_BREAKOUT_AREAS', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 12 && (
            <StepRedness
              pattern={state.rednessPattern}
              areas={state.rednessAreas}
              onPatternChange={(v) => dispatch({ type: 'SET_REDNESS_PATTERN', value: v })}
              onAreasChange={(v) => dispatch({ type: 'SET_REDNESS_AREAS', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 13 && (
            <StepFlushing
              triggers={state.flushTriggers}
              fadeSpeed={state.flushFadeSpeed}
              onTriggersChange={(v) => dispatch({ type: 'SET_FLUSH_TRIGGERS', value: v })}
              onFadeSpeedChange={(v) => dispatch({ type: 'SET_FLUSH_FADE_SPEED', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 14 && (
            <StepMelasma
              pattern={state.melasmaPattern}
              triggers={state.melasmaTriggers}
              onPatternChange={(v) => dispatch({ type: 'SET_MELASMA_PATTERN', value: v })}
              onTriggersChange={(v) => dispatch({ type: 'SET_MELASMA_TRIGGERS', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 15 && (
            <StepEnvironment
              city={state.city}
              countryCode={state.countryCode}
              climateZone={state.climateZone}
              season={state.season}
              onChange={(data) =>
                dispatch({
                  type: 'SET_ENVIRONMENT',
                  city: data.city,
                  countryCode: data.countryCode,
                  climateZone: data.climateZone,
                  season: data.season,
                })
              }
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 16 && (
            <StepTools
              homeDevices={state.homeDevices}
              professionalTreatments={state.professionalTreatments}
              onHomeDevicesChange={(v) => dispatch({ type: 'SET_HOME_DEVICES', value: v })}
              onProfessionalTreatmentsChange={(v) => dispatch({ type: 'SET_PRO_TREATMENTS', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 17 && (
            <StepInterpretation onContinue={goNext} onBack={goBack} />
          )}

          {state.step === 18 && <StepCompletion onContinue={goNext} onBack={goBack} />}

          {state.step === 19 && (
            <StepDossierIntro onContinue={goNext} onBack={goBack} />
          )}

          {state.step === 20 && (
            <StepProducts onComplete={completeAndEnterStudio} />
          )}

          </>
          )}

        </div>
      </main>
    </div>
  )
}
