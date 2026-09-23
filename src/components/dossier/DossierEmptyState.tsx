'use client'

import './dossierModal.css'

type Props = {
  onAddProduct: () => void
}

/**
 * Empty-Dossier state — a 1:1 port of `<main class="content">` from
 * templates/buildDossier/screen02.html — the first screen of the Dossier
 * modal's add-product flow.
 */
export function DossierEmptyState({ onAddProduct }: Props) {
  return (
    <div className="dossier-empty">
      {/* Two skincare bottle silhouettes — dropper and pump */}
      <svg
        className="dossier-empty-icon"
        viewBox="0 0 72 72"
        fill="none"
        aria-hidden="true"
        stroke="var(--color-alabaster-300)"
        strokeWidth={1.4}
      >
        <rect x="14" y="28" width="14" height="32" rx="2" />
        <rect x="17" y="22" width="8" height="7" rx="1" />
        <line x1="21" y1="16" x2="21" y2="22" strokeLinecap="round" />
        <circle cx="21" cy="14.5" r="2" />
        <rect x="34" y="30" width="18" height="30" rx="2" />
        <rect x="38" y="24" width="10" height="7" rx="1" />
        <line x1="43" y1="18" x2="43" y2="24" strokeLinecap="round" />
        <path d="M39 18 Q43 14 47 18" strokeLinecap="round" />
        <line x1="37" y1="38" x2="49" y2="38" strokeWidth={1} opacity={0.45} />
        <line x1="37" y1="42" x2="45" y2="42" strokeWidth={1} opacity={0.45} />
      </svg>

      <h2 className="dossier-empty-title">Your Dossier is empty</h2>
      <p className="dossier-empty-body">
        Add your skincare products to get started. Products in your Dossier can be used in your
        rituals, but are not evaluated until they&apos;re assigned.
      </p>

      <button type="button" className="dossier-empty-cta" onClick={onAddProduct}>
        <span aria-hidden="true">+</span> Add Product
      </button>
    </div>
  )
}
