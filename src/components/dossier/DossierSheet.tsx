'use client'

import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useDialog } from './useDialog'
import './dossierSheet.css'

type Props = {
  label: string
  /** Desktop width of the centred dialog (mockups: 540px filter, 480px sort). */
  maxWidth: number
  onClose: () => void
  children: ReactNode
}

/**
 * Chrome for the Dossier's filter and sort sheets (mockups 09 / 09b): a bottom
 * sheet on phones, a centred dialog from 720px up. Mount it only while open —
 * unmounting discards the draft and returns focus to the trigger.
 */
export function DossierSheet({ label, maxWidth, onClose, children }: Props) {
  const { mounted, dialogRef, scrimRef, onTrapKeyDown } = useDialog({ isOpen: true, onClose })

  if (!mounted) return null

  return createPortal(
    <div className="ds-root">
      <div ref={scrimRef} className="ds-scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className="ds-sheet"
        style={{ '--ds-max-width': `${maxWidth}px` } as React.CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onKeyDown={onTrapKeyDown}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}
