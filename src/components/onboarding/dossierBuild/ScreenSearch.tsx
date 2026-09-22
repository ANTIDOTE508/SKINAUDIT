'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { ChevronRight, Search, X } from 'lucide-react'
import { ScreenHeader } from './ScreenHeader'
import { ProductImagePlaceholder } from '@/components/studio/ProductImagePlaceholder'
import { searchProducts } from '@/app/actions/dossier'
import type { DossierProductSummary } from './types'

type Props = {
  onBack: () => void
  onSelectProduct: (product: DossierProductSummary) => void
  /** Carried over when the user returns from Confirm Match, so their search is
   *  not lost — see ScreenConfirmMatch's "Show me other matches". */
  initialQuery?: string
  onQueryChange?: (query: string) => void
}

export function ScreenSearch({ onBack, onSelectProduct, initialQuery = '', onQueryChange }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<DossierProductSummary[]>([])
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Run the initial term once on mount so a return trip from Confirm Match
  // lands back on the same result list rather than an empty one.
  useEffect(() => {
    const term = initialQuery.trim()
    if (term.length < 2) return
    let cancelled = false
    searchProducts(term).then((found) => {
      if (!cancelled) setResults(found)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runSearch = (value: string) => {
    setQuery(value)
    onQueryChange?.(value)
    startTransition(async () => {
      setResults(value.trim().length >= 2 ? await searchProducts(value) : [])
    })
  }

  const clearQuery = () => {
    setQuery('')
    onQueryChange?.('')
    setResults([])
    inputRef.current?.focus()
  }

  return (
    <>
      <ScreenHeader title="Find your product" onBack={onBack} />

      <div className="db-content">
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <Search
            size={18}
            strokeWidth={1.5}
            aria-hidden="true"
            color="var(--color-alabaster-400)"
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Search by brand or product name"
            aria-label="Search by brand or product name"
            style={{
              width: '100%',
              padding: '0.875rem 2.75rem 0.875rem 2.75rem',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-accent-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-alabaster-100)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9375rem',
            }}
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={clearQuery}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: 'var(--color-alabaster-400)',
              }}
            >
              <X size={17} strokeWidth={1.5} aria-hidden="true" />
            </button>
          )}
        </div>

        <p role="status" aria-live="polite" className="db-sr">
          {isPending ? 'Searching' : `${results.length} results`}
        </p>

        {/* Flat rows divided by hairlines — the mockup does not box each result. */}
        {results.map((product, index) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelectProduct(product)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              width: '100%',
              padding: '1rem 0',
              background: 'none',
              border: 'none',
              borderTop: index === 0 ? 'none' : '1px solid rgba(196, 176, 154,0.15)',
              textAlign: 'left',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            <ProductImagePlaceholder size="sm" />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-alabaster-400)',
                  marginBottom: '0.125rem',
                }}
              >
                {product.brandName ?? 'Unknown brand'}
              </span>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  lineHeight: 1.4,
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
                    fontSize: '0.75rem',
                    color: 'var(--color-alabaster-400)',
                    marginTop: '0.25rem',
                  }}
                >
                  {product.sizeLabel}
                </span>
              )}
            </span>
            <ChevronRight
              size={18}
              strokeWidth={1.5}
              color="var(--color-alabaster-400)"
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            />
          </button>
        ))}
      </div>
    </>
  )
}
