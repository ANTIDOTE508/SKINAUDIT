'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { StudioSidebar, type StudioNavItem } from './StudioSidebar'
import { StudioHeader } from './StudioHeader'
import { RegimenRow } from './RegimenRow'
import { RegimenOverview } from './RegimenOverview'
import { StudioInsights } from './StudioInsights'
import { StudioMobile } from './StudioMobile'
import { DossierModal } from '@/components/dossier/DossierModal'
import type { StudioUser } from './AccountSheet'

type Props = {
  user: StudioUser
  /** Nav entry to highlight; null highlights nothing. */
  activeNav: StudioNavItem | null
  /** No non-archived product in the Dossier yet. */
  isDossierEmpty: boolean
  /** Open the Dossier modal on arrival (dashboard landing with an empty Dossier). */
  initialDossierOpen?: boolean
}

export function StudioShell({
  user,
  activeNav,
  isDossierEmpty,
  initialDossierOpen = false,
}: Props) {
  const router = useRouter()
  const [isDossierOpen, setIsDossierOpen] = useState(initialDossierOpen)

  // The Dossier entry only opens the modal while the Dossier is empty — the
  // permanent Dossier section does not exist yet.
  const onOpenDossier = isDossierEmpty ? () => setIsDossierOpen(true) : undefined

  const closeDossier = useCallback(() => {
    setIsDossierOpen(false)
    // A product may have been added: re-read the count on the server.
    router.refresh()
  }, [router])

  return (
    <>
      <StudioMobile user={user} activeNav={activeNav} onOpenDossier={onOpenDossier} />

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
          <StudioSidebar activeNav={activeNav} onOpenDossier={onOpenDossier} />

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

      <DossierModal isOpen={isDossierOpen} onClose={closeDossier} />
    </>
  )
}
