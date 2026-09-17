'use client'

import { Check, ArrowRight } from 'lucide-react'
import { ProductImagePlaceholder } from '@/components/studio/ProductImagePlaceholder'

type Props = {
  productName: string
  isFinishing: boolean
  onAddAnother: () => void
  onContinueToStudio: () => void
}

export function ScreenAdded({ productName, isFinishing, onAddAnother, onContinueToStudio }: Props) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        aria-hidden="true"
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '1px solid var(--color-accent-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}
      >
        <Check size={22} strokeWidth={1.5} color="var(--color-sienna-400)" />
      </div>

      <h2
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 300,
          fontSize: '1.5rem',
          color: 'var(--color-alabaster-50)',
          margin: '0 0 1.5rem',
        }}
      >
        Added to your Dossier
      </h2>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-accent-border)',
          backgroundColor: 'var(--color-surface)',
          textAlign: 'left',
          marginBottom: '2rem',
        }}
      >
        <ProductImagePlaceholder size="md" />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-alabaster-100)' }}>
          {productName}
        </span>
      </div>

      <button
        type="button"
        onClick={onAddAnother}
        disabled={isFinishing}
        style={{
          width: '100%',
          minHeight: '52px',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-accent-border)',
          backgroundColor: 'transparent',
          color: 'var(--color-alabaster-200)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          cursor: isFinishing ? 'default' : 'pointer',
          marginBottom: '0.75rem',
        }}
      >
        Add another product
      </button>

      <button
        type="button"
        onClick={onContinueToStudio}
        disabled={isFinishing}
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
        {isFinishing ? 'Setting up your space…' : 'Continue to Studio'}
        <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" style={{ flexShrink: 0 }} />
      </button>
    </div>
  )
}
