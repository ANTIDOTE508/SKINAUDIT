'use client'

import { useRef, useEffect, useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { StepHeader } from './StepHeader'
import { searchProducts, addProductToDossier } from '@/app/actions/onboarding'

type ProductResult = {
  id: number
  name: string
  category: string
  brand: { name: string } | null
}

type Props = {
  onBack: () => void
  onComplete?: () => Promise<void>
}

export function StepProducts({ onBack, onComplete }: Props) {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductResult[]>([])
  const [addedIds, setAddedIds] = useState<number[]>([])
  const [isPending, startTransition] = useTransition()
  const [isSearching, setIsSearching] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (searchRef.current) {
        gsap.fromTo(
          searchRef.current.parentElement,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', delay: 0.25 }
        )
      }
      if (actionsRef.current) {
        gsap.fromTo(
          actionsRef.current,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.5 }
        )
      }
    })
    return () => ctx.revert()
  }, [])

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim() || value.length < 2) {
      setResults([])
      return
    }
    setIsSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchProducts(value)
        setResults(data)
        // Animate results in
        if (resultsRef.current && data.length > 0) {
          const items = resultsRef.current.querySelectorAll('[data-result]')
          gsap.fromTo(
            items,
            { y: 8, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.3, stagger: 0.04, ease: 'power2.out' }
          )
        }
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 350)
  }, [])

  const handleAdd = (product: ProductResult) => {
    startTransition(async () => {
      try {
        await addProductToDossier(product.id)
        setAddedIds((prev) => [...prev, product.id])
      } catch {
        // Silent fail — user can retry
      }
    })
  }

  const handleFinish = async () => {
    setIsFinishing(true)
    setFinishError(null)
    try {
      if (onComplete) await onComplete()
      router.refresh()
    } catch {
      setFinishError('Something went wrong. Please try again.')
      setIsFinishing(false)
    }
  }

  const CATEGORY_LABELS: Record<string, string> = {
    CLEANSER: 'Cleanser',
    TONER: 'Toner',
    SERUM: 'Serum',
    MOISTURIZER: 'Moisturizer',
    SUNSCREEN: 'Sunscreen',
    MASK: 'Mask',
    OIL: 'Oil',
    TREATMENT: 'Treatment',
    OTHER: 'Product',
  }

  return (
    <div>
      <StepHeader
        eyebrow="Step 6 of 6"
        title="Add your first product."
        subtitle="Start building your Skincare Dossier — even one product is enough to begin your analysis."
      />

      {/* Search bar */}
      <div
        style={{
          position: 'relative',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1.25rem',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            transition: 'border-color 180ms var(--ease-luxury)',
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-sienna-500)'
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)'
          }}
        >
          {/* Search icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{ flexShrink: 0, color: 'var(--color-text-muted)' }}
          >
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M10.5 10.5L13.5 13.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>

          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by product name or brand…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '0.9375rem',
              caretColor: 'var(--color-sienna-400)',
            }}
            aria-label="Search products"
            autoComplete="off"
          />

          {isSearching && (
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                border: '1.5px solid var(--color-sienna-500)',
                borderTopColor: 'transparent',
                animation: 'spin 0.6s linear infinite',
                flexShrink: 0,
              }}
            />
          )}
        </div>

        {/* Search results dropdown */}
        {results.length > 0 && (
          <div
            ref={resultsRef}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              overflow: 'hidden',
              zIndex: 20,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {results.map((product) => {
              const isAdded = addedIds.includes(product.id)
              return (
                <div
                  key={product.id}
                  data-result
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.875rem 1.25rem',
                    borderBottom: '1px solid var(--color-border)',
                    gap: '1rem',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 400,
                        fontSize: '0.9rem',
                        color: 'var(--color-alabaster-100)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {product.name}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 300,
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        marginTop: '2px',
                      }}
                    >
                      {product.brand?.name ?? 'Unknown brand'} ·{' '}
                      {CATEGORY_LABELS[product.category] ?? product.category}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => !isAdded && handleAdd(product)}
                    disabled={isAdded || isPending}
                    style={{
                      flexShrink: 0,
                      padding: '0.375rem 0.875rem',
                      borderRadius: '100px',
                      border: isAdded
                        ? '1px solid var(--color-sage-600)'
                        : '1px solid var(--color-sienna-500)',
                      backgroundColor: isAdded ? 'transparent' : 'var(--color-sienna-500)',
                      color: isAdded
                        ? 'var(--color-sage-400)'
                        : 'var(--color-alabaster-50)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: isAdded ? 'default' : 'pointer',
                      transition: 'all 180ms ease',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {isAdded ? '✓ Added' : '+ Add'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {query.length >= 2 && !isSearching && results.length === 0 && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 300,
                fontSize: '0.875rem',
                color: 'var(--color-text-muted)',
                margin: 0,
              }}
            >
              No products found for &ldquo;{query}&rdquo;. Manual entry is coming soon.
            </p>
          </div>
        )}
      </div>

      {/* OCR placeholder notice */}
      <div
        style={{
          padding: '0.875rem 1.25rem',
          borderRadius: 'var(--radius-card)',
          border: '1px dashed var(--color-border)',
          backgroundColor: 'transparent',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
        }}
      >
        <span style={{ fontSize: '1.25rem', opacity: 0.5 }}>📷</span>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              fontSize: '0.875rem',
              color: 'var(--color-text-muted)',
            }}
          >
            Scan product label — coming soon
          </div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '0.75rem',
              color: 'var(--color-obsidian-700)',
              marginTop: '2px',
            }}
          >
            OCR-powered ingredient parsing for instant product ingestion
          </div>
        </div>
      </div>

      {/* Added products summary */}
      {addedIds.length > 0 && (
        <div
          style={{
            marginBottom: '2rem',
            padding: '0.875rem 1.25rem',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-sage-600)',
            backgroundColor: 'rgba(107,143,99,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ color: 'var(--color-sage-400)', fontSize: '1rem' }}>✓</span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              fontSize: '0.875rem',
              color: 'var(--color-sage-400)',
            }}
          >
            {addedIds.length} product{addedIds.length > 1 ? 's' : ''} added to your Dossier
          </span>
        </div>
      )}

      {/* Navigation actions */}
      <div ref={actionsRef} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary"
          style={{ minHeight: '52px' }}
          disabled={isFinishing}
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={handleFinish}
          className="btn-primary"
          style={{ minHeight: '52px', paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
          disabled={isFinishing}
        >
          {isFinishing ? 'Setting up your space…' : addedIds.length > 0 ? 'Enter my space →' : 'Enter my space →'}
        </button>

        {addedIds.length === 0 && (
          <button
            type="button"
            onClick={handleFinish}
            className="btn-ghost"
            disabled={isFinishing}
            style={{ fontSize: '0.8125rem' }}
          >
            I'll add products later
          </button>
        )}
      </div>

      {finishError && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.8125rem',
          color: 'var(--color-blush-500)',
          marginTop: '0.75rem',
        }}>
          {finishError}
        </p>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
