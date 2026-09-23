'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutGrid,
  FileText,
  GitCompareArrows,
  CalendarCheck,
  TrendingUp,
  User,
  Settings,
  LogOut,
  RotateCcw,
  ChevronLeft,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { resetOnboarding } from '@/app/actions/onboarding'
import { saveSidebarCollapsed } from '@/lib/studio-sidebar'
import SkinauditLogo from '@/components/ui/SkinauditLogo'
import './studioNav.css'

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

const PRIMARY_NAV: NavItem[] = [
  { label: 'Studio', href: '/studio', icon: LayoutGrid },
  { label: 'Dossier', href: '/dossier', icon: FileText },
  { label: 'Compatibility', href: '#', icon: GitCompareArrows },
  { label: 'Check-ins', href: '#', icon: CalendarCheck },
  { label: 'Progress', href: '#', icon: TrendingUp },
  { label: 'Profile', href: '#', icon: User },
]

const SECONDARY_NAV: NavItem[] = [{ label: 'Settings', href: '#', icon: Settings }]

/** Active when the URL is the item's route or one of its sub-routes.
 *  Placeholder items (`#`) never match, so /dashboard highlights nothing. */
export function isNavActive(href: string, pathname: string) {
  return href !== '#' && (pathname === href || pathname.startsWith(`${href}/`))
}

/** One nav row: icon + label. `data-tip` feeds the collapsed-rail tooltip. */
function NavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem
  isActive: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      data-tip={item.label}
      className="sn-row"
      onClick={onNavigate}
    >
      {/* Thin left accent bar — active only */}
      {isActive && <span className="sn-accent" aria-hidden="true" />}
      <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
      <span className="sn-label">{item.label}</span>
    </Link>
  )
}

/**
 * The menu's rows — primary nav, then settings and account actions pinned to
 * the bottom. Shared by the desktop sidebar and the mobile drawer.
 */
export function StudioNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)

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

  async function handleRetake() {
    if (isRestarting) return
    setIsRestarting(true)
    try {
      await resetOnboarding()
      router.push('/onboarding')
    } catch {
      setIsRestarting(false)
    }
  }

  return (
    <>
      <div className="sn-group">
        {PRIMARY_NAV.map((item) => (
          <NavLink
            key={item.label}
            item={item}
            isActive={isNavActive(item.href, pathname)}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <div className="sn-group sn-group-bottom">
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.label} item={item} isActive={false} onNavigate={onNavigate} />
        ))}

        <button
          type="button"
          onClick={handleRetake}
          disabled={isRestarting}
          data-tip="Retake audit"
          className="sn-row"
        >
          <RotateCcw size={16} strokeWidth={1.5} aria-hidden="true" />
          <span className="sn-label">{isRestarting ? 'Opening…' : 'Retake audit'}</span>
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          data-tip="Log out"
          className="sn-row"
        >
          <LogOut size={16} strokeWidth={1.5} aria-hidden="true" />
          <span className="sn-label">{isSigningOut ? 'Signing out…' : 'Log out'}</span>
        </button>
      </div>
    </>
  )
}

type Tip = { label: string; top: number; left: number }

/**
 * Desktop sidebar. Collapses to an icon rail: icons stay anchored while the
 * width eases in and labels fade, so nothing jumps. The state is saved in a
 * cookie so the next page renders at the right width on the server.
 */
export function StudioSidebar({ initialCollapsed = false }: { initialCollapsed?: boolean }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [tip, setTip] = useState<Tip | null>(null)

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    setTip(null)
    saveSidebarCollapsed(next)
  }

  // The rail's labels are hidden, so hovered/focused rows name themselves in
  // a tooltip. It is position:fixed to escape the nav's scroll clipping.
  function showTip(e: React.SyntheticEvent) {
    if (!collapsed) return
    const row = (e.target as Element).closest<HTMLElement>('[data-tip]')
    if (!row) {
      setTip(null)
      return
    }
    const rect = row.getBoundingClientRect()
    setTip({
      label: row.dataset.tip ?? '',
      top: rect.top + rect.height / 2,
      left: rect.right + 14,
    })
  }

  const hideTip = () => setTip(null)

  return (
    <div className={collapsed ? 'sn-sidebar is-collapsed' : 'sn-sidebar'}>
      <nav
        id="studio-sidebar-nav"
        aria-label="Primary"
        className="sn-nav"
        onMouseOver={showTip}
        onFocus={showTip}
        onMouseLeave={hideTip}
        onBlur={hideTip}
        onScroll={hideTip}
      >
        <div className="sn-brand">
          <span className="sn-wordmark">
            <SkinauditLogo />
          </span>
          <span className="sn-seal" aria-hidden="true">
            S
          </span>
        </div>

        <StudioNavLinks />
      </nav>

      <button
        type="button"
        className="sn-toggle"
        aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
        aria-expanded={!collapsed}
        aria-controls="studio-sidebar-nav"
        onClick={toggle}
      >
        <ChevronLeft size={14} strokeWidth={1.5} aria-hidden="true" />
      </button>

      {tip && (
        <span className="sn-tip" style={{ top: tip.top, left: tip.left }} aria-hidden="true">
          {tip.label}
        </span>
      )}
    </div>
  )
}
