'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ScreenEmptyDossier } from './ScreenEmptyDossier'
import { ScreenAddMethod } from './ScreenAddMethod'
import { ScreenSearch } from './ScreenSearch'
import { ScreenConfirmMatch } from './ScreenConfirmMatch'
import { ScreenCategoryStatus } from './ScreenCategoryStatus'
import { ScreenAdded } from './ScreenAdded'
import { updateDossierStep, finalizeDossierBuild, addProductToDossier } from '@/app/actions/dossier'
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

// Internal screen numbers, matching dossierStep persistence (see spec §1):
// 1 = Empty Dossier, 2 = Add Method, 3 = Search, 4 = Confirm Match,
// 5 = Category & Status, 6 = Added.
type Screen = 1 | 2 | 3 | 4 | 5 | 6

type Props = {
  initialDossierStep: number
  onComplete: () => Promise<void>
}

export function StepDossierBuild({ initialDossierStep, onComplete }: Props) {
  // Screens 4 (Confirm Match) and 5 (Category & Status) both require a
  // `selectedProduct`, which is client-only state never restored from the
  // server. Resuming directly onto either would render a blank screen (their
  // branches return null with no product), so fall back to screen 2 (Add
  // Method) instead — the user just re-picks a product.
  const seededScreen = Math.min(Math.max(initialDossierStep, 0), 5) + 1
  const [screen, setScreen] = useState<Screen>(
    (seededScreen === 4 || seededScreen === 5 ? 2 : seededScreen) as Screen
  )
  const [selectedProduct, setSelectedProduct] = useState<DossierProductSummary | null>(null)
  // Kept so "Show me other matches" (screen 4) returns to a populated result
  // list rather than a blank search field.
  const [lastQuery, setLastQuery] = useState('')
  // Carried from screen 5 to screen 6's recap sentence ("saved as Treatment · Active").
  const [savedCategory, setSavedCategory] = useState<ProductCategory | null>(null)
  const [savedStatus, setSavedStatus] = useState<DossierProductStatus | null>(null)
  const [isFinishing, setIsFinishing] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const goTo = (next: Screen) => {
    setScreen(next)
    startTransition(async () => {
      await updateDossierStep(next - 1)
    })
  }

  const handleSubmitCategoryStatus = async (input: {
    category: ProductCategory
    status: DossierProductStatus
  }) => {
    if (!selectedProduct) return
    setCategoryError(null)
    try {
      await addProductToDossier({ productId: selectedProduct.id, ...input })
      setSavedCategory(input.category)
      setSavedStatus(input.status)
      goTo(6)
    } catch {
      setCategoryError('Something went wrong. Please try again.')
    }
  }

  const handleContinueToStudio = async () => {
    setIsFinishing(true)
    setFinishError(null)
    try {
      await finalizeDossierBuild()
      await onComplete()
    } catch {
      setFinishError('Something went wrong. Please try again.')
      setIsFinishing(false)
    }
  }

  /** Abandon the build and return to Studio. Visibility is never severed: the
   *  Dossier gate lives in Studio and resumes this flow at `dossierStep`. */
  const handleExit = () => {
    router.push('/studio')
  }

  switch (screen) {
    case 1:
      return <ScreenEmptyDossier onAddProduct={() => goTo(2)} />
    case 2:
      return <ScreenAddMethod onChooseSearch={() => goTo(3)} onClose={handleExit} />
    case 3:
      return (
        <ScreenSearch
          initialQuery={lastQuery}
          onBack={() => goTo(2)}
          onQueryChange={setLastQuery}
          onSelectProduct={(product) => {
            setSelectedProduct(product)
            goTo(4)
          }}
        />
      )
    case 4:
      return selectedProduct ? (
        <ScreenConfirmMatch
          product={selectedProduct}
          onBack={() => goTo(3)}
          onConfirm={() => goTo(5)}
          onShowOtherMatches={() => goTo(3)}
          onNotMyProduct={() => {
            setSelectedProduct(null)
            goTo(3)
          }}
        />
      ) : null
    case 5:
      return selectedProduct ? (
        <ScreenCategoryStatus
          product={selectedProduct}
          onSubmit={handleSubmitCategoryStatus}
          categoryError={categoryError}
          onBack={() => goTo(4)}
          onClose={handleExit}
        />
      ) : null
    case 6:
      return (
        <ScreenAdded
          productName={selectedProduct?.name ?? 'Your product'}
          brandName={selectedProduct?.brandName ?? null}
          categoryLabel={savedCategory ? CATEGORY_LABELS[savedCategory] : null}
          statusLabel={savedStatus ? STATUS_LABELS[savedStatus] : null}
          isFinishing={isFinishing}
          finishError={finishError}
          onAddAnother={() => {
            setSelectedProduct(null)
            setLastQuery('')
            goTo(2)
          }}
          onContinueToStudio={handleContinueToStudio}
          onNavigateStudio={handleExit}
        />
      )
  }
}
