'use client'

import { useState, useRef, useCallback, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import SkinauditLogo from '@/components/ui/SkinauditLogo'
import { BottlePlaceholder } from './BottlePlaceholder'
import { HealthGauge } from './HealthGauge'
import { REGIMEN } from './RegimenRow'
import { AccountSheet, type StudioUser } from './AccountSheet'
import { StudioDrawer } from './StudioDrawer'
import { getInitials } from '@/lib/user-display'

const ROUTINES = ['AM Routine', 'PM Routine', 'Weekly Treatment'] as const

/** Mobile drops Compatibility — only these two metrics survive the cut. */
const MOBILE_METRICS = [
  { label: 'Irritation Risk', value: 'Low', score: '8/100', percent: 35 },
  { label: 'Barrier Support', value: 'Good', score: '72/100', percent: 70 },
]

function MobileMetricCard({
  metric,
}: {
  metric: { label: string; value: string; score: string; percent: number }
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        padding: '1rem',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.6875rem',
          fontWeight: 400,
          letterSpacing: '0.06em',
          color: 'var(--color-text-muted)',
        }}
      >
        {metric.label}
      </span>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '0.375rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: '1.75rem',
            lineHeight: 1,
            color: 'var(--color-alabaster-50)',
          }}
        >
          {metric.value}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.6875rem',
            fontWeight: 300,
            color: 'var(--color-text-muted)',
            whiteSpace: 'nowrap',
          }}
        >
          {metric.score}
        </span>
      </div>

      {/* Mobile-only treatment: both bars are sienna, unlike desktop where
          only the Health Index carries the accent. */}
      <div
        role="meter"
        aria-valuenow={metric.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={metric.label}
        style={{
          width: '100%',
          height: '3px',
          borderRadius: '2px',
          backgroundColor: 'var(--color-obsidian-800)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${metric.percent}%`,
            height: '100%',
            borderRadius: '2px',
            backgroundColor: 'var(--color-sienna-500)',
          }}
        />
      </div>
    </div>
  )
}

type Props = {
  user: StudioUser
  /** Page content below the top bar; defaults to the Studio overview. */
  children?: ReactNode
}

export function StudioMobile({ user, children }: Props) {
  const [routine, setRoutine] = useState<string>(ROUTINES[0])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const avatarRef = useRef<HTMLButtonElement>(null)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const initials = getInitials(user.name, user.email)

  return (
    <div className="studio-mobile">
      {/* 1 — Top bar */}
      <header className="studio-m-topbar">
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
          // Same desktop guard as the avatar below.
          onClick={() => {
            if (window.matchMedia('(max-width: 767px)').matches) {
              setMenuOpen(true)
            }
          }}
          className="studio-m-menu"
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        <div className="studio-m-topbar-center">
          <SkinauditLogo />
        </div>
        <button
          ref={avatarRef}
          type="button"
          aria-label="Account menu"
          aria-expanded={sheetOpen}
          aria-haspopup="dialog"
          /* The mobile tree stays in the DOM at desktop widths (display:none),
             so guard against a programmatic/synthetic open there — the sheet
             is position:fixed and would otherwise trap focus invisibly. */
          onClick={() => {
            if (window.matchMedia('(max-width: 767px)').matches) {
              setSheetOpen(true)
            }
          }}
          className="studio-m-avatar"
        >
          {initials}
        </button>
      </header>

      {children ?? (
        <>
          {/* 2 — Routine selector, full-bleed row */}
          <div className="studio-m-routine">
            <label htmlFor="studio-m-routine-select" className="studio-m-routine-label">
              {routine}
            </label>
            <ChevronDown size={18} strokeWidth={1.5} aria-hidden="true" />
            <select
              id="studio-m-routine-select"
              value={routine}
              onChange={(e) => setRoutine(e.target.value)}
              aria-label="Select routine"
              className="studio-m-routine-select"
            >
              {ROUTINES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* 3 — Circular product row */}
          <div className="studio-m-products">
            {REGIMEN.map((item, i) => (
              <div key={item.step} className="studio-m-product">
                <div
                  className={i === 0 ? 'studio-m-circle studio-m-circle-active' : 'studio-m-circle'}
                >
                  {/* Same DOM as desktop, scaled down via CSS transform. */}
                  <div className="studio-m-bottle-scale">
                    <BottlePlaceholder step={item.step} showBadge={false} />
                  </div>
                </div>
                <span className="studio-m-product-num">{item.step}</span>
              </div>
            ))}
          </div>

          {/* 4 — Hero gauge */}
          <div className="studio-m-gauge">
            <HealthGauge value={78} label="Regimen Health Index" badge="Good" />
          </div>

          {/* 5 — Two metric cards */}
          <div className="studio-m-metrics">
            {MOBILE_METRICS.map((m) => (
              <MobileMetricCard key={m.label} metric={m} />
            ))}
          </div>

          {/* 6 — Today's Insight */}
          <section className="studio-m-insight" aria-labelledby="studio-m-insight-heading">
            <h2 id="studio-m-insight-heading" className="studio-m-insight-heading">
              Today&rsquo;s Insight
            </h2>
            <p className="studio-m-insight-body">Your environment is drier than usual.</p>
            <p className="studio-m-insight-body">Consider increasing barrier support.</p>

            <button type="button" className="studio-m-insight-action">
              <span>View full analysis</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          </section>
        </>
      )}

      <StudioDrawer isOpen={menuOpen} onClose={closeMenu} />

      <AccountSheet
        user={user}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        returnFocusRef={avatarRef}
      />
    </div>
  )
}
