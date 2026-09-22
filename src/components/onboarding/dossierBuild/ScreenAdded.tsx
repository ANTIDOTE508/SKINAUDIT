'use client'

import { Check } from 'lucide-react'
import { ProductImagePlaceholder } from '@/components/studio/ProductImagePlaceholder'
import { ScreenHeader } from './ScreenHeader'

type Props = {
  productName: string
  brandName?: string | null
  categoryLabel?: string | null
  statusLabel?: string | null
  isFinishing: boolean
  finishError?: string | null
  onAddAnother: () => void
  onContinueToStudio: () => void
  onNavigateStudio: () => void
}

export function ScreenAdded({
  productName,
  brandName,
  categoryLabel,
  statusLabel,
  isFinishing,
  finishError,
  onAddAnother,
  onContinueToStudio,
  onNavigateStudio,
}: Props) {
  const fullName = brandName ? `${brandName} ${productName}` : productName
  const tags = [categoryLabel, statusLabel].filter((tag): tag is string => Boolean(tag))

  return (
    <>
      <ScreenHeader activeSection="dossier" onNavigateStudio={onNavigateStudio} />

      <div className="db-content" style={{ flex: 1, textAlign: 'center' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            paddingBottom: '2rem',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              border: '1px solid var(--color-accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <Check size={24} strokeWidth={1.5} color="var(--color-sienna-400)" />
          </div>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-sienna-400)',
              margin: '0 0 0.5rem',
            }}
          >
            Added
          </p>

          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 300,
              fontSize: '1.5rem',
              lineHeight: 1.2,
              color: 'var(--color-alabaster-50)',
              margin: '0 0 0.875rem',
            }}
          >
            Added to your Dossier
          </h2>

          {tags.length > 0 && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 300,
                fontSize: '0.875rem',
                lineHeight: 1.6,
                color: 'var(--color-alabaster-400)',
                margin: '0 0 2rem',
                maxWidth: '24rem',
              }}
            >
              {fullName} has been saved as {tags.join(' · ')}.
            </p>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              textAlign: 'left',
            }}
          >
            <ProductImagePlaceholder size="md" />
            <span style={{ minWidth: 0 }}>
              {brandName && (
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8125rem',
                    color: 'var(--color-alabaster-400)',
                    marginBottom: '0.25rem',
                  }}
                >
                  {brandName}
                </span>
              )}
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-body)',
                  fontSize: '1rem',
                  lineHeight: 1.45,
                  color: 'var(--color-alabaster-100)',
                  marginBottom: tags.length > 0 ? '0.5rem' : 0,
                }}
              >
                {productName}
              </span>
              {tags.length > 0 && (
                <span style={{ display: 'flex', gap: '0.5rem' }}>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.25rem 0.625rem',
                        borderRadius: 'var(--radius-badge)',
                        border: '1px solid var(--color-accent-border)',
                        color: 'var(--color-alabaster-300)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.6875rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              )}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          {finishError && (
            <p
              role="alert"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8125rem',
                color: 'var(--color-blush-500)',
                margin: '0 0 1rem',
              }}
            >
              {finishError}
            </p>
          )}

          <button
            type="button"
            onClick={onContinueToStudio}
            disabled={isFinishing}
            className="btn-primary btn-primary-accent"
            style={{ width: '100%', minHeight: '56px', marginBottom: '0.75rem' }}
          >
            {isFinishing ? 'Setting up your space…' : 'Go to Dossier'}
          </button>

          <button
            type="button"
            onClick={onAddAnother}
            disabled={isFinishing}
            className="btn-secondary"
            style={{
              width: '100%',
              minHeight: '56px',
              borderRadius: 'var(--radius-card)',
              borderColor: 'var(--color-accent-border)',
              fontSize: '0.9375rem',
              fontWeight: 400,
              letterSpacing: 0,
              textTransform: 'none',
            }}
          >
            Add another product
          </button>
        </div>
      </div>
    </>
  )
}
