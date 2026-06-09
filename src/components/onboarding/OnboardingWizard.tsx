'use client'

import { useReducer, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { StepWelcome } from './StepWelcome'
import { StepSkinProfile } from './StepSkinProfile'
import { StepSensitivity } from './StepSensitivity'
import { StepEnvironment } from './StepEnvironment'
import { StepExperience } from './StepExperience'
import { StepEducation } from './StepEducation'
import { StepProducts } from './StepProducts'
import { WizardProgress } from './WizardProgress'
import { saveEducationStep, completeOnboarding } from '@/app/actions/onboarding'

// ─── Types ────────────────────────────────────────────────────
export type WizardUser = {
  id: string
  email: string
  name: string | null
}

type WizardState = {
  step: number
  isTransitioning: boolean
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

type WizardAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_TRANSITIONING'; value: boolean }
  | { type: 'SET_SKIN_TYPE'; value: string }
  | { type: 'SET_CONCERNS'; value: string[] }
  | { type: 'SET_SENSITIVITY'; value: string }
  | { type: 'SET_GOALS'; value: string[] }
  | { type: 'SET_ENVIRONMENT'; city: string; countryCode: string; climateZone: string; season: string }
  | { type: 'SET_EXPERIENCE'; value: string }

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP': return { ...state, step: action.step }
    case 'SET_TRANSITIONING': return { ...state, isTransitioning: action.value }
    case 'SET_SKIN_TYPE': return { ...state, skinType: action.value }
    case 'SET_CONCERNS': return { ...state, concerns: action.value }
    case 'SET_SENSITIVITY': return { ...state, sensitivity: action.value }
    case 'SET_GOALS': return { ...state, goals: action.value }
    case 'SET_ENVIRONMENT': return {
      ...state,
      city: action.city,
      countryCode: action.countryCode,
      climateZone: action.climateZone,
      season: action.season,
    }
    case 'SET_EXPERIENCE': return { ...state, experienceLevel: action.value }
    default: return state
  }
}

const TOTAL_STEPS = 7
// Step 1 is welcome (auto-advance), steps 2–7 are shown in progress
const PROGRESS_STEPS = [
  'Skin profile',
  'Sensitivity',
  'Environment',
  'Experience',
  'Overview',
  'Products',
]

// ─── Component ────────────────────────────────────────────────
export function OnboardingWizard({
  user,
  initialStep = 0,
}: {
  user: WizardUser
  initialStep?: number
}) {
  // If user has already started (initialStep >= 2), resume from next step.
  // Steps 1 (welcome) is skipped when resuming — land directly on the right step.
  const resumeStep = initialStep >= 2 ? initialStep + 1 : 1

  const [state, dispatch] = useReducer(wizardReducer, {
    step: resumeStep > TOTAL_STEPS ? TOTAL_STEPS : resumeStep,
    isTransitioning: false,
    skinType: '',
    concerns: [],
    sensitivity: '',
    goals: [],
    city: '',
    countryCode: '',
    climateZone: '',
    season: '',
    experienceLevel: '',
  })

  const contentRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Entrance animation for the entire wizard
  useEffect(() => {
    if (!containerRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.0, ease: 'power2.out' }
      )
    })
    return () => ctx.revert()
  }, [])

  // Step transition — crossfade the content panel
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
        if (!target) {
          dispatch({ type: 'SET_TRANSITIONING', value: false })
          return
        }
        gsap.fromTo(
          target,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: 'power3.out',
            onComplete: () => dispatch({ type: 'SET_TRANSITIONING', value: false }),
          }
        )
      },
    })
  }, [state.isTransitioning])

  const goNext = useCallback(() => {
    if (state.step < TOTAL_STEPS) {
      transitionToStep(state.step + 1)
    }
  }, [state.step, transitionToStep])

  const goBack = useCallback(() => {
    if (state.step > 2) {
      transitionToStep(state.step - 1)
    }
  }, [state.step, transitionToStep])

  // Progress indicator index: step 1 (welcome) shows nothing,
  // step 2 = index 0, step 3 = index 1, etc.
  const progressIndex = state.step >= 2 ? state.step - 2 : -1

  return (
    <div
      ref={containerRef}
      className="onboarding-root"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-obsidian-950)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        opacity: 0,
      }}
    >
      {/* Ambient background gradient */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: `
            radial-gradient(circle at 10% 90%, rgba(184,134,61,0.05) 0%, transparent 50%),
            radial-gradient(circle at 90% 10%, rgba(184,134,61,0.04) 0%, transparent 45%)
          `,
          zIndex: 0,
        }}
      />

      {/* Top bar: wordmark + progress */}
      <header
        style={{
          position: 'relative',
          zIndex: 10,
          padding: 'clamp(1.25rem, 3vw, 2rem) clamp(1.5rem, 5vw, 4rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(184,134,61,0.1)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '11px',
            fontWeight: 300,
            letterSpacing: '0.24em',
            color: 'var(--color-alabaster-400)',
            textTransform: 'uppercase',
          }}
        >
          S K I N A U D I T
        </span>

        {state.step >= 2 && (
          <WizardProgress
            steps={PROGRESS_STEPS}
            currentIndex={progressIndex}
          />
        )}

        {/* Step counter */}
        {state.step >= 2 && (
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              fontWeight: 400,
              letterSpacing: '0.08em',
              color: 'var(--color-text-muted)',
            }}
          >
            {state.step - 1} / {TOTAL_STEPS - 1}
          </span>
        )}
      </header>

      {/* Main content area */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(2rem, 5vw, 4rem) clamp(1.5rem, 5vw, 4rem)',
        }}
      >
        <div
          ref={contentRef}
          style={{ width: '100%', maxWidth: '680px' }}
        >
          {state.step === 1 && (
            <StepWelcome
              user={user}
              onContinue={goNext}
            />
          )}
          {state.step === 2 && (
            <StepSkinProfile
              skinType={state.skinType}
              concerns={state.concerns}
              onSkinTypeChange={(v) => dispatch({ type: 'SET_SKIN_TYPE', value: v })}
              onConcernsChange={(v) => dispatch({ type: 'SET_CONCERNS', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}
          {state.step === 3 && (
            <StepSensitivity
              sensitivity={state.sensitivity}
              goals={state.goals}
              onSensitivityChange={(v) => dispatch({ type: 'SET_SENSITIVITY', value: v })}
              onGoalsChange={(v) => dispatch({ type: 'SET_GOALS', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}
          {state.step === 4 && (
            <StepEnvironment
              city={state.city}
              countryCode={state.countryCode}
              climateZone={state.climateZone}
              season={state.season}
              onChange={(env) => dispatch({ type: 'SET_ENVIRONMENT', ...env })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}
          {state.step === 5 && (
            <StepExperience
              level={state.experienceLevel}
              onChange={(v) => dispatch({ type: 'SET_EXPERIENCE', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}
          {state.step === 6 && (
            <StepEducation
              onContinue={async () => {
                await saveEducationStep()
                goNext()
              }}
              onBack={goBack}
            />
          )}
          {state.step === 7 && (
            <StepProducts
              onBack={goBack}
              onComplete={async () => {
                await completeOnboarding()
              }}
            />
          )}
        </div>
      </main>

      {/* Bottom step dots — minimal mobile indicator */}
      {state.step >= 2 && (
        <footer
          style={{
            position: 'relative',
            zIndex: 10,
            padding: '1.5rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '6px',
          }}
          aria-hidden="true"
        >
          {Array.from({ length: TOTAL_STEPS - 1 }, (_, i) => (
            <span
              key={i}
              style={{
                width: i === progressIndex ? '20px' : '6px',
                height: '2px',
                borderRadius: '1px',
                backgroundColor:
                  i < progressIndex
                    ? 'var(--color-sienna-500)'
                    : i === progressIndex
                    ? 'var(--color-sienna-400)'
                    : 'var(--color-obsidian-700)',
                transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            />
          ))}
        </footer>
      )}
    </div>
  )
}
