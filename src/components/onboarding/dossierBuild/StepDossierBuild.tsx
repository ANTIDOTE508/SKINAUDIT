'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { DossierEmptyState } from '@/components/dossier/DossierEmptyState'
import { ScreenAddMethod } from './ScreenAddMethod'
import { ScreenSearch } from './ScreenSearch'
import { ScreenScan } from './ScreenScan'
import { ScreenConfirmMatch } from './ScreenConfirmMatch'
import { ScreenCategoryStatus } from './ScreenCategoryStatus'
import { ScreenAdded } from './ScreenAdded'
import { addProductToDossier } from '@/app/actions/dossier'
import type { DossierModalStart } from '@/components/dossier/DossierModalContext'
import type { DossierProductSummary } from './types'
import type { ProductCategory, DossierProductStatus } from '@prisma/client'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  CLEANSING: 'Cleansing',
  PREPARATION: 'Preparation',
  TREATMENT: 'Treatment',
  SUPPORT: 'Support',
  PROTECTION: 'Protection',
}

const STATUS_LABELS: Record<DossierProductStatus, string> = {
  ACTIVE: 'Active',
  SEASONAL: 'Seasonal',
  ARCHIVED: 'Archived',
}

// 1 = Empty Dossier, 2 = Add Method, 3 = Search, 4 = Confirm Match,
// 5 = Category & Status, 6 = Added, 7 = Scan.
type Screen = 1 | 2 | 3 | 4 | 5 | 6 | 7

type Props = {
  startAt: DossierModalStart
  /** Leaves the flow — closes the Dossier modal that hosts it. */
  onClose: () => void
}

/**
 * Add-product flow rendered inside DossierModal (mockups 02-07). Nothing is
 * persisted until a product is added.
 */
export function StepDossierBuild({ startAt, onClose }: Props) {
  const [screen, setScreen] = useState<Screen>(startAt === 'method' ? 2 : 1)
  const [selectedProduct, setSelectedProduct] = useState<DossierProductSummary | null>(null)
  // Kept so "Show me other matches" (screen 4) returns to a populated result
  // list rather than a blank search field.
  const [lastQuery, setLastQuery] = useState('')
  // Where Confirm Match's back arrow returns: the result list or the scanner.
  const [matchOrigin, setMatchOrigin] = useState<3 | 7>(3)
  // Carried from screen 5 to screen 6's recap sentence ("saved as Treatment · Active").
  const [savedCategory, setSavedCategory] = useState<ProductCategory | null>(null)
  const [savedStatus, setSavedStatus] = useState<DossierProductStatus | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)

  const handleSubmitCategoryStatus = async (input: {
    category: ProductCategory
    status: DossierProductStatus
  }) => {
    if (!selectedProduct) return
    setCategoryError(null)
    try {
      const result = await addProductToDossier({ productId: selectedProduct.id, ...input })
      if (!result.ok) {
        setCategoryError('This product is already in your Dossier.')
        return
      }
      setSavedCategory(input.category)
      setSavedStatus(input.status)
      setScreen(6)
    } catch {
      setCategoryError('Something went wrong. Please try again.')
    }
  }

  // Screens 2 (Add Method) and 5 (Category & Status) carry their own close
  // button in the topbar; every other screen needs the modal's floating one.
  const needsFloatingClose = screen !== 2 && screen !== 5

  return (
    <>
      {needsFloatingClose && (
        <div className="dossier-modal-close-rail">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="dossier-modal-close"
          >
            <X size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      )}
      {renderScreen()}
    </>
  )

  function renderScreen() {
    switch (screen) {
      case 1:
        return <DossierEmptyState onAddProduct={() => setScreen(2)} />
      case 2:
        return (
          <ScreenAddMethod
            onChooseSearch={() => setScreen(3)}
            onChooseScan={() => setScreen(7)}
            onClose={onClose}
          />
        )
      case 3:
        return (
          <ScreenSearch
            initialQuery={lastQuery}
            onBack={() => setScreen(2)}
            onQueryChange={setLastQuery}
            onSelectProduct={(product) => {
              setSelectedProduct(product)
              setMatchOrigin(3)
              setScreen(4)
            }}
          />
        )
      case 7:
        return (
          <ScreenScan
            onBack={() => setScreen(2)}
            onFound={(product) => {
              setSelectedProduct(product)
              setMatchOrigin(7)
              setScreen(4)
            }}
            onSearchInstead={() => setScreen(3)}
          />
        )
      case 4:
        return selectedProduct ? (
          <ScreenConfirmMatch
            product={selectedProduct}
            onBack={() => setScreen(matchOrigin)}
            onConfirm={() => setScreen(5)}
            onShowOtherMatches={() => {
              // A scan leaves no search term — seed the list with the brand.
              if (matchOrigin === 7) setLastQuery(selectedProduct.brandName ?? '')
              setScreen(3)
            }}
            onNotMyProduct={() => {
              setSelectedProduct(null)
              setScreen(3)
            }}
          />
        ) : null
      case 5:
        return selectedProduct ? (
          <ScreenCategoryStatus
            product={selectedProduct}
            onSubmit={handleSubmitCategoryStatus}
            categoryError={categoryError}
            onBack={() => setScreen(4)}
            onClose={onClose}
          />
        ) : null
      case 6:
        return (
          <ScreenAdded
            productName={selectedProduct?.name ?? 'Your product'}
            brandName={selectedProduct?.brandName ?? null}
            categoryLabel={savedCategory ? CATEGORY_LABELS[savedCategory] : null}
            statusLabel={savedStatus ? STATUS_LABELS[savedStatus] : null}
            onAddAnother={() => {
              setSelectedProduct(null)
              setLastQuery('')
              setScreen(2)
            }}
            onDone={onClose}
          />
        )
    }
  }
}
