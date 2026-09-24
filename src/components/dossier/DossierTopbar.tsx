import Link from 'next/link'
import './dossierTopbar.css'

interface DossierTopbarProps {
  title: string
  backHref: string
  backLabel: string
  /** Product context bar under the top bar (mockups 11 / 12). */
  product?: { brandName: string | null; productName: string }
}

/** Top bar shared by the Dossier product screens (mockups 10–12). */
export function DossierTopbar({ title, backHref, backLabel, product }: DossierTopbarProps) {
  return (
    <>
      <header className="dt-topbar">
        <Link href={backHref} className="dt-back" aria-label={backLabel}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="12,4 6,10 12,16" />
          </svg>
        </Link>
        <h1 className="dt-title">{title}</h1>
      </header>

      {product && (
        <div className="dt-context">
          {product.brandName && (
            <>
              <span className="dt-context-brand">{product.brandName}</span>
              <span className="dt-context-sep" aria-hidden="true">
                ·
              </span>
            </>
          )}
          <span className="dt-context-name">{product.productName}</span>
        </div>
      )}
    </>
  )
}
