'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Philosophy', href: '#philosophy' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
] as const

export default function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    const body = document.body
    const previousOverflow = body.style.overflow
    body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className={`site-header${scrolled ? ' site-header--scrolled' : ''}`}>
      <Link className="nav-brand" href="/">
        Skinaudit
      </Link>

      <nav className="nav-links" aria-label="Primary">
        {NAV_ITEMS.map(({ label, href }) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
        <Link className="sign-in" href="/signin">
          Sign In
        </Link>
      </nav>

      {/*
        Both the toggle and the panel are portaled to body together.
        .hero has overflow: clip (for the background zoom), which
        clips fixed-position descendants in Chromium/WebKit even though
        `fixed` is normally supposed to escape ancestor bounds — so a fixed
        button left inside .site-header/.hero physically disappears
        or becomes unclickable once scrolled/composited. Rendering both
        elements as siblings of <body> sidesteps that clipping entirely.
      */}
      {mounted &&
        createPortal(
          <>
            <button
              type="button"
              className="menu-toggle"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
            </button>

            <div
              id="mobile-nav"
              className={`mobile-nav-panel${menuOpen ? ' mobile-nav-panel--open' : ''}`}
              aria-hidden={!menuOpen}
            >
              <nav className="mobile-nav-links" aria-label="Primary">
                {NAV_ITEMS.map(({ label, href }) => (
                  <a key={href} href={href} onClick={closeMenu}>
                    {label}
                  </a>
                ))}
                <Link href="/signin" onClick={closeMenu}>
                  Sign In
                </Link>
              </nav>
            </div>
          </>,
          document.body
        )}
    </header>
  )
}
