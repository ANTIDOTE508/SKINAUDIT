'use client'

import { useState, useTransition, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { DossierProductStatus, ProductCategory } from '@prisma/client'
import { removeDossierProduct, updateDossierProductStatus } from '@/app/actions/dossier'
import { DossierNotes } from './DossierNotes'
import { DossierSheet } from './DossierSheet'
import { DossierTopbar } from './DossierTopbar'
import { CATEGORY_LABELS, STATUS_LABELS, STATUSES } from './dossierListing'
import './productDetail.css'

export type ProductDetailData = {
  id: number
  status: DossierProductStatus
  productName: string
  brandName: string | null
  category: ProductCategory
  sizeLabel: string | null
  /** Pre-formatted on the server so SSR and hydration agree. */
  addedLabel: string
  inDossierLabel: string
  notes: string | null
}

const STATUS_DESCRIPTIONS: Record<DossierProductStatus, string> = {
  ACTIVE: 'In your current routine',
  SEASONAL: 'Used at certain times of year',
  ARCHIVED: 'No longer in use — kept for your records',
}

const ChevronIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="5,2 10,7 5,12" />
  </svg>
)

const CloseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <line x1="3" y1="3" x2="15" y2="15" />
    <line x1="15" y1="3" x2="3" y2="15" />
  </svg>
)

function ActionIcon({ children }: { children: ReactNode }) {
  return (
    <span className="pd-action-icon">
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </span>
  )
}

/**
 * Dossier product detail — mockup 10 (templates/buildDossier/screen10.html).
 * Ingredients (11) and History (12) are sub-pages; Edit product has no screen
 * yet, so its row is shown disabled.
 */
export function ProductDetail({ product }: { product: ProductDetailData }) {
  const router = useRouter()
  const [openSheet, setOpenSheet] = useState<'status' | 'remove' | null>(null)
  const [statusDraft, setStatusDraft] = useState<DossierProductStatus>(product.status)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const closeSheet = () => {
    setOpenSheet(null)
    setError(null)
  }

  const run = (action: () => Promise<void>, failure: string) => {
    setError(null)
    startTransition(async () => {
      try {
        await action()
      } catch {
        setError(failure)
      }
    })
  }

  const openStatusSheet = () => {
    setStatusDraft(product.status)
    setOpenSheet('status')
  }

  const applyStatus = () =>
    run(async () => {
      await updateDossierProductStatus(product.id, statusDraft)
      setOpenSheet(null)
    }, 'The status could not be changed. Please try again.')

  const remove = () =>
    run(async () => {
      await removeDossierProduct(product.id)
      // replace: Back must not return to a product that no longer exists.
      router.replace('/dossier')
    }, 'The product could not be removed. Please try again.')

  return (
    <div className="pd-page">
      <DossierTopbar title="Product Detail" backHref="/dossier" backLabel="Back to Dossier" />

      <section className="pd-hero">
        <div className="pd-hero-img" aria-hidden="true">
          <svg
            width="52"
            height="88"
            viewBox="0 0 24 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="14" width="14" height="24" rx="2" />
            <rect x="7" y="8" width="10" height="7" rx="1" />
            <line x1="12" y1="3" x2="12" y2="8" />
            <circle cx="12" cy="2" r="1.5" />
            <line x1="7" y1="22" x2="17" y2="22" strokeOpacity="0.35" strokeWidth="0.9" />
            <line x1="7" y1="26" x2="14" y2="26" strokeOpacity="0.35" strokeWidth="0.9" />
          </svg>
        </div>
        {product.brandName && <span className="pd-hero-brand">{product.brandName}</span>}
        <h2 className="pd-hero-name">{product.productName}</h2>
        {product.sizeLabel && <span className="pd-hero-size">{product.sizeLabel}</span>}
        <div className="pd-hero-badges">
          <span className="pd-badge">{CATEGORY_LABELS[product.category]}</span>
          <span className={`pd-badge${product.status === 'ACTIVE' ? ' status-active' : ''}`}>
            {STATUS_LABELS[product.status]}
          </span>
        </div>
      </section>

      <dl className="pd-meta-strip">
        <div className="pd-meta-item">
          <dt className="pd-meta-label">Added</dt>
          <dd className="pd-meta-value">{product.addedLabel}</dd>
        </div>
        <div className="pd-meta-divider" aria-hidden="true" />
        <div className="pd-meta-item">
          <dt className="pd-meta-label">In Dossier</dt>
          <dd className="pd-meta-value">{product.inDossierLabel}</dd>
        </div>
        <div className="pd-meta-divider" aria-hidden="true" />
        <div className="pd-meta-item">
          <dt className="pd-meta-label">Times used</dt>
          {/* Usage is not tracked yet. */}
          <dd className="pd-meta-value">—</dd>
        </div>
      </dl>

      {error && !openSheet && (
        <p className="pd-error" role="alert">
          {error}
        </p>
      )}

      <h3 className="pd-section-header">Manage</h3>
      <div className="pd-action-group">
        <Link href={`/dossier/${product.id}/ingredients`} className="pd-action-row">
          <ActionIcon>
            <line x1="3" y1="5" x2="17" y2="5" />
            <line x1="3" y1="9" x2="17" y2="9" />
            <line x1="3" y1="13" x2="13" y2="13" />
            <line x1="3" y1="17" x2="10" y2="17" />
          </ActionIcon>
          <span className="pd-action-text">
            <span className="pd-action-label">Ingredients</span>
            <span className="pd-action-desc">Full INCI list and key actives</span>
          </span>
          <span className="pd-action-arrow">
            <ChevronIcon />
          </span>
        </Link>

        <Link href={`/dossier/${product.id}/history`} className="pd-action-row">
          <ActionIcon>
            <circle cx="10" cy="10" r="7.5" />
            <polyline points="10,6 10,10 13,12" />
          </ActionIcon>
          <span className="pd-action-text">
            <span className="pd-action-label">History</span>
            <span className="pd-action-desc">Status changes and notes over time</span>
          </span>
          <span className="pd-action-arrow">
            <ChevronIcon />
          </span>
        </Link>

        <button type="button" className="pd-action-row" disabled>
          <ActionIcon>
            <path d="M14 3l3 3-9 9H5v-3L14 3z" />
          </ActionIcon>
          <span className="pd-action-text">
            <span className="pd-action-label">Edit product</span>
            <span className="pd-action-desc">Update name, size, or category</span>
          </span>
          <span className="pd-action-arrow">
            <ChevronIcon />
          </span>
        </button>

        <button
          type="button"
          className="pd-action-row"
          aria-haspopup="dialog"
          onClick={openStatusSheet}
        >
          <ActionIcon>
            <circle cx="10" cy="10" r="2" />
            <circle cx="10" cy="3.5" r="1.5" />
            <circle cx="10" cy="16.5" r="1.5" />
          </ActionIcon>
          <span className="pd-action-text">
            <span className="pd-action-label">Change status</span>
            <span className="pd-action-desc">Active · Seasonal · Archived</span>
          </span>
          <span className="pd-action-arrow">
            <ChevronIcon />
          </span>
        </button>
      </div>

      <h3 className="pd-section-header">Notes</h3>
      <div className="pd-notes-wrap">
        <DossierNotes
          dossierProductId={product.id}
          notes={product.notes}
          label="Personal notes"
          placeholder="Tap to add a note about this product…"
        />
      </div>

      <div className="pd-action-group pd-danger-group">
        <button
          type="button"
          className="pd-action-row danger"
          aria-haspopup="dialog"
          onClick={() => setOpenSheet('remove')}
        >
          <ActionIcon>
            <polyline points="4,6 16,6" />
            <path d="M7 6V4h6v2" />
            <rect x="5" y="6" width="10" height="11" rx="1" />
            <line x1="8" y1="10" x2="8" y2="14" />
            <line x1="12" y1="10" x2="12" y2="14" />
          </ActionIcon>
          <span className="pd-action-text">
            <span className="pd-action-label">Remove from Dossier</span>
            <span className="pd-action-desc">Permanently deletes this product and its history</span>
          </span>
        </button>
      </div>

      {openSheet === 'status' && (
        <DossierSheet label="Change status" maxWidth={480} onClose={closeSheet}>
          <div className="ds-header">
            <h2 className="ds-title">Change status</h2>
            <button type="button" className="ds-close" aria-label="Close" onClick={closeSheet}>
              <CloseIcon />
            </button>
          </div>

          <div className="ds-sort-group" role="radiogroup" aria-label="Product status">
            {STATUSES.map(({ value, label }) => (
              <label key={value} className="ds-sort-row">
                <input
                  type="radio"
                  name="dossier-product-status"
                  value={value}
                  checked={statusDraft === value}
                  onChange={() => setStatusDraft(value)}
                />
                <span className="ds-radio" aria-hidden="true">
                  <span className="ds-radio-dot" />
                </span>
                <span className="ds-sort-text">
                  <span className="ds-sort-label">{label}</span>
                  <span className="ds-sort-desc">{STATUS_DESCRIPTIONS[value]}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="ds-actions">
            <button
              type="button"
              className="ds-btn-primary"
              onClick={applyStatus}
              disabled={isPending}
            >
              {isPending ? 'Saving…' : 'Apply'}
            </button>
            <button type="button" className="ds-btn-secondary" onClick={closeSheet}>
              Cancel
            </button>
          </div>
          {error && (
            <p className="pd-error pd-error-sheet" role="alert">
              {error}
            </p>
          )}
        </DossierSheet>
      )}

      {openSheet === 'remove' && (
        <DossierSheet label="Remove from Dossier" maxWidth={480} onClose={closeSheet}>
          <div className="ds-header">
            <h2 className="ds-title">Remove this product?</h2>
            <button type="button" className="ds-close" aria-label="Close" onClick={closeSheet}>
              <CloseIcon />
            </button>
          </div>

          <p className="pd-confirm-text">
            {product.productName} and its history will be permanently deleted from your Dossier.
            This cannot be undone.
          </p>

          <div className="ds-actions">
            <button
              type="button"
              className="ds-btn-primary pd-btn-danger"
              onClick={remove}
              disabled={isPending}
            >
              {isPending ? 'Removing…' : 'Remove'}
            </button>
            <button type="button" className="ds-btn-secondary" onClick={closeSheet}>
              Cancel
            </button>
          </div>
          {error && (
            <p className="pd-error pd-error-sheet" role="alert">
              {error}
            </p>
          )}
        </DossierSheet>
      )}
    </div>
  )
}
