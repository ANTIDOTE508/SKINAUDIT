'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'

/**
 * Transition ("interstitial") screens sit *between* wizard steps. They are
 * framing, not questions: no input, no persistence, not counted by
 * StepCounter, never in activeScreens(). Adding one is a single entry in the
 * INTERSTITIALS array below — no step renumbering, no counter math.
 */

// The wizard state shape is defined in OnboardingWizard.tsx. Interstitials
// only ever need to *read* it for their optional `when` predicate, so we take
// a structural type here to avoid a circular import.
type WizardStateLike = Record<string, unknown>

export type Interstitial = {
  /** Stable id — this is what the wizard stores in state.interstitialId. */
  id: string
  /** Show this interstitial right after the user finishes this step number. */
  afterStep: number
  /** Small uppercase label above the rule. */
  eyebrow: string
  /** Main framing line (light, large). */
  title: string
  /** Supporting line (muted). */
  body: string
  /**
   * Optional predicate. When present and it returns false, the interstitial
   * is skipped for this user's answers, exactly like a conditional step.
   */
  when?: (state: WizardStateLike) => boolean
}

/**
 * Id of the interstitial shown right after step 1. The wizard renders it with
 * the full-bleed <StepBaselineTransition> visual (same as step 0) rather than
 * the generic <InterstitialScreen>; its eyebrow/title/body below are the
 * fallback copy and are not used while that special-casing stands.
 */
export const BASELINE_AFTER_IDENTITY_ID = 'baseline-after-identity'

/**
 * Id of the interstitial shown right after step 8 (experience level). The
 * wizard renders it with the full-bleed <StepBaselineTransition> visual (same
 * as step 0 and the baseline interstitial) rather than the generic
 * <InterstitialScreen>; its eyebrow/title/body below are the fallback copy
 * and are not used while that special-casing stands.
 */
export const PATTERNS_AFTER_EXPERIENCE_ID = 'patterns-after-experience'

export const INTERSTITIALS: Interstitial[] = [
  {
    id: BASELINE_AFTER_IDENTITY_ID,
    afterStep: 1,
    eyebrow: 'Your skin',
    title: "Let’s start with what’s yours.",
    body: "We’ll begin with a few things that help us understand your skin’s baseline.",
  },
  {
    id: PATTERNS_AFTER_EXPERIENCE_ID,
    afterStep: 8,
    eyebrow: 'Your patterns',
    title: 'Your skin has patterns.',
    body: "Now we'll look at the patterns you've noticed — how your skin responds, changes and recovers over time.",
  },
]

/**
 * The interstitial (if any) that should appear after `stepJustFinished`,
 * respecting each entry's optional `when` predicate.
 */
export function findInterstitialAfter(
  stepJustFinished: number,
  state: WizardStateLike,
): Interstitial | null {
  for (const entry of INTERSTITIALS) {
    if (entry.afterStep !== stepJustFinished) continue
    if (entry.when && !entry.when(state)) continue
    return entry
  }
  return null
}

export function getInterstitialById(id: string): Interstitial | null {
  return INTERSTITIALS.find((e) => e.id === id) ?? null
}

// ─── Presentational component ─────────────────────────────────

type Props = {
  interstitial: Interstitial
  onContinue: () => void
  onBack?: () => void
}

export function InterstitialScreen({ interstitial, onContinue, onBack }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = rootRef.current
    if (!node) return
    const ctx = gsap.context(() => {
      const targets = node.querySelectorAll('[data-anim]')
      const line = node.querySelector('[data-anim-line]')
      const tl = gsap.timeline()
      if (line) {
        tl.fromTo(
          line,
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: 0.7, ease: 'power3.out' },
        )
      }
      tl.fromTo(
        targets,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.12 },
        '-=0.3',
      )
    }, node)
    return () => ctx.revert()
  }, [interstitial.id])

  return (
    <div
      ref={rootRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        alignItems: 'flex-start',
      }}
    >
      <span
        data-anim
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '11px',
          fontWeight: 300,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'var(--color-sienna-400)',
        }}
      >
        {interstitial.eyebrow}
      </span>

      <div
        data-anim-line
        style={{
          width: '56px',
          height: '2px',
          backgroundColor: 'var(--color-sienna-500)',
        }}
      />

      <h2
        data-anim
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 300,
          fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
          lineHeight: 1.2,
          color: 'var(--color-alabaster-50)',
          letterSpacing: '-0.01em',
          margin: 0,
          maxWidth: '620px',
        }}
      >
        {interstitial.title}
      </h2>

      <p
        data-anim
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
          lineHeight: 1.65,
          color: 'var(--color-alabaster-400)',
          maxWidth: '520px',
          margin: 0,
        }}
      >
        {interstitial.body}
      </p>

      <div data-anim style={{ width: '100%', marginTop: '1rem' }}>
        <StepFooter onContinue={onContinue} onBack={onBack} />
      </div>
    </div>
  )
}
