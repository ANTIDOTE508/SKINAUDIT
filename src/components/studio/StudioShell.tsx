'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { StudioSidebar } from './StudioSidebar'
import { StudioHeader } from './StudioHeader'
import { RegimenRow } from './RegimenRow'
import { RegimenOverview } from './RegimenOverview'
import { StudioInsights } from './StudioInsights'
import { StudioMobile } from './StudioMobile'
import { DossierModal } from '@/components/dossier/DossierModal'
import {
  DossierModalContext,
  type DossierModalStart,
} from '@/components/dossier/DossierModalContext'
import type { StudioUser } from './AccountSheet'

type Props = {
  user: StudioUser
  /** Open the Dossier modal on arrival (dashboard landing with an empty Dossier). */
  initialDossierOpen?: boolean
  /** Page content for the central frame; defaults to the Studio overview. */
  children?: ReactNode
}

export function StudioShell({ user, initialDossierOpen = false, children }: Props) {
  const router = useRouter()
  const [dossierStart, setDossierStart] = useState<DossierModalStart | null>(
    initialDossierOpen ? 'empty' : null
  )

  const openDossier = useCallback((startAt: DossierModalStart) => setDossierStart(startAt), [])

  const closeDossier = useCallback(() => {
    setDossierStart(null)
    // A product may have been added: re-read the Dossier on the server.
    router.refresh()
  }, [router])

  return (
    <DossierModalContext.Provider value={openDossier}>
      <StudioMobile user={user}>{children}</StudioMobile>

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
              // Custom pages own their full-bleed layout (rows, borders).
              padding: children ? 0 : 'clamp(1.5rem, 3vw, 2.5rem)',
            }}
          >
            {children ?? (
              <>
                <StudioHeader />
                <RegimenRow />
                <RegimenOverview />
                <StudioInsights />
              </>
            )}
          </main>
        </div>
      </div>

      <DossierModal
        isOpen={dossierStart !== null}
        startAt={dossierStart ?? 'empty'}
        onClose={closeDossier}
      />
    </DossierModalContext.Provider>
  )
}
