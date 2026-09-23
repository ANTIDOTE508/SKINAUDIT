'use client'

import { useEffect, useRef, useCallback, useSyncExternalStore } from 'react'
import { gsap } from 'gsap'

const noopSubscribe = () => () => {}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Shared behaviour for the Dossier's portaled dialogs (add-product modal,
 * filter and sort sheets): entrance tween, Escape to close, background scroll
 * lock, focus moved in on open and returned to the trigger on close, and a
 * Tab focus trap. Attach `dialogRef`/`scrimRef` and `onTrapKeyDown`, and only
 * portal once `mounted` is true.
 */
export function useDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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

  return { mounted, dialogRef, scrimRef, onTrapKeyDown }
}
