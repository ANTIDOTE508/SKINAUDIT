'use client'

import { StepHeader } from '../StepHeader'
import { ArrowRight } from 'lucide-react'

type Props = {
  onAddProduct: () => void
}

export function ScreenEmptyDossier({ onAddProduct }: Props) {
  return (
    <div>
      <StepHeader title="Dossier" subtitle="Your Dossier is empty" />
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '0.875rem',
          lineHeight: 1.7,
          color: 'var(--color-alabaster-300)',
          textAlign: 'center',
          margin: '1rem 0 2.5rem',
        }}
      >
        Add your skincare products to get started. Products in your Dossier
        can be used in your rituals, but are not evaluated until they&apos;re
        assigned.
      </p>
      <button
        type="button"
        onClick={onAddProduct}
        className="btn-primary btn-primary-accent"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          width: '100%',
          minHeight: '58px',
          paddingInline: '1.5rem',
        }}
      >
        <span aria-hidden="true" style={{ width: 20, flexShrink: 0 }} />
        + Add Product
        <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" style={{ flexShrink: 0 }} />
      </button>
    </div>
  )
}
