'use client'

import { useReducer, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { StepWelcome } from './StepWelcome'
import { StepIdentity } from './StepIdentity'
import { StepSkinType } from './StepSkinType'
import { StepSensitivity } from './StepSensitivity'
import { StepSkinGoals } from './StepSkinGoals'
import { StepEnvironment } from './StepEnvironment'
import { StepExperience } from './StepExperience'
import { StepTools } from './StepTools'
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
  skinType: string
  sensitivityScore: number
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
  | { type: 'SET_SKIN_TYPE'; value: string }
  | { type: 'SET_SENSITIVITY'; value: number }
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
    case 'SET_SKIN_TYPE':      return { ...state, skinType: action.value }
    case 'SET_SENSITIVITY':    return { ...state, sensitivityScore: action.value }
    case 'SET_GOALS':          return { ...state, goals: action.value }
    case 'SET_ENVIRONMENT':    return { ...state, city: action.city, countryCode: action.countryCode, climateZone: action.climateZone, season: action.season }
    case 'SET_EXPERIENCE':     return { ...state, experienceLevel: action.value }
    case 'SET_HOME_DEVICES':   return { ...state, homeDevices: action.value }
    case 'SET_PRO_TREATMENTS': return { ...state, professionalTreatments: action.value }
    default: return state
  }
}

// step 0 = welcome, steps 1–8 = wizard steps, step 9 = completion
const TOTAL_STEPS = 9

export function OnboardingWizard({ user, initialStep = 0 }: { user: WizardUser; initialStep?: number }) {
  const resumeStep = initialStep >= 2 ? initialStep + 1 : 1

  const [state, dispatch] = useReducer(wizardReducer, {
    step: resumeStep > TOTAL_STEPS ? TOTAL_STEPS : resumeStep,
    isTransitioning: false,
    genderIdentity: '',
    skinType: '',
    sensitivityScore: 3,
    goals: [],
    city: '',
    countryCode: '',
    climateZone: '',
    season: '',
    experienceLevel: '',
    homeDevices: [],
    professionalTreatments: [],
  })

  const contentRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

  // steps 1–8 show counter
  const showCounter = state.step >= 1 && state.step <= 8
  const counterCurrent = state.step
  const counterTotal = 8

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-obsidian-950)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        opacity: 0,
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
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(2rem, 5vw, 4rem) clamp(1.5rem, 5vw, 4rem)',
        }}
      >
        <div ref={contentRef} style={{ width: '100%', maxWidth: '680px' }}>

          {state.step === 0 && <StepWelcome user={user} onContinue={goNext} />}

          {state.step === 1 && (
            <StepIdentity
              value={state.genderIdentity}
              onChange={(v) => dispatch({ type: 'SET_GENDER', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 2 && (
            <StepSkinType
              value={state.skinType}
              onChange={(v) => dispatch({ type: 'SET_SKIN_TYPE', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 3 && (
            <StepSensitivity
              sensitivity={state.sensitivityScore}
              goals={[]}
              onSensitivityChange={(v) => dispatch({ type: 'SET_SENSITIVITY', value: v })}
              onGoalsChange={() => {}}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 4 && (
            <StepSkinGoals
              value={state.goals}
              onChange={(v) => dispatch({ type: 'SET_GOALS', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 5 && (
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

          {state.step === 6 && (
            <StepExperience
              level={state.experienceLevel}
              onChange={(v) => dispatch({ type: 'SET_EXPERIENCE', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 7 && (
            <StepTools
              homeDevices={state.homeDevices}
              professionalTreatments={state.professionalTreatments}
              onHomeDevicesChange={(v) => dispatch({ type: 'SET_HOME_DEVICES', value: v })}
              onProfessionalTreatmentsChange={(v) => dispatch({ type: 'SET_PRO_TREATMENTS', value: v })}
              onContinue={goNext}
              onBack={goBack}
            />
          )}

          {state.step === 8 && (
            <StepProducts
              onBack={goBack}
              onComplete={async () => goNext()}
            />
          )}

          {state.step === 9 && <StepCompletion />}

        </div>
      </main>

      {/* Bottom dots — steps 1–8 only */}
      {showCounter && (
        <footer
          aria-hidden="true"
          style={{ position: 'relative', zIndex: 10, padding: '1.5rem', display: 'flex', justifyContent: 'center', gap: '6px' }}
        >
          {Array.from({ length: 8 }, (_, i) => {
            const idx = i + 1
            return (
              <span
                key={i}
                style={{
                  width: idx === state.step ? '20px' : '6px',
                  height: '2px',
                  borderRadius: '1px',
                  backgroundColor:
                    idx < state.step
                      ? 'var(--color-sienna-500)'
                      : idx === state.step
                      ? 'var(--color-sienna-400)'
                      : 'var(--color-obsidian-700)',
                  transition: 'all 0.4s var(--ease-luxury)',
                }}
              />
            )
          })}
        </footer>
      )}
    </div>
  )
}
