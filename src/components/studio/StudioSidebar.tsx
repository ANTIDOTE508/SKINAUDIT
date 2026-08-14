'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import {
  LayoutGrid,
  FileText,
  GitCompareArrows,
  CalendarCheck,
  TrendingUp,
  User,
  Settings,
  LogOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import SkinauditLogo from '@/components/ui/SkinauditLogo'

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

const PRIMARY_NAV: NavItem[] = [
  { label: 'Studio', href: '/studio', icon: LayoutGrid },
  { label: 'Dossier', href: '#', icon: FileText },
  { label: 'Compatibility', href: '#', icon: GitCompareArrows },
  { label: 'Check-ins', href: '#', icon: CalendarCheck },
  { label: 'Progress', href: '#', icon: TrendingUp },
  { label: 'Profile', href: '#', icon: User },
]

const SECONDARY_NAV: NavItem[] = [{ label: 'Settings', href: '#', icon: Settings }]

/**
 * A single nav row. Kept local to the sidebar because its active treatment
 * (left accent bar + raised pill) is specific to this shell.
 */
function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const [isHovered, setIsHovered] = useState(false)
  const Icon = item.icon

  const color = isActive
    ? 'var(--color-sienna-300)'
    : isHovered
      ? 'var(--color-alabaster-200)'
      : 'var(--color-alabaster-400)'

  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.625rem 0.875rem',
        borderRadius: 'var(--radius-button)',
        backgroundColor: isActive
          ? 'var(--color-obsidian-800)'
          : isHovered
            ? 'rgba(255,255,255,0.02)'
            : 'transparent',
        color,
        textDecoration: 'none',
        fontFamily: 'var(--font-body)',
        fontSize: '0.8125rem',
        fontWeight: isActive ? 400 : 300,
        letterSpacing: '0.02em',
        transition:
          'background-color var(--duration-micro) var(--ease-luxury), color var(--duration-micro) var(--ease-luxury)',
      }}
    >
      {/* Thin left accent bar — active only */}
      {isActive && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '2px',
            height: '18px',
            borderRadius: '0 2px 2px 0',
            backgroundColor: 'var(--color-sienna-500)',
          }}
        />
      )}
      <Icon size={16} strokeWidth={1.5} color={color} aria-hidden="true" />
      {item.label}
    </Link>
  )
}

export function StudioSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [logoutHovered, setLogoutHovered] = useState(false)

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

  return (
    <nav
      aria-label="Primary"
      style={{
        width: '230px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-obsidian-950)',
        borderRight: '1px solid var(--color-border)',
        padding: '1.75rem 1rem',
        overflowY: 'auto',
      }}
    >
      {/* Wordmark */}
      <div style={{ padding: '0 0.875rem', marginBottom: '2.5rem' }}>
        <SkinauditLogo />
      </div>

      {/* Primary nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
        {PRIMARY_NAV.map((item) => (
          <NavLink
            key={item.label}
            item={item}
            isActive={item.href !== '#' && pathname.startsWith(item.href)}
          />
        ))}
      </div>

      {/* Bottom cluster */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.125rem',
        }}
      >
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.label} item={item} isActive={false} />
        ))}

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          onMouseEnter={() => setLogoutHovered(true)}
          onMouseLeave={() => setLogoutHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-button)',
            background: logoutHovered ? 'rgba(255,255,255,0.02)' : 'transparent',
            border: 'none',
            textAlign: 'left',
            cursor: isSigningOut ? 'default' : 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            fontWeight: 300,
            letterSpacing: '0.02em',
            color: logoutHovered ? 'var(--color-alabaster-200)' : 'var(--color-alabaster-400)',
            transition:
              'background-color var(--duration-micro) var(--ease-luxury), color var(--duration-micro) var(--ease-luxury)',
          }}
        >
          <LogOut size={16} strokeWidth={1.5} aria-hidden="true" />
          {isSigningOut ? 'Signing out…' : 'Log out'}
        </button>
      </div>
    </nav>
  )
}
