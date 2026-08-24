import type { ReactNode } from 'react'
import FeatureIcon, { type FeatureIconVariant } from './FeatureIcon'

const FEATURES: {
  icon: FeatureIconVariant
  title: ReactNode
  description: ReactNode
}[] = [
  {
    icon: 'person',
    title: (
      <>
        System-Level
        <br />
        Intelligence
      </>
    ),
    description: (
      <>
        We analyze how your
        <br />
        products work together
        <br />
        as a complete system.
      </>
    ),
  },
  {
    icon: 'flower',
    title: 'Context Matters',
    description: (
      <>
        Environment, treatments,
        <br />
        and lifestyle all influence
        <br />
        how your skin behaves.
      </>
    ),
  },
  {
    icon: 'target',
    title: (
      <>
        Continuous
        <br />
        Evolution
      </>
    ),
    description: (
      <>
        Track changes, observe
        <br />
        patterns, and refine your
        <br />
        regimen over time.
      </>
    ),
  },
  {
    icon: 'check',
    title: (
      <>
        Your Regimen,
        <br />
        Your Decisions
      </>
    ),
    description: (
      <>
        Insights, not instructions.
        <br />
        You stay in control
        <br />
        of your choices.
      </>
    ),
  },
]

export default function LandingFeatures() {
  return (
    <section className="understanding-section" id="features">
      <div className="section-label">Built for Understanding</div>

      <div className="understanding-grid">
        {FEATURES.map(({ icon, title, description }) => (
          <article className="understanding-item" key={icon}>
            <FeatureIcon variant={icon} />
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
