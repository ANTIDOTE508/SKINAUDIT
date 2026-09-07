/**
 * Single source of truth for the site's top-menu entries, shared by the
 * landing page and the marketing routes (/philosophy, /how-it-works) via
 * <SiteNav />.
 *
 * `kind` tells <SiteNav /> how to render each entry:
 *   - 'route'    → next/link to an in-app route
 *   - 'anchor'   → plain <a> to a home-page section; from another route it
 *                  navigates home first, then scrolls (href starts with `/#`)
 *   - 'external' → plain <a> to an off-site URL, opened in a new tab
 *
 * `section` (route entries only) matches <SiteNav current="…"> so the
 * active page's link gets `.here` / `aria-current="page"`.
 */
export type NavItem = {
  label: string
  href: string
  kind: 'route' | 'anchor' | 'external'
  section?: 'philosophy' | 'how-it-works' | 'about'
  /** Rendered with the `.sign-in` treatment (underlined, brighter). */
  cta?: boolean
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Philosophy', href: '/philosophy', kind: 'route', section: 'philosophy' },
  { label: 'How It Works', href: '/how-it-works', kind: 'route', section: 'how-it-works' },
  { label: 'Features', href: '/#features', kind: 'anchor' },
  { label: 'About', href: '/about', kind: 'route', section: 'about' },
  { label: 'Journal', href: 'https://theskinaudit.substack.com/', kind: 'external' },
  { label: 'Sign In', href: '/signin', kind: 'route', cta: true },
]
