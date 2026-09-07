'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { NAV_ITEMS, type NavItem } from './nav-items'
import './site-nav.css'

/**
 * The site's top navigation, shared by the landing page and the marketing
 * routes (/philosophy, /how-it-works). Entries come from `nav-items.ts`.
 *
 * Markup and class names match the landing nav the design was authored
 * against: a `.site-header` that turns opaque once scrolled, `.nav-links`
 * on desktop, and a `.menu-toggle` + `.mobile-nav-panel` burger that are
 * portaled to <body>. The portal is deliberate — `.hero` (and, on the
 * marketing routes, `.section`) use `overflow: clip/hidden`, which clips
 * `position: fixed` descendants in Chromium/WebKit; rendering the toggle
 * and panel as siblings of <body> sidesteps that entirely.
 *
 * Pass `current` on a marketing route so its own entry gets `.here` /
 * `aria-current="page"`.
 */
export function SiteNav({ current }: { current?: NavItem['section'] }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Portals must not run during SSR (there is no `document.body`); flip to
  // client-mounted after hydration. This is the intended one-shot pattern.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const renderItem = (item: NavItem, onNavigate?: () => void) => {
    const isHere = item.kind === 'route' && item.section != null && item.section === current
    const className = [item.cta ? 'sign-in' : null, isHere ? 'here' : null]
      .filter(Boolean)
      .join(' ')

    if (item.kind === 'route') {
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={className || undefined}
          aria-current={isHere ? 'page' : undefined}
        >
          {item.label}
        </Link>
      )
    }

    // 'anchor' and 'external' — plain <a>. External opens in a new tab.
    const external = item.kind === 'external'
    return (
      <a
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={className || undefined}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
      >
        {item.label}
      </a>
    )
  }

  return (
    <header className={`site-header${scrolled ? ' site-header--scrolled' : ''}`}>
      <Link className="nav-brand" href="/">
        Skinaudit
      </Link>

      <nav className="nav-links" aria-label="Primary">
        {NAV_ITEMS.map((item) => renderItem(item))}
      </nav>

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
                {NAV_ITEMS.map((item) => renderItem(item, closeMenu))}
              </nav>
            </div>
          </>,
          document.body
        )}
    </header>
  )
}
