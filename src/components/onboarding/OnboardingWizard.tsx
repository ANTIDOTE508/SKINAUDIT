'use client'

import { useReducer, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { completeOnboarding } from '@/app/actions/onboarding'
import { StepBaselineTransition } from './StepBaselineTransition'
import { StepIdentity } from './StepIdentity'
import { StepSkinTypeSelfId } from './StepSkinTypeSelfId'
import { StepPrimaryConcerns } from './StepPrimaryConcerns'
import { StepSkinGoals } from './StepSkinGoals'
import { StepExperienceLevel } from './StepExperienceLevel'
import { StepSkinType } from './StepSkinType'
import { StepSunResponse } from './StepSunResponse'
import { StepUndertone } from './StepUndertone'
import { StepPihFrequency } from './StepPihFrequency'
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
  BASELINE_AFTER_IDENTITY_ID,
  PATTERNS_AFTER_EXPERIENCE_ID,
} from './interstitials'
import { StepProductReactivity } from './StepProductReactivity'
import { StepRecoveryTime } from './StepRecoveryTime'
import { StepDehydrationCheck } from './StepDehydrationCheck'
import { StepBreakouts } from './StepBreakouts'
import { StepRedness } from './StepRedness'
import { StepCurrentState } from './StepCurrentState'
import { StepRecentChange } from './StepRecentChange'
import { StepDarkerAreas } from './StepDarkerAreas'
import type {
  SkinType,
  SkincareExperience,
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
  RecoveryTime,
  OilyAndTight,
} from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────
export type WizardUser = {
  id: string
  email: string
  name: string | null
}

type WizardState = {
  // step 0 = the full-bleed baseline transition screen; steps 1–25 = the
  // numbered wizard steps. Step 0 is a real navigation position: a new user
  // starts there, and Back from step 1 returns to it. It is not counted by
  // StepCounter and never appears in activeScreens().
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
  primaryConcerns: string[]
  goals: string[]
  skincareExperience: SkincareExperience | null
  skinToneScale: number | null
  sunResponse: number | null
  skinUndertone: SkinUndertone | null
  pihFrequency: PIHFrequency | null
  pihDuration: PIHDuration | null
  unevenPatches: TanPattern | null
  productReactivity: ProductReactivity | null
  inflammatoryHistory: InflammatoryHistory | null
  productReactionSeverity: ProductReactionSeverity | null
  recoveryTime: RecoveryTime | null
  oilyAndTight: OilyAndTight | null
  breakoutPattern: BreakoutPattern | null
  breakoutAreas: string[]
  rednessPattern: RednessPattern | null
  rednessAreas: string[]
  flushTriggers: string[]
  flushFadeSpeed: FlushFadeSpeed | null
  currentStateNormal: string
  currentStateDiffs: string[]
  recentChangeAnswer: string
  recentChangeDetail: string[]
  darkerAreas: string
  darkerAreaTriggers: string[]
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
  | { type: 'SET_PRIMARY_CONCERNS'; value: string[] }
  | { type: 'SET_GOALS'; value: string[] }
  | { type: 'SET_EXPERIENCE'; value: SkincareExperience }
  | { type: 'SET_SKIN_TONE'; value: number }
  | { type: 'SET_SUN_RESPONSE'; value: number }
  | { type: 'SET_UNDERTONE'; value: SkinUndertone }
  | { type: 'SET_PIH_FREQUENCY'; value: PIHFrequency }
  | { type: 'SET_PIH_DURATION'; value: PIHDuration }
  | { type: 'SET_UNEVEN_PATCHES'; value: TanPattern }
  | { type: 'SET_PRODUCT_REACTIVITY'; value: ProductReactivity }
  | { type: 'SET_INFLAMMATORY_HISTORY'; value: InflammatoryHistory }
  | { type: 'SET_PRODUCT_REACTION_SEVERITY'; value: ProductReactionSeverity }
  | { type: 'SET_RECOVERY_TIME'; value: RecoveryTime }
  | { type: 'SET_OILY_AND_TIGHT'; value: OilyAndTight }
  | { type: 'SET_BREAKOUT_PATTERN'; value: BreakoutPattern }
  | { type: 'SET_BREAKOUT_AREAS'; value: string[] }
  | { type: 'SET_REDNESS_PATTERN'; value: RednessPattern }
  | { type: 'SET_REDNESS_AREAS'; value: string[] }
  | { type: 'SET_FLUSH_TRIGGERS'; value: string[] }
  | { type: 'SET_FLUSH_FADE_SPEED'; value: FlushFadeSpeed }
  | { type: 'SET_CURRENT_STATE_NORMAL'; value: string }
  | { type: 'SET_CURRENT_STATE_DIFFS'; value: string[] }
  | { type: 'SET_RECENT_CHANGE_ANSWER'; value: string }
  | { type: 'SET_RECENT_CHANGE_DETAIL'; value: string[] }
  | { type: 'SET_DARKER_AREAS'; value: string }
  | { type: 'SET_DARKER_AREA_TRIGGERS'; value: string[] }
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
    case 'SET_PRIMARY_CONCERNS': return { ...state, primaryConcerns: action.value }
    case 'SET_GOALS':          return { ...state, goals: action.value }
    case 'SET_EXPERIENCE':     return { ...state, skincareExperience: action.value }
    case 'SET_SKIN_TONE':      return { ...state, skinToneScale: action.value }
    case 'SET_SUN_RESPONSE':   return { ...state, sunResponse: action.value }
    case 'SET_UNDERTONE':      return { ...state, skinUndertone: action.value }
    case 'SET_PIH_FREQUENCY':  return { ...state, pihFrequency: action.value }
    case 'SET_PIH_DURATION':   return { ...state, pihDuration: action.value }
    case 'SET_UNEVEN_PATCHES': return { ...state, unevenPatches: action.value }
    case 'SET_PRODUCT_REACTIVITY': return { ...state, productReactivity: action.value }
    case 'SET_INFLAMMATORY_HISTORY': return { ...state, inflammatoryHistory: action.value }
    case 'SET_PRODUCT_REACTION_SEVERITY': return { ...state, productReactionSeverity: action.value }
    case 'SET_RECOVERY_TIME': return { ...state, recoveryTime: action.value }
    case 'SET_OILY_AND_TIGHT': return { ...state, oilyAndTight: action.value }
    case 'SET_BREAKOUT_PATTERN': return { ...state, breakoutPattern: action.value }
    case 'SET_BREAKOUT_AREAS': return { ...state, breakoutAreas: action.value }
    case 'SET_REDNESS_PATTERN': return { ...state, rednessPattern: action.value }
    case 'SET_REDNESS_AREAS': return { ...state, rednessAreas: action.value }
    case 'SET_FLUSH_TRIGGERS': return { ...state, flushTriggers: action.value }
    case 'SET_FLUSH_FADE_SPEED': return { ...state, flushFadeSpeed: action.value }
    case 'SET_CURRENT_STATE_NORMAL': return { ...state, currentStateNormal: action.value }
    case 'SET_CURRENT_STATE_DIFFS': return { ...state, currentStateDiffs: action.value }
    case 'SET_RECENT_CHANGE_ANSWER': return { ...state, recentChangeAnswer: action.value }
    case 'SET_RECENT_CHANGE_DETAIL': return { ...state, recentChangeDetail: action.value }
    case 'SET_DARKER_AREAS': return { ...state, darkerAreas: action.value }
    case 'SET_DARKER_AREA_TRIGGERS': return { ...state, darkerAreaTriggers: action.value }
    case 'SET_ENVIRONMENT':    return { ...state, city: action.city, countryCode: action.countryCode, climateZone: action.climateZone, season: action.season }
    case 'SET_HOME_DEVICES':   return { ...state, homeDevices: action.value }
    case 'SET_PRO_TREATMENTS': return { ...state, professionalTreatments: action.value }
    default: return state
  }
}

// step 0 = full-bleed baseline transition screen (not counted); steps 1–25 =
// the numbered wizard steps. Step 25 (product picker) is
// the last one and completes onboarding itself, so there is no separate
// completion step beyond it. Every follow-up now lives inline on its
// master step's screen, so there are no conditionally-skipped screens —
// the flow is a straight 1…TOTAL_STEPS walk.
const TOTAL_STEPS = 25

const ALL_SCREENS: number[] = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1)

function activeScreens(): number[] {
  return ALL_SCREENS
}

/** Answers already saved on the profile, used to repopulate fields on resume. */
export type WizardInitialProfile = {
  genderIdentity?: string | null
  preferredName?: string | null
  birthMonth?: number | null
  birthYear?: number | null
  skinToneScale?: number | null
  sunResponse?: number | null
  skinUndertone?: SkinUndertone | null
  pihFrequency?: PIHFrequency | null
  pihDuration?: PIHDuration | null
  unevenPatches?: TanPattern | null
  productReactivity?: ProductReactivity | null
  inflammatoryHistory?: InflammatoryHistory | null
  productReactionSeverity?: ProductReactionSeverity | null
  recoveryTime?: RecoveryTime | null
  oilyAndTight?: OilyAndTight | null
  breakoutPattern?: BreakoutPattern | null
  breakoutAreas?: string[] | null
  rednessPattern?: RednessPattern | null
  rednessAreas?: string[] | null
  flushTriggers?: string[] | null
  flushFadeSpeed?: FlushFadeSpeed | null
  currentStateNormal?: string | null
  currentStateDiffs?: string[] | null
  recentChange?: boolean | null
  recentChangeDetail?: string[] | null
  darkerAreas?: string | null
  darkerAreaTriggers?: string[] | null
  skinType?: string | null
  primaryConcerns?: string[] | null
  goals?: string[] | null
  skincareExperience?: SkincareExperience | null
  city?: string | null
  countryCode?: string | null
  climateZone?: string | null
  season?: string | null
  homeDevices?: ToolItemState[] | null
  professionalTreatments?: ToolItemState[] | null
}

export function OnboardingWizard({
  initialStep = 0,
  initialProfile,
}: {
  // Kept in the prop contract (page.tsx supplies it) though no screen reads it
  // any more since the personalised welcome step was removed.
  user?: WizardUser
  initialStep?: number
  initialProfile?: WizardInitialProfile | null
}) {
  // `initialStep` is the stored resume marker: 0 = nothing saved yet, N = step
  // N was completed. A brand-new user (0) opens on the step 0 transition
  // screen; anyone who has completed at least step 1 resumes on a numbered
  // step. Steps 2+ resume one past the marker (existing rule); step 1 stays on
  // step 1.
  const resumeStep =
    initialStep <= 0
      ? 0
      : initialStep === 1
        ? 1
        : Math.min(initialStep + 1, TOTAL_STEPS)

  const [state, dispatch] = useReducer(wizardReducer, {
    step: resumeStep,
    // Interstitials never persist — a resuming user simply doesn't see the
    // one that would have followed the step they left off on.
    interstitialId: null,
    isTransitioning: false,
    genderIdentity: initialProfile?.genderIdentity ?? '',
    preferredName: initialProfile?.preferredName ?? '',
    birthMonth: initialProfile?.birthMonth ? String(initialProfile.birthMonth) : '',
    birthYear: initialProfile?.birthYear ? String(initialProfile.birthYear) : '',
    skinType: initialProfile?.skinType ?? '',
    primaryConcerns: initialProfile?.primaryConcerns ?? [],
    goals: initialProfile?.goals ?? [],
    skincareExperience: initialProfile?.skincareExperience ?? null,
    skinToneScale: initialProfile?.skinToneScale ?? null,
    sunResponse: initialProfile?.sunResponse ?? null,
    skinUndertone: initialProfile?.skinUndertone ?? null,
    pihFrequency: initialProfile?.pihFrequency ?? null,
    pihDuration: initialProfile?.pihDuration ?? null,
    unevenPatches: initialProfile?.unevenPatches ?? null,
    productReactivity: initialProfile?.productReactivity ?? null,
    inflammatoryHistory: initialProfile?.inflammatoryHistory ?? null,
    productReactionSeverity: initialProfile?.productReactionSeverity ?? null,
    recoveryTime: initialProfile?.recoveryTime ?? null,
    oilyAndTight: initialProfile?.oilyAndTight ?? null,
    breakoutPattern: initialProfile?.breakoutPattern ?? null,
    breakoutAreas: initialProfile?.breakoutAreas ?? [],
    rednessPattern: initialProfile?.rednessPattern ?? null,
    rednessAreas: initialProfile?.rednessAreas ?? [],
    flushTriggers: initialProfile?.flushTriggers ?? [],
    flushFadeSpeed: initialProfile?.flushFadeSpeed ?? null,
    currentStateNormal: initialProfile?.currentStateNormal ?? '',
    currentStateDiffs: initialProfile?.currentStateDiffs ?? [],
    // `recentChange` is stored as a boolean; the tri-state UI answer isn't
    // persisted, so on resume the pill is re-derived from the boolean:
    // true → "yes", false → "no", null → unanswered.
    recentChangeAnswer:
      initialProfile?.recentChange == null
        ? ''
        : initialProfile.recentChange
          ? 'yes'
          : 'no',
    recentChangeDetail: initialProfile?.recentChangeDetail ?? [],
    darkerAreas: initialProfile?.darkerAreas ?? '',
    darkerAreaTriggers: initialProfile?.darkerAreaTriggers ?? [],
    city: initialProfile?.city ?? '',
    countryCode: initialProfile?.countryCode ?? '',
    climateZone: initialProfile?.climateZone ?? '',
    season: initialProfile?.season ?? '',
    homeDevices: initialProfile?.homeDevices ?? [],
    professionalTreatments: initialProfile?.professionalTreatments ?? [],
  })

  const contentRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  // Guards the anti-double-click lock so it always releases even if a GSAP
  // callback never fires (tab backgrounded, reduced-motion, unmount mid-tween).
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current)
    gsap.killTweensOf(contentRef.current)
  }, [])

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
  // interstitial).
  //
  // The state change is dispatched SYNCHRONOUSLY — never from a GSAP callback.
  // If it lived in `onComplete`, any environment where the tween doesn't
  // complete (tab backgrounded so rAF is frozen, `prefers-reduced-motion`,
  // component unmounted mid-transition) would leave `step` — and therefore the
  // header counter — frozen at its initial value. GSAP now only does the
  // cosmetic fade around a change that has already happened.
  const runTransition = useCallback((applyChange: () => void) => {
    // A fade-in from a previous transition may still be running on the shared
    // content node — kill it so it doesn't finish animating the new screen.
    gsap.killTweensOf(contentRef.current)
    if (transitionTimer.current) clearTimeout(transitionTimer.current)

    if (state.isTransitioning) {
      applyChange()
      dispatch({ type: 'SET_TRANSITIONING', value: false })
      return
    }

    // 1. Advance the wizard state immediately. The counter and the rendered
    //    step both derive from this and update on the next render regardless
    //    of what GSAP does next.
    applyChange()
    // New screen is about to mount — reset the scroll container so the user
    // starts the next step at its header, not wherever the last one scrolled.
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

    const node = contentRef.current
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (!node || prefersReducedMotion) {
      // No element to animate, or the user opted out of motion: the state
      // change above is all that's needed.
      return
    }

    // 2. Cosmetic fade of the new screen in. `isTransitioning` is only an
    //    anti-double-click lock now, released by a guaranteed timer so it
    //    can never get stuck even if `onComplete` never fires.
    dispatch({ type: 'SET_TRANSITIONING', value: true })
    transitionTimer.current = setTimeout(() => {
      dispatch({ type: 'SET_TRANSITIONING', value: false })
    }, 650)

    gsap.fromTo(node, { opacity: 0, y: 12 }, {
      opacity: 1, y: 0, duration: 0.5, ease: 'power3.out',
      onComplete: () => {
        if (transitionTimer.current) clearTimeout(transitionTimer.current)
        dispatch({ type: 'SET_TRANSITIONING', value: false })
      },
    })
  }, [state.isTransitioning])

  const transitionToStep = useCallback((nextStep: number) => {
    runTransition(() => dispatch({ type: 'SET_STEP', step: nextStep }))
  }, [runTransition])

  // Navigation walks the *active* screens for this user, so a skipped
  // conditional screen (e.g. PIH duration after "rarely" / "never") is
  // stepped straight over in both directions with no special-casing.
  const screens = activeScreens()

  const goNext = useCallback(() => {
    // Step 0 is the full-bleed transition screen — Continue just enters step 1.
    if (state.step === 0) {
      transitionToStep(1)
      return
    }
    // On an interstitial: Continue clears it and advances to the real step.
    if (state.interstitialId) {
      const list = activeScreens()
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
    const list = activeScreens()
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
    const list = activeScreens()
    const i = list.indexOf(state.step)
    if (i > 0) {
      transitionToStep(list[i - 1])
    } else if (state.step === 1) {
      // Back from the first numbered step returns to the step 0 transition
      // screen, so it stays reachable by walking backwards through the wizard.
      transitionToStep(0)
    }
  }, [state, transitionToStep, runTransition])

  // steps 1–TOTAL_STEPS show the counter (the step 0 transition screen doesn't);
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
        ref={scrollRef}
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
            activeInterstitial.id === BASELINE_AFTER_IDENTITY_ID ? (
              // Same full-bleed visual as step 0, single "Continue" CTA, no Back.
              <StepBaselineTransition
                onContinue={goNext}
                imageSrc="/images/onboarding/transistions/1/transition1.webp"
                eyebrow={activeInterstitial.eyebrow}
                titleLines={['Let’s start with', 'what’s yours.']}
                body={activeInterstitial.body}
                ctaLabel="Continue"
              />
            ) : activeInterstitial.id === PATTERNS_AFTER_EXPERIENCE_ID ? (
              // Same full-bleed visual — different image, different copy.
              <StepBaselineTransition
                onContinue={goNext}
                imageSrc="/images/onboarding/transistions/2/transition2.webp"
                eyebrow={activeInterstitial.eyebrow}
                titleLines={['Your skin has', 'patterns.']}
                body={activeInterstitial.body}
                ctaLabel="Continue"
              />
            ) : (
              <InterstitialScreen
                interstitial={activeInterstitial}
                onContinue={goNext}
                onBack={goBack}
              />
            )
          ) : (
          <>

          {state.step === 0 && (
            <StepBaselineTransition
              onContinue={goNext}
              imageSrc="/images/onboarding/transistions/opening/opening.webp"
              eyebrow="SkinAudit"
              titleLines={["This isn't a quiz.", "It's a read of your skin."]}
              ctaLabel="Begin"
            />
          )}

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
              onBack={goBack}
            />
          )}

          {state.step === 2 && (
            <StepSkinTone
              value={state.skinToneScale}
              onChange={(v) => dispatch({ type: 'SET_SKIN_TONE', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 3 && (
            <StepUndertone
              value={state.skinUndertone}
              onChange={(v) => dispatch({ type: 'SET_UNDERTONE', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 4 && (
            <StepSunResponse
              value={state.sunResponse}
              onChange={(v) => dispatch({ type: 'SET_SUN_RESPONSE', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 5 && (
            <StepSkinTypeSelfId
              value={(state.skinType || null) as SkinType | null}
              onChange={(v) => dispatch({ type: 'SET_SKIN_TYPE', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 6 && (
            <StepPrimaryConcerns
              value={state.primaryConcerns}
              onChange={(v) => dispatch({ type: 'SET_PRIMARY_CONCERNS', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 7 && (
            <StepSkinGoals
              value={state.goals}
              onChange={(v) => dispatch({ type: 'SET_GOALS', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 8 && (
            <StepExperienceLevel
              value={state.skincareExperience}
              onChange={(v) => dispatch({ type: 'SET_EXPERIENCE', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 9 && (
            <StepPihFrequency
              value={state.pihFrequency}
              duration={state.pihDuration}
              onChange={(v) => dispatch({ type: 'SET_PIH_FREQUENCY', value: v })}
              onDurationChange={(v) => dispatch({ type: 'SET_PIH_DURATION', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 10 && (
            <StepUnevenPatches
              value={state.unevenPatches}
              onChange={(v) => dispatch({ type: 'SET_UNEVEN_PATCHES', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 11 && (
            <StepProductReactivity
              value={state.productReactivity}
              historyValue={state.inflammatoryHistory}
              severityValue={state.productReactionSeverity}
              onChange={(v) => dispatch({ type: 'SET_PRODUCT_REACTIVITY', value: v })}
              onHistoryChange={(v) => dispatch({ type: 'SET_INFLAMMATORY_HISTORY', value: v })}
              onSeverityChange={(v) => dispatch({ type: 'SET_PRODUCT_REACTION_SEVERITY', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 12 && (
            <StepRecoveryTime
              value={state.recoveryTime}
              onChange={(v) => dispatch({ type: 'SET_RECOVERY_TIME', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 13 && (
            <StepSkinType
              value={state.skinType}
              onChange={(v) => dispatch({ type: 'SET_SKIN_TYPE', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 14 && (
            <StepDehydrationCheck
              value={state.oilyAndTight}
              onChange={(v) => dispatch({ type: 'SET_OILY_AND_TIGHT', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 15 && (
            <StepBreakouts
              pattern={state.breakoutPattern}
              areas={state.breakoutAreas}
              onPatternChange={(v) => dispatch({ type: 'SET_BREAKOUT_PATTERN', value: v })}
              onAreasChange={(v) => dispatch({ type: 'SET_BREAKOUT_AREAS', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 16 && (
            <StepRedness
              pattern={state.rednessPattern}
              areas={state.rednessAreas}
              flushTriggers={state.flushTriggers}
              flushFadeSpeed={state.flushFadeSpeed}
              onPatternChange={(v) => dispatch({ type: 'SET_REDNESS_PATTERN', value: v })}
              onAreasChange={(v) => dispatch({ type: 'SET_REDNESS_AREAS', value: v })}
              onFlushTriggersChange={(v) => dispatch({ type: 'SET_FLUSH_TRIGGERS', value: v })}
              onFlushFadeSpeedChange={(v) => dispatch({ type: 'SET_FLUSH_FADE_SPEED', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 17 && (
            <StepCurrentState
              normal={state.currentStateNormal}
              diffs={state.currentStateDiffs}
              onNormalChange={(v) => dispatch({ type: 'SET_CURRENT_STATE_NORMAL', value: v })}
              onDiffsChange={(v) => dispatch({ type: 'SET_CURRENT_STATE_DIFFS', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 18 && (
            <StepRecentChange
              answer={state.recentChangeAnswer}
              detail={state.recentChangeDetail}
              onAnswerChange={(v) => dispatch({ type: 'SET_RECENT_CHANGE_ANSWER', value: v })}
              onDetailChange={(v) => dispatch({ type: 'SET_RECENT_CHANGE_DETAIL', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 19 && (
            <StepDarkerAreas
              areas={state.darkerAreas}
              triggers={state.darkerAreaTriggers}
              onAreasChange={(v) => dispatch({ type: 'SET_DARKER_AREAS', value: v })}
              onTriggersChange={(v) => dispatch({ type: 'SET_DARKER_AREA_TRIGGERS', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 20 && (
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

          {state.step === 21 && (
            <StepTools
              homeDevices={state.homeDevices}
              professionalTreatments={state.professionalTreatments}
              onHomeDevicesChange={(v) => dispatch({ type: 'SET_HOME_DEVICES', value: v })}
              onProfessionalTreatmentsChange={(v) => dispatch({ type: 'SET_PRO_TREATMENTS', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 22 && (
            <StepInterpretation onContinue={goNext} onBack={goBack} />
          )}

          {state.step === 23 && <StepCompletion onContinue={goNext} onBack={goBack} />}

          {state.step === 24 && (
            <StepDossierIntro onContinue={goNext} onBack={goBack} />
          )}

          {state.step === 25 && (
            <StepProducts onComplete={completeAndEnterStudio} />
          )}

          </>
          )}

        </div>
      </main>
    </div>
  )
}
