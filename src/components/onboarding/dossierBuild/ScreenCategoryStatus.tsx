'use client'

import { useState, useTransition } from 'react'
import { StepHeader } from '../StepHeader'
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
}

const STATUS_OPTIONS: { value: DossierProductStatus; label: string; description: string }[] = [
  { value: 'ACTIVE', label: 'Active', description: 'Currently using' },
  { value: 'SEASONAL', label: 'Seasonal', description: 'Used during certain periods' },
  { value: 'ARCHIVED', label: 'Archived', description: 'No longer using' },
]

export function ScreenCategoryStatus({ product, onSubmit, categoryError }: Props) {
  const [category, setCategory] = useState<ProductCategory>(product.category)
  const [status, setStatus] = useState<DossierProductStatus>('ACTIVE')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    startTransition(async () => {
      await onSubmit({ category, status })
    })
  }

  return (
    <div>
      <StepHeader title="Add to your Dossier" />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-accent-border)',
          backgroundColor: 'var(--color-surface)',
          marginBottom: '1.5rem',
        }}
      >
        <ProductImagePlaceholder size="md" />
        <span>
          <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-alabaster-400)' }}>
            {product.brandName ?? 'Unknown brand'}
          </span>
          <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-alabaster-100)' }}>
            {product.name}
          </span>
        </span>
      </div>

      <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-alabaster-300)', marginBottom: '0.5rem' }}>
        Category
      </label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as ProductCategory)}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-accent-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-alabaster-100)',
          fontFamily: 'var(--font-body)',
          marginBottom: '1.5rem',
        }}
      >
        <option value="CLEANSING">Cleansing</option>
        <option value="PREPARATION">Preparation</option>
        <option value="TREATMENT">Treatment</option>
        <option value="SUPPORT">Support</option>
        <option value="PROTECTION">Protection</option>
      </select>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-alabaster-300)', marginBottom: '0.75rem' }}>
        Status
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '2rem' }}>
        {STATUS_OPTIONS.map((option) => (
          <label
            key={option.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-accent-border)',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="status"
              checked={status === option.value}
              onChange={() => setStatus(option.value)}
            />
            <span>
              <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-alabaster-100)' }}>
                {option.label}
              </span>
              <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-alabaster-400)' }}>
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </div>

      {categoryError && (
        <p
          role="alert"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: 'var(--color-blush-500)',
            marginBottom: '1rem',
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
        style={{ width: '100%', minHeight: '58px' }}
      >
        {isPending ? 'Adding…' : 'Add to Dossier'}
      </button>
    </div>
  )
}
