'use client'

import { useRouter } from 'next/navigation'
import { StepDossierBuild } from '@/components/onboarding/dossierBuild/StepDossierBuild'
import { OnboardingSignOut } from '@/components/onboarding/OnboardingSignOut'
import './dossierBuild.css'

type Props = {
  initialDossierStep: number
}

/**
 * Chrome for the standalone Dossier build route. The mockups draw a single
 * bordered, rounded app card on the obsidian page; below 900px that frame is
 * reproduced as-is, above it the card splits into a brand rail plus the screen
 * column (see dossierBuild.css).
 */
export function DossierBuildShell({ initialDossierStep }: Props) {
  const router = useRouter()

  const onComplete = async () => {
    router.push('/studio')
  }

  return (
    <div className="db-page">
      <div className="db-page-glow" aria-hidden="true" />

      <header className="db-topbar">
        <span className="db-wordmark db-topbar-wordmark">S K I N A U D I T</span>
        <div className="db-topbar-actions">
          <OnboardingSignOut />
        </div>
      </header>

      <main className="db-shell">
        <div className="db-frame">
          <div className="db-columns">
            {/* Desktop-only rail. It carries the section identity the mockup
                compresses into the card header on mobile. */}
            <aside className="db-rail">
              <span className="db-wordmark">S K I N A U D I T</span>
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 300,
                  fontSize: '2.25rem',
                  lineHeight: 1.15,
                  letterSpacing: '-0.01em',
                  color: 'var(--color-alabaster-50)',
                  margin: '1.5rem 0 0.75rem',
                }}
              >
                Build your Dossier
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 300,
                  fontSize: '0.875rem',
                  lineHeight: 1.7,
                  color: 'var(--color-alabaster-400)',
                  margin: 0,
                }}
              >
                Add the products you already own. You can add everything else later.
              </p>
            </aside>

            <div className="db-screen">
              <div className="db-read">
                <StepDossierBuild initialDossierStep={initialDossierStep} onComplete={onComplete} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
