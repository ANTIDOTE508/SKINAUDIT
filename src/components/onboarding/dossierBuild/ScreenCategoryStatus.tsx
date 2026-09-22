'use client'

import { useState, useTransition } from 'react'
import { Info } from 'lucide-react'
import { ScreenHeader } from './ScreenHeader'
import { ProductImagePlaceholder } from '@/components/studio/ProductImagePlaceholder'
import type { ProductCategory, DossierProductStatus } from '@prisma/client'

type Product = {
  id: number
  name: string
  brandName: string | null
  sizeLabel: string | null
  category: ProductCategory
}

type Props = {
  product: Product
  onSubmit: (input: { category: ProductCategory; status: DossierProductStatus }) => Promise<void>
  categoryError?: string | null
  onBack: () => void
  onClose: () => void
}

const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: 'CLEANSING', label: 'Cleansing' },
  { value: 'PREPARATION', label: 'Preparation' },
  { value: 'TREATMENT', label: 'Treatment' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'PROTECTION', label: 'Protection' },
]

const STATUS_OPTIONS: { value: DossierProductStatus; label: string; description: string }[] = [
  { value: 'ACTIVE', label: 'Active', description: 'Currently using' },
  { value: 'SEASONAL', label: 'Seasonal', description: 'Used during certain periods' },
  { value: 'ARCHIVED', label: 'Archived', description: 'No longer using' },
]

const CATEGORY_HELP =
  'How this product is evaluated in your rituals. Treatment products are the ones audited against your skin.'

export function ScreenCategoryStatus({ product, onSubmit, categoryError, onBack, onClose }: Props) {
  const [category, setCategory] = useState<ProductCategory>(product.category)
  const [status, setStatus] = useState<DossierProductStatus>('ACTIVE')
  const [isPending, startTransition] = useTransition()
  const [showCategoryHelp, setShowCategoryHelp] = useState(false)

  const handleSubmit = () => {
    startTransition(async () => {
      await onSubmit({ category, status })
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <ScreenHeader title="Add to your Dossier" onBack={onBack} onClose={onClose} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <ProductImagePlaceholder size="md" />
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
          {product.sizeLabel && (
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8125rem',
                color: 'var(--color-alabaster-400)',
                marginTop: '0.375rem',
              }}
            >
              {product.sizeLabel}
            </span>
          )}
        </span>
      </div>

      {/* Category — native select so the OS picker handles long option lists,
          restyled to the mockup's bordered field with a custom chevron. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          marginBottom: '0.5rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--color-alabaster-200)',
          }}
        >
          Category
        </span>
        <button
          type="button"
          aria-label="What is a category?"
          aria-expanded={showCategoryHelp}
          onClick={() => setShowCategoryHelp((open) => !open)}
          style={{
            display: 'inline-flex',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--color-alabaster-400)',
            lineHeight: 0,
          }}
        >
          <Info size={14} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      {showCategoryHelp && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            lineHeight: 1.6,
            color: 'var(--color-alabaster-400)',
            margin: '0 0 0.625rem',
          }}
        >
          {CATEGORY_HELP}
        </p>
      )}

      <div style={{ position: 'relative', marginBottom: '1.75rem' }}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ProductCategory)}
          style={{
            width: '100%',
            appearance: 'none',
            WebkitAppearance: 'none',
            padding: '0.875rem 2.5rem 0.875rem 1rem',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-accent-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-alabaster-100)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem',
          }}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        >
          <path
            d="M4 6.5 8 10.5 12 6.5"
            stroke="var(--color-alabaster-400)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Status — custom circular indicators, per the mockup. */}
      <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1.75rem' }}>
        <legend
          style={{
            padding: 0,
            marginBottom: '0.875rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--color-alabaster-200)',
          }}
        >
          Status
        </legend>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          {STATUS_OPTIONS.map((option) => {
            const checked = status === option.value
            return (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="dossier-status"
                  value={option.value}
                  checked={checked}
                  onChange={() => setStatus(option.value)}
                  className="db-sr"
                />
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: `1px solid ${checked ? 'var(--color-sienna-400)' : 'var(--color-alabaster-400)'}`,
                    flexShrink: 0,
                    marginTop: '0.125rem',
                    transition: 'border-color 180ms ease',
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: checked ? 'var(--color-sienna-400)' : 'transparent',
                      transition: 'background-color 180ms ease',
                    }}
                  />
                </span>
                <span>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.9375rem',
                      color: 'var(--color-alabaster-100)',
                    }}
                  >
                    {option.label}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.8125rem',
                      color: 'var(--color-alabaster-400)',
                    }}
                  >
                    {option.description}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div style={{ marginTop: 'auto' }}>
        {categoryError && (
          <p
            role="alert"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: 'var(--color-blush-500)',
              margin: '0 0 1rem',
            }}
          >
            {categoryError}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="btn-primary btn-primary-accent"
          style={{ width: '100%', minHeight: '56px' }}
        >
          {isPending ? 'Adding…' : 'Add to Dossier'}
        </button>
      </div>
    </div>
  )
}
