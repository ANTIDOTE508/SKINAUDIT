'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useDialog } from '@/components/dossier/useDialog'
import SkinauditLogo from '@/components/ui/SkinauditLogo'
import { StudioNavLinks } from './StudioSidebar'

type Props = {
  isOpen: boolean
  /** Must be stable (useCallback): it keys the Escape listener. */
  onClose: () => void
}

/**
 * Mobile form of the sidebar: the same menu in a drawer sliding in from the
 * left, opened from the top bar. Following a link closes it.
 */
export function StudioDrawer({ isOpen, onClose }: Props) {
  const { mounted, dialogRef, scrimRef, onTrapKeyDown } = useDialog({
    isOpen,
    onClose,
    entrance: 'slide-left',
  })

  // Widening past the breakpoint hides the mobile tree: close rather than
  // leave an invisible drawer holding the scroll lock.
  useEffect(() => {
    if (!isOpen) return
    const desktop = window.matchMedia('(min-width: 768px)')
    const onChange = () => {
      if (desktop.matches) onClose()
    }
    desktop.addEventListener('change', onChange)
    return () => desktop.removeEventListener('change', onChange)
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="sd-root">
      <div ref={scrimRef} className="sd-scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className="sd-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabIndex={-1}
        onKeyDown={onTrapKeyDown}
      >
        <div className="sd-header">
          <SkinauditLogo />
          <button type="button" className="sd-close" aria-label="Close menu" onClick={onClose}>
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Primary" className="sd-nav">
          <StudioNavLinks onNavigate={onClose} />
        </nav>
      </div>
    </div>,
    document.body
  )
}
