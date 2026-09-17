'use client'

import { StepHeader } from '../StepHeader'
import { ProductImagePlaceholder } from '@/components/studio/ProductImagePlaceholder'

type Product = {
  id: number
  name: string
  brandName: string | null
  sizeLabel: string | null
}

type Props = {
  product: Product
  onConfirm: () => void
  onNotMyProduct: () => void
}

export function ScreenConfirmMatch({ product, onConfirm, onNotMyProduct }: Props) {
  return (
    <div>
      <StepHeader title="Is this your product?" />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.25rem',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-accent-border)',
          backgroundColor: 'var(--color-surface)',
          marginBottom: '0.75rem',
        }}
      >
        <ProductImagePlaceholder size="lg" />
        <span>
          <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-alabaster-400)' }}>
            {product.brandName ?? 'Unknown brand'}
          </span>
          <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-alabaster-100)' }}>
            {product.name}
          </span>
          {product.sizeLabel && (
            <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-alabaster-400)' }}>
              {product.sizeLabel}
            </span>
          )}
        </span>
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-alabaster-400)', margin: '0 0 2rem' }}>
        Packaging may vary.
      </p>

      <button
        type="button"
        onClick={onConfirm}
        className="btn-primary btn-primary-accent"
        style={{ width: '100%', minHeight: '52px', marginBottom: '0.75rem' }}
      >
        Yes, this is my product
      </button>
      <button
        type="button"
        onClick={onNotMyProduct}
        style={{
          width: '100%',
          minHeight: '52px',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-accent-border)',
          backgroundColor: 'transparent',
          color: 'var(--color-alabaster-200)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          cursor: 'pointer',
        }}
      >
        Not my product
      </button>
    </div>
  )
}
