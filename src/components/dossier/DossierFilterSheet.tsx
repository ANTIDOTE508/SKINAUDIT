'use client'

import { useState } from 'react'
import { DossierSheet } from './DossierSheet'
import { CATEGORIES, STATUSES, EMPTY_FILTER, type DossierFilter } from './dossierListing'

type Props = {
  /** Currently applied filter — seeds the draft each time the sheet opens. */
  initial: DossierFilter
  onApply: (filter: DossierFilter) => void
  onClose: () => void
}

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function Check() {
  return (
    <svg
      className="ds-chip-check"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="1.5,5 4,7.5 8.5,2.5" />
    </svg>
  )
}

/** Mockup 09. Chips edit a draft; nothing applies until "Show results". */
export function DossierFilterSheet({ initial, onApply, onClose }: Props) {
  const [draft, setDraft] = useState<DossierFilter>(initial)

  return (
    <DossierSheet label="Filter products" maxWidth={540} onClose={onClose}>
      <div className="ds-header">
        <h2 className="ds-title">Filter</h2>
        <button type="button" className="ds-reset" onClick={() => setDraft(EMPTY_FILTER)}>
          Reset all
        </button>
      </div>

      <div className="ds-sections">
        <div className="ds-section">
          <span className="ds-label" id="ds-filter-category">
            Category
          </span>
          <div className="ds-chips" role="group" aria-labelledby="ds-filter-category">
            {CATEGORIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className="ds-chip"
                aria-pressed={draft.categories.includes(value)}
                onClick={() => setDraft((d) => ({ ...d, categories: toggle(d.categories, value) }))}
              >
                <Check />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="ds-section">
          <span className="ds-label" id="ds-filter-status">
            Status
          </span>
          <div className="ds-chips" role="group" aria-labelledby="ds-filter-status">
            {STATUSES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className="ds-chip"
                aria-pressed={draft.statuses.includes(value)}
                onClick={() => setDraft((d) => ({ ...d, statuses: toggle(d.statuses, value) }))}
              >
                <Check />
                <span className={`ds-chip-dot ${value.toLowerCase()}`} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ds-actions">
        <button type="button" className="ds-btn-primary" onClick={() => onApply(draft)}>
          Show results
        </button>
        <button type="button" className="ds-btn-secondary" onClick={onClose}>
          Cancel
        </button>
      </div>
    </DossierSheet>
  )
}
