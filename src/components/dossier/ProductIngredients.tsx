import type { ProductSource } from '@prisma/client'
import { keyActivesOf, type ParsedIngredient } from '@/lib/inci'
import { DossierTopbar } from './DossierTopbar'
import './productIngredients.css'

interface ProductIngredientsProps {
  dossierProductId: number
  brandName: string | null
  productName: string
  source: ProductSource
  ingredients: ParsedIngredient[]
}

const SOURCE_NOTES: Record<ProductSource, string> = {
  CATALOG_SEED: 'Ingredient data sourced from Open Beauty Facts.',
  USER_MANUAL: 'Ingredient list entered manually.',
  USER_OCR: 'Ingredient list scanned from the packaging.',
}

/** Dossier product ingredients — mockup 11 (templates/buildDossier/screen11.html). */
export function ProductIngredients({
  dossierProductId,
  brandName,
  productName,
  source,
  ingredients,
}: ProductIngredientsProps) {
  const actives = keyActivesOf(ingredients)

  return (
    <div className="pi-page">
      <DossierTopbar
        title="Ingredients"
        backHref={`/dossier/${dossierProductId}`}
        backLabel="Back to product"
        product={{ brandName, productName }}
      />

      <div className="pi-body">
        {ingredients.length === 0 ? (
          <p className="pi-empty">No ingredient list is available for this product yet.</p>
        ) : (
          <>
            {actives.length > 0 && (
              <section aria-labelledby="pi-actives">
                <h2 id="pi-actives" className="pi-section-label">
                  Key Actives
                </h2>
                <ul className="pi-actives-grid">
                  {actives.map((active) => (
                    <li key={active.name} className="pi-active-card">
                      <span className="pi-active-name">{active.name}</span>
                      {/* Concentrations are not published in the INCI text. */}
                      <span className="pi-active-pct">—</span>
                      <span className="pi-active-role">{active.role}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="pi-inci">
              <h2 id="pi-inci" className="pi-section-label">
                Full Ingredient List (INCI)
              </h2>
              <ol className="pi-list">
                {ingredients.map((ingredient) => (
                  <li
                    key={ingredient.position}
                    className={`pi-row${ingredient.active ? ' highlighted' : ''}`}
                  >
                    <span className="pi-num" aria-hidden="true">
                      {ingredient.position}
                    </span>
                    <div className="pi-content">
                      <span className="pi-name">{ingredient.name}</span>
                      {ingredient.common && <span className="pi-common">{ingredient.common}</span>}
                    </div>
                    {ingredient.active && (
                      <span className="pi-badge">{ingredient.active.badge}</span>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}

        <p className="pi-source-note">
          {SOURCE_NOTES[source]}
          {actives.length > 0 &&
            ' Key actives are identified automatically from the INCI list.'}{' '}
          Formulas may change — always check the physical packaging.
        </p>
      </div>
    </div>
  )
}
