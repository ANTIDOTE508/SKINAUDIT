import Link from 'next/link'

const FOOTER_LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Contact', href: '/contact' },
] as const

const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#', glyph: '◎' },
  { label: 'Email', href: '#', glyph: '□' },
] as const

export default function LandingFooter() {
  return (
    <footer className="site-footer">
      <div className="copyright">© 2026 SKINAUDIT</div>

      <nav className="footer-links">
        {FOOTER_LINKS.map(({ label, href }) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="social-links">
        {SOCIAL_LINKS.map(({ label, href, glyph }) => (
          <a key={label} href={href} aria-label={label}>
            {glyph}
          </a>
        ))}
      </div>
    </footer>
  )
}
