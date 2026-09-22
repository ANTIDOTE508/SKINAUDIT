'use client'

import type { CSSProperties } from 'react'
import { ScreenHeader } from './ScreenHeader'
import { ProductImagePlaceholder } from '@/components/studio/ProductImagePlaceholder'

type Product = {
  id: number
  name: string
  brandName: string | null
  sizeLabel: string | null
  /** Free-text category landing from the catalogue ("Leave-on exfoliant"). */
  subcategory?: string | null
}

type Props = {
  product: Product
  onConfirm: () => void
  /** Returns to the result list with the previous search term preserved. */
  onShowOtherMatches: () => void
  onNotMyProduct: () => void
  onBack: () => void
}

const OUTLINED: CSSProperties = {
  width: '100%',
  minHeight: '52px',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--color-accent-border)',
  backgroundColor: 'transparent',
  color: 'var(--color-alabaster-200)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9375rem',
  cursor: 'pointer',
}

export function ScreenConfirmMatch({
  product,
  onConfirm,
  onShowOtherMatches,
  onNotMyProduct,
  onBack,
}: Props) {
  const meta = [product.sizeLabel, product.subcategory]
    .filter((part): part is string => Boolean(part))
    .join(' · ')

  return (
    <div>
      <ScreenHeader title="Is this your product?" onBack={onBack} />

      <div
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-accent-border)',
          backgroundColor: 'var(--color-surface)',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <ProductImagePlaceholder size="lg" />
          <span style={{ minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8125rem',
                color: 'var(--color-alabaster-400)',
                marginBottom: '0.25rem',
              }}
            >
              {product.brandName ?? 'Unknown brand'}
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                lineHeight: 1.45,
                color: 'var(--color-alabaster-100)',
              }}
            >
              {product.name}
            </span>
            {meta && (
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-alabaster-400)',
                  marginTop: '0.375rem',
                }}
              >
                {meta}
              </span>
            )}
          </span>
        </div>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            color: 'var(--color-alabaster-400)',
            textAlign: 'right',
            margin: '1.25rem 0 0',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(196, 176, 154,0.18)',
          }}
        >
          Packaging may vary.
        </p>
      </div>

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
        onClick={onShowOtherMatches}
        style={{ ...OUTLINED, marginBottom: '0.75rem' }}
      >
        Show me other matches
      </button>

      <button type="button" onClick={onNotMyProduct} style={OUTLINED}>
        Not my product
      </button>
    </div>
  )
}
