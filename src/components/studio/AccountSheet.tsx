'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { Settings, LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { getDisplayName } from '@/lib/user-display'

export type StudioUser = {
  name: string | null
  email: string
}

type Props = {
  user: StudioUser
  /** Controlled by the top bar so the avatar owns `aria-expanded`. */
  isOpen: boolean
  onClose: () => void
  /** Focus returns here on close. */
  returnFocusRef: React.RefObject<HTMLButtonElement | null>
}

const SHEET_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function AccountSheet({ user, isOpen, onClose, returnFocusRef }: Props) {
  const router = useRouter()
  const scrimRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  // Keeps the sheet mounted through the closing animation. Derived during
  // render rather than synced in an effect: when `isOpen` flips true we must
  // already be rendered on that same commit, otherwise the open tween has no
  // node to animate. Closing clears it from the tween's onComplete.
  const [isClosing, setIsClosing] = useState(false)
  // React's "adjusting state when a prop changes" pattern: compare the prop
  // against its previous value during render and correct state immediately,
  // rather than syncing in an effect (which would render an extra frame with
  // the sheet absent and leave the open tween nothing to animate).
  const [prevOpen, setPrevOpen] = useState(isOpen)

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    setIsClosing(!isOpen)
  }

  const isRendered = isOpen || isClosing

  const displayName = getDisplayName(user.name, user.email)

  /* ── Open / close choreography ── */
  useEffect(() => {
    if (!isRendered) return

    const scrim = scrimRef.current
    const sheet = sheetRef.current
    if (!scrim || !sheet) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      if (isOpen) {
        gsap.set(scrim, { autoAlpha: 0 })
        gsap.to(scrim, { autoAlpha: 1, duration: reduced ? 0.01 : 0.28, ease: 'power2.out' })

        if (reduced) {
          gsap.set(sheet, { y: 0, autoAlpha: 1 })
        } else {
          gsap.fromTo(sheet, { yPercent: 100 }, { yPercent: 0, duration: 0.42, ease: 'expo.out' })
        }
      } else {
        gsap.to(scrim, {
          autoAlpha: 0,
          duration: reduced ? 0.01 : 0.22,
          ease: 'power2.in',
        })
        gsap.to(sheet, {
          yPercent: reduced ? 0 : 100,
          autoAlpha: reduced ? 0 : 1,
          duration: reduced ? 0.01 : 0.3,
          ease: 'power2.in',
          onComplete: () => setIsClosing(false),
        })
      }
    })

    return () => ctx.revert()
  }, [isOpen, isRendered])

  /* ── Close if the viewport grows past the mobile breakpoint ──
     The sheet belongs to the mobile tree; on desktop that tree is
     display:none, so an open sheet would otherwise linger with trapped
     focus and a locked body scroll. */
  useEffect(() => {
    if (!isOpen) return
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = () => {
      if (!mq.matches) onClose()
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [isOpen, onClose])

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

  /* ── Focus: into the sheet on open, back to the avatar on close ── */
  useEffect(() => {
    if (!isOpen || !isRendered) return
    const sheet = sheetRef.current
    if (!sheet) return

    // Capture the node now — the ref may be null by the time cleanup runs.
    const avatar = returnFocusRef.current

    const first = sheet.querySelector<HTMLElement>(SHEET_SELECTOR)
    first?.focus()

    return () => {
      // Only pull focus back if the avatar is still on the page. After a
      // sign-out the tree is being torn down and stealing focus would fight
      // the destination route.
      if (avatar?.isConnected) avatar.focus()
    }
  }, [isOpen, isRendered, returnFocusRef])

  /* ── Focus trap ── */
  const onTrapKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const sheet = sheetRef.current
    if (!sheet) return

    const focusables = Array.from(sheet.querySelectorAll<HTMLElement>(SHEET_SELECTOR))
    if (focusables.length === 0) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }, [])

  async function handleSignOut() {
    if (isSigningOut) return
    setIsSigningOut(true)
    try {
      await authClient.signOut()
      router.push('/signin')
    } catch {
      setIsSigningOut(false)
    }
  }

  if (!isRendered) return null

  return (
    <div className="studio-sheet-root">
      {/* Scrim */}
      <div ref={scrimRef} className="studio-sheet-scrim" onClick={onClose} aria-hidden="true" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="studio-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Account"
        onKeyDown={onTrapKeyDown}
      >
        <div className="studio-sheet-handle" aria-hidden="true" />

        <div className="studio-sheet-identity">
          <span className="studio-sheet-name">{displayName}</span>
          <span className="studio-sheet-email">{user.email}</span>
        </div>

        <div className="studio-sheet-divider" />

        <a href="#" className="studio-sheet-row">
          <Settings size={18} strokeWidth={1.5} aria-hidden="true" />
          <span>Settings</span>
        </a>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="studio-sheet-row studio-sheet-row-signout"
        >
          <LogOut size={18} strokeWidth={1.5} aria-hidden="true" />
          <span>{isSigningOut ? 'Signing out…' : 'Log out'}</span>
        </button>
      </div>
    </div>
  )
}
