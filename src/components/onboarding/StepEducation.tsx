'use client'

import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { StepHeader } from './StepHeader'
import { StepFooter } from './StepFooter'

const CONCEPTS = [
  {
    name: 'Skincare Dossier',
    tagline: 'Your product library',
    description:
      'Every product you use lives here. Add, archive, and organise your collection — it becomes the data source for every analysis.',
    icon: '◫',
    color: 'var(--color-sienna-400)',
  },
  {
    name: 'Ritual Builder',
    tagline: 'Your AM / PM routines',
    description:
      'Sequence your products into morning and evening rituals. The order matters — layering determines what absorbs and what blocks.',
    icon: '⟲',
    color: 'var(--color-sage-400)',
  },
  {
    name: 'Formulation Studio',
    tagline: 'Simulate before you commit',
    description:
      'Run "what if" scenarios: add a new product, swap one out, or change the sequence — and see the projected impact on your RHI before applying.',
    icon: '◈',
    color: 'var(--color-sienna-300)',
  },
]

const METRICS = [
  {
    name: 'RHI',
    full: 'Regimen Health Index',
    description:
      'A composite score that captures irritation risk, barrier support, active overlap, sequencing quality, and contextual fit — all in one number.',
  },
  {
    name: 'Findings',
    full: 'Targeted insights',
    description:
      'Specific flags in your routine: ingredient conflicts, missing steps, overuse of actives, sequencing errors. Each finding includes an explanation and a suggested adjustment.',
  },
  {
    name: 'Skin Reflections',
    full: 'Your subjective layer',
    description:
      'Log how your skin actually feels each day. Over time, SkinAudit correlates your routine changes with your subjective experience — closing the feedback loop.',
    badge: 'v2',
  },
]

type Props = {
  onContinue: () => void | Promise<void>
  onBack: () => void
}

export function StepEducation({ onContinue, onBack }: Props) {
  const conceptsRef = useRef<HTMLDivElement>(null)
  const metricsRef = useRef<HTMLDivElement>(null)
  const dividerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = conceptsRef.current?.querySelectorAll('[data-concept]')
      if (cards?.length) {
        gsap.fromTo(
          cards,
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out', delay: 0.3 }
        )
      }

      if (dividerRef.current) {
        gsap.fromTo(
          dividerRef.current,
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: 0.5, ease: 'power2.out', delay: 0.7 }
        )
      }

      const metricItems = metricsRef.current?.querySelectorAll('[data-metric]')
      if (metricItems?.length) {
        gsap.fromTo(
          metricItems,
          { x: -16, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.45, stagger: 0.1, ease: 'power2.out', delay: 0.85 }
        )
      }
    })
    return () => ctx.revert()
  }, [])

  return (
    <div>
      <StepHeader
        eyebrow="Step 5 of 6"
        title="Three tools. One system."
        subtitle="SkinAudit is built around a small number of powerful concepts. Here's what you'll be working with."
      />

      {/* Core concepts */}
      <div
        ref={conceptsRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '0.875rem',
          marginBottom: '2.5rem',
        }}
      >
        {CONCEPTS.map((concept) => (
          <div
            key={concept.name}
            data-concept
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <span style={{ fontSize: '1.75rem', color: concept.color, lineHeight: 1 }}>
              {concept.icon}
            </span>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 400,
                  fontSize: '1.1875rem',
                  color: 'var(--color-alabaster-50)',
                  marginBottom: '0.1875rem',
                }}
              >
                {concept.name}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 300,
                  fontSize: '0.75rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: concept.color,
                  marginBottom: '0.625rem',
                }}
              >
                {concept.tagline}
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 300,
                  fontSize: '0.8125rem',
                  lineHeight: 1.6,
                  color: 'var(--color-alabaster-400)',
                  margin: 0,
                }}
              >
                {concept.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div
        ref={dividerRef}
        style={{
          height: '1px',
          backgroundColor: 'rgba(184,134,61,0.12)',
          marginBottom: '2rem',
        }}
      />

      {/* Metrics & signals */}
      <span
        className="label-caps"
        style={{ color: 'var(--color-sienna-500)', display: 'block', marginBottom: '1.25rem' }}
      >
        What SkinAudit surfaces
      </span>
      <div
        ref={metricsRef}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}
      >
        {METRICS.map((metric) => (
          <div
            key={metric.name}
            data-metric
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr',
              gap: '1.25rem',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 400,
                    fontSize: '1.1875rem',
                    color: 'var(--color-sienna-400)',
                  }}
                >
                  {metric.name}
                </span>
                {metric.badge && (
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-badge)',
                      border: '1px solid var(--color-sienna-600)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '9px',
                      fontWeight: 500,
                      letterSpacing: '0.08em',
                      color: 'var(--color-sienna-500)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {metric.badge}
                  </span>
                )}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 400,
                  fontSize: '0.875rem',
                  color: 'var(--color-alabaster-300)',
                  marginBottom: '0.25rem',
                }}
              >
                {metric.full}
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 300,
                  fontSize: '0.8125rem',
                  lineHeight: 1.6,
                  color: 'var(--color-alabaster-400)',
                  margin: 0,
                }}
              >
                {metric.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <StepFooter
        onContinue={onContinue}
        onBack={onBack}
        continueLabel="I'm ready"
      />
    </div>
  )
}
