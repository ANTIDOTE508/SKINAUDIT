'use client'

import { StudioSidebar } from './StudioSidebar'
import { StudioHeader } from './StudioHeader'
import { RegimenRow } from './RegimenRow'
import { RegimenOverview } from './RegimenOverview'
import { StudioInsights } from './StudioInsights'
import { StudioMobile } from './StudioMobile'
import type { StudioUser } from './AccountSheet'

export function StudioShell({ user }: { user: StudioUser }) {
  return (
    <>
      <StudioMobile user={user} />

      <div
        className="studio-desktop"
        style={{
          // Fixed viewport height with internal scrolling: the shell is the
          // window, never the document — this is what keeps the rounded outer
          // container reading as an application surface.
          height: '100vh',
          padding: '0.75rem',
          backgroundColor: 'var(--color-obsidian-950)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            height: '100%',
            backgroundColor: 'var(--color-obsidian-900)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
          }}
        >
          <StudioSidebar />

          <main
            style={{
              flex: 1,
              minWidth: 0,
              overflowY: 'auto',
              padding: 'clamp(1.5rem, 3vw, 2.5rem)',
            }}
          >
            <StudioHeader />
            <RegimenRow />
            <RegimenOverview />
            <StudioInsights />
          </main>
        </div>
      </div>
    </>
  )
}
