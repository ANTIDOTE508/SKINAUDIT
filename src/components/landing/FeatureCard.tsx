'use client'

import type { ReactNode } from 'react'
import FeatureIcon, { type FeatureIconVariant } from './FeatureIcon'
import { useScrollReveal } from './useScrollReveal'

interface FeatureCardProps {
  index: string
  icon: FeatureIconVariant
  title: ReactNode
  description: ReactNode
  transitionDelay?: string
}

export default function FeatureCard({
  index,
  icon,
  title,
  description,
  transitionDelay,
}: FeatureCardProps) {
  const ref = useScrollReveal<HTMLDivElement>()

  return (
    <div className="feat-card" ref={ref} style={transitionDelay ? { transitionDelay } : undefined}>
      <div className="feat-card-top">
        <span className="feat-index">{index}</span>
        <FeatureIcon variant={icon} />
      </div>
      <p className="feat-name">{title}</p>
      <p className="feat-desc">{description}</p>
    </div>
  )
}
