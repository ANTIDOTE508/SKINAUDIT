'use client'

import { useEffect, useRef, useCallback, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { StepDossierBuild } from '@/components/onboarding/dossierBuild/StepDossierBuild'
import '@/components/onboarding/dossierBuild/dossierBuild.css'
import './dossierModal.css'

type Props = {
  isOpen: boolean
  /** Called on Escape, scrim click, the close button, and once the user
   *  finishes the add-product flow. */
  onClose: () => void
}

const noopSubscribe = () => () => {}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Dossier modal: opens on the empty state (mockup 02) and runs the whole
 * add-product flow (mockups 03-07) in place, without leaving the dashboard.
 */
export function DossierModal({ isOpen, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  // createPortal needs a real <body>: false during SSR, true on the client.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )

  /* ── Entrance ── */
  useEffect(() => {
    if (!isOpen || !mounted) return
    const dialog = dialogRef.current
    const scrim = scrimRef.current
    if (!dialog || !scrim) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      gsap.fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced ? 0.01 : 0.28 })
      if (!reduced) {
        // opacity, not autoAlpha: visibility:hidden would block the focus
        // effect below from moving focus into the dialog.
        gsap.fromTo(
          dialog,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.42, ease: 'expo.out' }
        )
      }
    })
    return () => ctx.revert()
  }, [isOpen, mounted])

  /* ── Escape to close ── */
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  /* ── Background scroll lock (restored on close AND unmount) ── */
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  /* ── Focus: into the dialog on open, back to the trigger on close ── */
  useEffect(() => {
    if (!isOpen || !mounted) return
    const dialog = dialogRef.current
    if (!dialog) return

    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.focus()

    return () => {
      if (trigger?.isConnected) trigger.focus()
    }
  }, [isOpen, mounted])

  /* ── Focus trap ── */
  const onTrapKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const dialog = dialogRef.current
    if (!dialog) return

    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (focusables.length === 0) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }, [])

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
        {/* Remounts on every open, so the flow always restarts on the empty
            state rather than resuming a half-finished product. */}
        <StepDossierBuild onClose={onClose} />
      </div>
    </div>,
    document.body
  )
}
