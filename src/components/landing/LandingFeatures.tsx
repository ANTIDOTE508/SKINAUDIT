'use client'

import type { ReactNode } from 'react'
import FeatureCard from './FeatureCard'
import type { FeatureIconVariant } from './FeatureIcon'
import { useScrollReveal } from './useScrollReveal'

const FEATURES: {
  index: string
  icon: FeatureIconVariant
  title: ReactNode
  description: ReactNode
  transitionDelay?: string
}[] = [
  {
    index: '01',
    icon: 'system',
    title: 'System-Level Intelligence',
    description:
      'We analyze how your products work together as a complete system, not just each ingredient in isolation.',
  },
  {
    index: '02',
    icon: 'context',
    title: 'Context Matters',
    description:
      'Environment, treatments, and lifestyle all influence how your skin behaves — and how your products perform.',
    transitionDelay: '0.1s',
  },
  {
    index: '03',
    icon: 'evolution',
    title: 'Continuous Evolution',
    description:
      'Track changes, observe patterns, and refine your regimen over time as your skin and routine develop.',
    transitionDelay: '0.18s',
  },
  {
    index: '04',
    icon: 'decisions',
    title: 'Your Regimen, Your Decisions',
    description: 'Insights, not instructions. You stay in full control — SkinAudit informs, you decide.',
    transitionDelay: '0.26s',
  },
]

export default function LandingFeatures() {
  const headerRef = useScrollReveal<HTMLDivElement>()

  return (
    <section className="features" id="features" aria-label="Features">
      <div className="feat-header" ref={headerRef}>
        <h2 className="feat-title">
          Built for
          <br />
          <em>Understanding</em>
        </h2>
        <p className="feat-header-sub">
          Four principles that separate surface-level advice from genuine formulation intelligence.
        </p>
      </div>

      <div className="feat-grid">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.index} {...feature} />
        ))}
      </div>
    </section>
  )
}
