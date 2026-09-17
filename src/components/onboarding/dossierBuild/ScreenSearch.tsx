'use client'

import { useState, useTransition } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { StepHeader } from '../StepHeader'
import { ProductImagePlaceholder } from '@/components/studio/ProductImagePlaceholder'
import { searchProducts } from '@/app/actions/dossier'

type SearchResult = Awaited<ReturnType<typeof searchProducts>>[number]

type Props = {
  onBack: () => void
  onSelectProduct: (product: SearchResult) => void
}

export function ScreenSearch({ onBack, onSelectProduct }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isPending, startTransition] = useTransition()

  const handleChange = (value: string) => {
    setQuery(value)
    startTransition(async () => {
      setResults(value.trim().length >= 2 ? await searchProducts(value) : [])
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1rem' }}
      >
        <ArrowLeft size={20} strokeWidth={1.5} color="var(--color-alabaster-300)" />
      </button>

      <StepHeader title="Find your product" />

      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search by brand or product name"
        style={{
          width: '100%',
          padding: '0.875rem 1rem',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-accent-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-alabaster-100)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9375rem',
          marginBottom: '1.25rem',
        }}
      />

      {isPending && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-alabaster-400)' }}>
          Searching…
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {results.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelectProduct(product)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.875rem',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-accent-border)',
              backgroundColor: 'var(--color-surface)',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <ProductImagePlaceholder size="sm" />
            <span style={{ flex: 1 }}>
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
            <ChevronRight size={18} strokeWidth={1.5} color="var(--color-alabaster-400)" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  )
}
