'use client'

import { useState } from 'react'
import { DossierSheet } from './DossierSheet'
import { SORT_OPTIONS, type DossierSort } from './dossierListing'

type Props = {
  /** Currently applied sort — seeds the draft each time the sheet opens. */
  initial: DossierSort
  onApply: (sort: DossierSort) => void
  onClose: () => void
}

/** Mockup 09b. The radio choice is a draft until "Apply". */
export function DossierSortSheet({ initial, onApply, onClose }: Props) {
  const [draft, setDraft] = useState<DossierSort>(initial)

  return (
    <DossierSheet label="Sort products" maxWidth={480} onClose={onClose}>
      <div className="ds-header">
        <h2 className="ds-title">Sort by</h2>
        <button type="button" className="ds-close" aria-label="Close" onClick={onClose}>
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
        </button>
      </div>

      <div className="ds-sort-group" role="radiogroup" aria-label="Sort order">
        {SORT_OPTIONS.map(({ value, label, desc, dir }) => (
          <label key={value} className="ds-sort-row">
            <input
              type="radio"
              name="dossier-sort"
              value={value}
              checked={draft === value}
              onChange={() => setDraft(value)}
            />
            <span className="ds-radio" aria-hidden="true">
              <span className="ds-radio-dot" />
            </span>
            <span className="ds-sort-text">
              <span className="ds-sort-label">{label}</span>
              <span className="ds-sort-desc">{desc}</span>
            </span>
            {dir && (
              <span className="ds-sort-dir" aria-hidden="true">
                {dir}
              </span>
            )}
          </label>
        ))}
      </div>

      <div className="ds-actions">
        <button type="button" className="ds-btn-primary" onClick={() => onApply(draft)}>
          Apply
        </button>
        <button type="button" className="ds-btn-secondary" onClick={onClose}>
          Cancel
        </button>
      </div>
    </DossierSheet>
  )
}
