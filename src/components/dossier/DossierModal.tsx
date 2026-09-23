'use client'

import { createPortal } from 'react-dom'
import { StepDossierBuild } from '@/components/onboarding/dossierBuild/StepDossierBuild'
import '@/components/onboarding/dossierBuild/dossierBuild.css'
import './dossierModal.css'
import type { DossierModalStart } from './DossierModalContext'
import { useDialog } from './useDialog'

type Props = {
  isOpen: boolean
  startAt: DossierModalStart
  /** Called on Escape, scrim click, the close button, and once the user
   *  finishes the add-product flow. */
  onClose: () => void
}

/**
 * Dossier modal: opens on the empty state (mockup 02) and runs the whole
 * add-product flow (mockups 03-07) in place, without leaving the dashboard.
 */
export function DossierModal({ isOpen, startAt, onClose }: Props) {
  const { mounted, dialogRef, scrimRef, onTrapKeyDown } = useDialog({ isOpen, onClose })

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="dossier-modal-root">
      <div ref={scrimRef} className="dossier-modal-scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className="dossier-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Your Dossier"
        tabIndex={-1}
        onKeyDown={onTrapKeyDown}
      >
        {/* Remounts on every open, so the flow always restarts from `startAt`
            rather than resuming a half-finished product. */}
        <StepDossierBuild startAt={startAt} onClose={onClose} />
      </div>
    </div>,
    document.body
  )
}
