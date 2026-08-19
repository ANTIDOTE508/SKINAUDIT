'use client'

import { useReducer, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { completeOnboarding } from '@/app/actions/onboarding'
import { StepWelcome } from './StepWelcome'
import { StepIdentity } from './StepIdentity'
import { StepSkinType } from './StepSkinType'
import { StepSunResponse } from './StepSunResponse'
import { StepSkinTone } from './StepSkinTone'
import { StepSkinGoals } from './StepSkinGoals'
import { StepSensitivity } from './StepSensitivity'
import { StepEnvironment } from './StepEnvironment'
import { StepExperience } from './StepExperience'
import { StepTools } from './StepTools'
import { StepInterpretation } from './StepInterpretation'
import { StepDossierIntro } from './StepDossierIntro'
import { StepProducts } from './StepProducts'
import { StepCompletion } from './StepCompletion'
import { StepCounter } from './StepCounter'

// ─── Types ────────────────────────────────────────────────────
export type WizardUser = {
  id: string
  email: string
  name: string | null
}

type WizardState = {
  step: number
  isTransitioning: boolean
  genderIdentity: string
  preferredName: string
  birthMonth: string
  birthYear: string
  skinType: string
  skinToneScale: number | null
  vitiligo: boolean
  sensitivityScore: number | null
  sunResponse: number | null
  concerns: string[]
  goals: string[]
  city: string
  countryCode: string
  climateZone: string
  season: string
  experienceLevel: string
  homeDevices: string[]
  professionalTreatments: string[]
}

type WizardAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_TRANSITIONING'; value: boolean }
  | { type: 'SET_GENDER'; value: string }
  | { type: 'SET_PREFERRED_NAME'; value: string }
  | { type: 'SET_BIRTH_MONTH'; value: string }
  | { type: 'SET_BIRTH_YEAR'; value: string }
  | { type: 'SET_SKIN_TYPE'; value: string }
  | { type: 'SET_SKIN_TONE'; value: number }
  | { type: 'SET_VITILIGO'; value: boolean }
  | { type: 'SET_SENSITIVITY'; value: number }
  | { type: 'SET_SUN_RESPONSE'; value: number }
  | { type: 'SET_CONCERNS'; value: string[] }
  | { type: 'SET_GOALS'; value: string[] }
  | { type: 'SET_ENVIRONMENT'; city: string; countryCode: string; climateZone: string; season: string }
  | { type: 'SET_EXPERIENCE'; value: string }
  | { type: 'SET_HOME_DEVICES'; value: string[] }
  | { type: 'SET_PRO_TREATMENTS'; value: string[] }

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':           return { ...state, step: action.step }
    case 'SET_TRANSITIONING':  return { ...state, isTransitioning: action.value }
    case 'SET_GENDER':         return { ...state, genderIdentity: action.value }
    case 'SET_PREFERRED_NAME': return { ...state, preferredName: action.value }
    case 'SET_BIRTH_MONTH':    return { ...state, birthMonth: action.value }
    case 'SET_BIRTH_YEAR':     return { ...state, birthYear: action.value }
    case 'SET_SKIN_TYPE':      return { ...state, skinType: action.value }
    case 'SET_SKIN_TONE':      return { ...state, skinToneScale: action.value }
    case 'SET_VITILIGO':       return { ...state, vitiligo: action.value }
    case 'SET_SENSITIVITY':    return { ...state, sensitivityScore: action.value }
    case 'SET_SUN_RESPONSE':   return { ...state, sunResponse: action.value }
    case 'SET_CONCERNS':       return { ...state, concerns: action.value }
    case 'SET_GOALS':          return { ...state, goals: action.value }
    case 'SET_ENVIRONMENT':    return { ...state, city: action.city, countryCode: action.countryCode, climateZone: action.climateZone, season: action.season }
    case 'SET_EXPERIENCE':     return { ...state, experienceLevel: action.value }
    case 'SET_HOME_DEVICES':   return { ...state, homeDevices: action.value }
    case 'SET_PRO_TREATMENTS': return { ...state, professionalTreatments: action.value }
    default: return state
  }
}

// step 0 = welcome, steps 1–13 = wizard steps. Step 13 (product picker) is
// the last one and completes onboarding itself, so there is no separate
// completion step beyond it.
const TOTAL_STEPS = 13

/** Answers already saved on the profile, used to repopulate fields on resume. */
export type WizardInitialProfile = {
  genderIdentity?: string | null
  preferredName?: string | null
  birthMonth?: number | null
  birthYear?: number | null
  skinToneScale?: number | null
  vitiligo?: boolean | null
  sunResponse?: number | null
  skinType?: string | null
  concerns?: string[] | null
  sensitivityScore?: number | null
  goals?: string[] | null
  city?: string | null
  countryCode?: string | null
  climateZone?: string | null
  season?: string | null
  experienceLevel?: string | null
  homeDevices?: string[] | null
  professionalTreatments?: string[] | null
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
  const resumeStep = initialStep >= 2 ? initialStep + 1 : 1

  const [state, dispatch] = useReducer(wizardReducer, {
    step: resumeStep > TOTAL_STEPS ? TOTAL_STEPS : resumeStep,
    isTransitioning: false,
    genderIdentity: initialProfile?.genderIdentity ?? '',
    preferredName: initialProfile?.preferredName ?? '',
    birthMonth: initialProfile?.birthMonth ? String(initialProfile.birthMonth) : '',
    birthYear: initialProfile?.birthYear ? String(initialProfile.birthYear) : '',
    skinType: initialProfile?.skinType ?? '',
    skinToneScale: initialProfile?.skinToneScale ?? null,
    // null (never answered) and false both open the toggle in its off state.
    vitiligo: initialProfile?.vitiligo ?? false,
    sensitivityScore: initialProfile?.sensitivityScore ?? null,
    sunResponse: initialProfile?.sunResponse ?? null,
    concerns: initialProfile?.concerns ?? [],
    goals: initialProfile?.goals ?? [],
    city: initialProfile?.city ?? '',
    countryCode: initialProfile?.countryCode ?? '',
    climateZone: initialProfile?.climateZone ?? '',
    season: initialProfile?.season ?? '',
    experienceLevel: initialProfile?.experienceLevel ?? '',
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

  const transitionToStep = useCallback((nextStep: number) => {
    const node = contentRef.current
    if (state.isTransitioning || !node) {
      dispatch({ type: 'SET_STEP', step: nextStep })
      return
    }
    dispatch({ type: 'SET_TRANSITIONING', value: true })
    gsap.to(node, {
      opacity: 0,
      y: -12,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        dispatch({ type: 'SET_STEP', step: nextStep })
        const target = contentRef.current
        if (!target) { dispatch({ type: 'SET_TRANSITIONING', value: false }); return }
        gsap.fromTo(target, { opacity: 0, y: 18 }, {
          opacity: 1, y: 0, duration: 0.55, ease: 'power3.out',
          onComplete: () => dispatch({ type: 'SET_TRANSITIONING', value: false }),
        })
      },
    })
  }, [state.isTransitioning])

  const goNext = useCallback(() => transitionToStep(state.step + 1), [state.step, transitionToStep])
  const goBack = useCallback(() => { if (state.step > 1) transitionToStep(state.step - 1) }, [state.step, transitionToStep])

  // steps 1–13 show counter (only the step 0 welcome screen doesn't)
  const showCounter = state.step >= 1 && state.step <= TOTAL_STEPS
  const counterCurrent = state.step
  const counterTotal = TOTAL_STEPS

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
            <StepSkinType
              value={state.skinType}
              onChange={(v) => dispatch({ type: 'SET_SKIN_TYPE', value: v })}
              concerns={state.concerns}
              onConcernsChange={(v) => dispatch({ type: 'SET_CONCERNS', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 5 && (
            <StepSensitivity
              sensitivity={state.sensitivityScore}
              onSensitivityChange={(v) => dispatch({ type: 'SET_SENSITIVITY', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 6 && (
            <StepSkinGoals
              value={state.goals}
              onChange={(v) => dispatch({ type: 'SET_GOALS', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 7 && (
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

          {state.step === 8 && (
            <StepExperience
              level={state.experienceLevel}
              onChange={(v) => dispatch({ type: 'SET_EXPERIENCE', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 9 && (
            <StepTools
              homeDevices={state.homeDevices}
              professionalTreatments={state.professionalTreatments}
              onHomeDevicesChange={(v) => dispatch({ type: 'SET_HOME_DEVICES', value: v })}
              onProfessionalTreatmentsChange={(v) => dispatch({ type: 'SET_PRO_TREATMENTS', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 10 && (
            <StepInterpretation onContinue={goNext} onBack={goBack} />
          )}

          {state.step === 11 && <StepCompletion onContinue={goNext} />}

          {state.step === 12 && (
            <StepDossierIntro onContinue={goNext} />
          )}

          {state.step === 13 && (
            <StepProducts onComplete={completeAndEnterStudio} />
          )}

        </div>
      </main>
    </div>
  )
}
