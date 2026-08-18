'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { X } from 'lucide-react'

export type InfoSheetItem = {
  value: string
  label: string
  description: string
  icon: React.ReactNode
}

type Props = {
  title: string
  items: InfoSheetItem[]
  isOpen: boolean
  onClose: () => void
  /** Highlights the row matching this value, if any (e.g. the option the
   *  user currently has selected) — a quiet way to orient them inside a
   *  list of 4+ definitions. */
  activeValue?: string
}

/**
 * Definitions panel shared by any step that offers a "tap the (i) icon to
 * see definitions" affordance. Below 640px it behaves as a bottom sheet
 * (slides up, anchored to the viewport bottom, matching the native-feeling
 * reference screenshot); at 640px and up it becomes a centered modal —
 * a bottom sheet reads as an accidental mobile leftover on a wide screen.
 */
export function InfoSheet({ title, items, isOpen, onClose, activeValue }: Props) {
  const [mounted, setMounted] = useState(false)
  const [rendered, setRendered] = useState(isOpen)
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Keep the panel mounted through its exit animation, then unmount.
  useEffect(() => {
    if (isOpen) {
      setRendered(true)
      return
    }
    const overlay = overlayRef.current
    const panel = panelRef.current
    if (!overlay || !panel) {
      setRendered(false)
      return
    }
    const ctx = gsap.context(() => {
      gsap.to(overlay, { opacity: 0, duration: 0.2, ease: 'power1.out' })
      gsap.to(panel, {
        opacity: 0,
        y: window.innerWidth < 640 ? 24 : 0,
        scale: window.innerWidth < 640 ? 1 : 0.97,
        duration: 0.22,
        ease: 'power2.in',
        onComplete: () => setRendered(false),
      })
    })
    return () => ctx.revert()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !rendered) return
    const overlay = overlayRef.current
    const panel = panelRef.current
    if (!overlay || !panel) return
    const isMobile = window.innerWidth < 640
    const ctx = gsap.context(() => {
      gsap.set(overlay, { opacity: 0 })
      gsap.set(panel, { opacity: 0, y: isMobile ? 24 : 0, scale: isMobile ? 1 : 0.97 })
      gsap.to(overlay, { opacity: 1, duration: 0.25, ease: 'power2.out' })
      gsap.to(panel, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.out', delay: 0.05 })
    })
    closeButtonRef.current?.focus()
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rendered])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
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

  if (!mounted || !rendered) return null

  return createPortal(
    <div
      ref={overlayRef}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: 'rgba(6,5,5,0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-sheet-title"
        onClick={(e) => e.stopPropagation()}
        className="info-sheet-panel"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.5rem 1.5rem 1.25rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <h3
            id="info-sheet-title"
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 300,
              fontSize: '1.375rem',
              color: 'var(--color-alabaster-50)',
              margin: 0,
            }}
          >
            {title}
          </h3>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-alabaster-400)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem 1.75rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {items.map((item) => {
              const isActive = item.value === activeValue
              return (
                <div
                  key={item.value}
                  style={{
                    display: 'flex',
                    gap: '0.875rem',
                    padding: '0.9375rem 1rem',
                    borderRadius: 'var(--radius-card)',
                    border: isActive ? '1.5px solid var(--color-sienna-400)' : '1px solid var(--color-border)',
                    backgroundColor: isActive ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '1px solid rgba(184,134,61,0.28)',
                      color: 'var(--color-sienna-400)',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 500,
                        fontSize: '0.9375rem',
                        color: 'var(--color-alabaster-50)',
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 300,
                        fontSize: '0.8125rem',
                        lineHeight: 1.5,
                        color: 'var(--color-alabaster-400)',
                      }}
                    >
                      {item.description}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style>{`
        .info-sheet-panel {
          position: relative;
          width: 100%;
          max-width: 30rem;
          max-height: 85vh;
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-bottom: none;
          border-radius: 20px 20px 0 0;
          box-shadow: 0 -12px 48px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        @media (min-width: 640px) {
          .info-sheet-panel {
            border-bottom: 1px solid var(--color-border);
            border-radius: var(--radius-card);
            margin-bottom: auto;
            margin-top: auto;
            box-shadow: 0 24px 64px rgba(0,0,0,0.5);
          }
        }
      `}</style>
    </div>,
    document.body
  )
}
