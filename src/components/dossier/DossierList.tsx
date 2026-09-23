'use client'

import { useState } from 'react'
import type { DossierProductStatus } from '@prisma/client'
import { DossierEmptyState } from './DossierEmptyState'
import { DossierFilterSheet } from './DossierFilterSheet'
import { DossierSortSheet } from './DossierSortSheet'
import { useOpenDossierModal } from './DossierModalContext'
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  EMPTY_FILTER,
  SORT_OPTIONS,
  applyFilter,
  applySort,
  filterCount,
  type DossierFilter,
  type DossierListItem,
  type DossierSort,
} from './dossierListing'
import './dossierList.css'

export type { DossierListItem }

type Tab = 'ALL' | DossierProductStatus

const TABS: { key: Tab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'SEASONAL', label: 'Seasonal' },
  { key: 'ARCHIVED', label: 'Archived' },
]

/**
 * Dossier product list — mockup 08 (templates/buildDossier/screen08.html)
 * without its "Dossier / Studio" topbar, which the Studio sidebar replaces.
 * The status tab and the filter sheet (mockup 09) combine; the sort sheet
 * (mockup 09b) orders the result.
 */
export function DossierList({ items }: { items: DossierListItem[] }) {
  const [tab, setTab] = useState<Tab>('ALL')
  const [filter, setFilter] = useState<DossierFilter>(EMPTY_FILTER)
  const [sort, setSort] = useState<DossierSort>('date-desc')
  const [openSheet, setOpenSheet] = useState<'filter' | 'sort' | null>(null)
  const openDossierModal = useOpenDossierModal()
  const openAddProduct = () => openDossierModal('method')

  if (items.length === 0) {
    return (
      <div className="dl-page">
        <DossierEmptyState onAddProduct={openAddProduct} />
      </div>
    )
  }

  // Tab counts follow the filter sheet, so each count matches what its tab shows.
  const filtered = applyFilter(items, filter)
  const countFor = (key: Tab) =>
    key === 'ALL' ? filtered.length : filtered.filter((item) => item.status === key).length
  const visible = applySort(
    tab === 'ALL' ? filtered : filtered.filter((item) => item.status === tab),
    sort
  )
  const activeFilters = filterCount(filter)
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label
  const emptyMessage =
    activeFilters > 0
      ? 'No products match these filters.'
      : `No ${TABS.find((t) => t.key === tab)?.label.toLowerCase()} products.`

  return (
    <div className="dl-page">
      {/* Status filters, not ARIA tabs: they narrow one list rather than
          switching panels, so each is a toggle button (aria-pressed). */}
      <div className="dl-tabs" role="group" aria-label="Filter by status">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            className={`dl-tab${tab === key ? ' active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label} ({countFor(key)})
          </button>
        ))}
      </div>

      <div className="dl-filter-bar">
        <div className="dl-filter-left">
          <button
            type="button"
            className={`dl-filter-btn${activeFilters > 0 ? ' is-set' : ''}`}
            aria-haspopup="dialog"
            onClick={() => setOpenSheet('filter')}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="1" y1="3" x2="12" y2="3" />
              <line x1="3" y1="6.5" x2="10" y2="6.5" />
              <line x1="5" y1="10" x2="8" y2="10" />
            </svg>
            Filter{activeFilters > 0 && ` (${activeFilters})`}
          </button>
          <button
            type="button"
            className="dl-filter-btn"
            aria-haspopup="dialog"
            aria-label={`Sort products — currently ${sortLabel}`}
            onClick={() => setOpenSheet('sort')}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="1" y1="2.5" x2="8" y2="2.5" />
              <line x1="1" y1="6.5" x2="10" y2="6.5" />
              <line x1="1" y1="10.5" x2="12" y2="10.5" />
            </svg>
            {sortLabel}
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="2,4 5,7 8,4" />
            </svg>
          </button>
        </div>
        <span className="dl-filter-count" aria-live="polite">
          {visible.length} {visible.length === 1 ? 'product' : 'products'}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="dl-tab-empty">{emptyMessage}</p>
      ) : (
        <ul className="dl-list">
          {visible.map((item) => (
            // Rows are not interactive yet: the product detail (mockup 10)
            // does not exist, so the mockup's chevron is left out too.
            <li key={item.id} className="dl-row">
              <div className="dl-img" aria-hidden="true">
                <svg
                  width="20"
                  height="32"
                  viewBox="0 0 20 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="11" width="12" height="19" rx="2" />
                  <rect x="6" y="7" width="8" height="5" rx="1" />
                  <line x1="10" y1="3" x2="10" y2="7" />
                  <circle cx="10" cy="2" r="1.2" />
                </svg>
              </div>
              <div className="dl-info">
                {item.brandName && <span className="dl-brand">{item.brandName}</span>}
                <span className="dl-name">{item.productName}</span>
                <div className="dl-meta">
                  <span className="dl-tag">{CATEGORY_LABELS[item.category]}</span>
                  <span className={`dl-dot ${item.status.toLowerCase()}`} aria-hidden="true" />
                  <span className="dl-status">{STATUS_LABELS[item.status]}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="dl-fab-wrap">
        <button type="button" className="dl-fab" onClick={openAddProduct}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="6" y1="1" x2="6" y2="11" />
            <line x1="1" y1="6" x2="11" y2="6" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Mounted only while open, so each opening starts from the applied state. */}
      {openSheet === 'filter' && (
        <DossierFilterSheet
          initial={filter}
          onApply={(next) => {
            setFilter(next)
            setOpenSheet(null)
          }}
          onClose={() => setOpenSheet(null)}
        />
      )}
      {openSheet === 'sort' && (
        <DossierSortSheet
          initial={sort}
          onApply={(next) => {
            setSort(next)
            setOpenSheet(null)
          }}
          onClose={() => setOpenSheet(null)}
        />
      )}
    </div>
  )
}
