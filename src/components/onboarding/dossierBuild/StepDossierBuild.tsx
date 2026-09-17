'use client'

import { useState, useTransition } from 'react'
import { ScreenEmptyDossier } from './ScreenEmptyDossier'
import { ScreenAddMethod } from './ScreenAddMethod'
import { ScreenSearch } from './ScreenSearch'
import { ScreenConfirmMatch } from './ScreenConfirmMatch'
import { ScreenCategoryStatus } from './ScreenCategoryStatus'
import { ScreenAdded } from './ScreenAdded'
import { updateDossierStep, finalizeDossierBuild, addProductToDossier } from '@/app/actions/dossier'
import type { searchProducts } from '@/app/actions/dossier'
import type { ProductCategory, DossierProductStatus } from '@prisma/client'

type SearchResult = Awaited<ReturnType<typeof searchProducts>>[number]

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
  const [selectedProduct, setSelectedProduct] = useState<SearchResult | null>(null)
  const [isFinishing, setIsFinishing] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const goTo = (next: Screen) => {
    setScreen(next)
    startTransition(async () => {
      await updateDossierStep(next - 1)
    })
  }

  const handleSubmitCategoryStatus = async (input: { category: ProductCategory; status: DossierProductStatus }) => {
    if (!selectedProduct) return
    setCategoryError(null)
    try {
      await addProductToDossier({ productId: selectedProduct.id, ...input })
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

  switch (screen) {
    case 1:
      return <ScreenEmptyDossier onAddProduct={() => goTo(2)} />
    case 2:
      return <ScreenAddMethod onChooseSearch={() => goTo(3)} />
    case 3:
      return (
        <ScreenSearch
          onBack={() => goTo(2)}
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
          onConfirm={() => goTo(5)}
          onNotMyProduct={() => goTo(3)}
        />
      ) : null
    case 5:
      return selectedProduct ? (
        <ScreenCategoryStatus
          product={selectedProduct}
          onSubmit={handleSubmitCategoryStatus}
          categoryError={categoryError}
        />
      ) : null
    case 6:
      return (
        <ScreenAdded
          productName={selectedProduct?.name ?? 'Your product'}
          isFinishing={isFinishing}
          finishError={finishError}
          onAddAnother={() => {
            setSelectedProduct(null)
            goTo(2)
          }}
          onContinueToStudio={handleContinueToStudio}
        />
      )
  }
}
