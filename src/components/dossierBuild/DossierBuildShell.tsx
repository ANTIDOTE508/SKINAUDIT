'use client'

import { useRouter } from 'next/navigation'
import { StepDossierBuild } from '@/components/onboarding/dossierBuild/StepDossierBuild'
import { OnboardingSignOut } from '@/components/onboarding/OnboardingSignOut'

type Props = {
  initialDossierStep: number
}

/**
 * Chrome for the standalone Dossier build route — mirrors OnboardingWizard's
 * outer shell (background, header) minus the step-progress counter, since
 * this is no longer a wizard step.
 */
export function DossierBuildShell({ initialDossierStep }: Props) {
  const router = useRouter()

  const onComplete = async () => {
    router.push('/studio')
  }

  return (
    <div
      style={{
        height: '100dvh',
        backgroundColor: 'var(--color-obsidian-950)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `
            radial-gradient(circle at 10% 90%, rgba(184,134,61,0.05) 0%, transparent 50%),
            radial-gradient(circle at 90% 10%, rgba(184,134,61,0.04) 0%, transparent 45%)
          `,
        }}
      />

      <header
        style={{
          position: 'relative', zIndex: 10,
          padding: 'clamp(1.25rem, 3vw, 2rem) clamp(1.5rem, 5vw, 4rem)',
          display: 'flex', alignItems: 'center', gap: '2rem',
          borderBottom: '1px solid rgba(184,134,61,0.1)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '11px', fontWeight: 300, letterSpacing: '0.24em',
            color: 'var(--color-alabaster-400)', textTransform: 'uppercase', flexShrink: 0,
          }}
        >
          S K I N A U D I T
        </span>

        <OnboardingSignOut />
      </header>

      <main
        style={{
          position: 'relative', zIndex: 10, flex: 1,
          display: 'flex', alignItems: 'safe center', justifyContent: 'center',
          padding: 'clamp(1rem, 3vh, 2.5rem) clamp(1.5rem, 5vw, 4rem)',
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: '680px' }}>
          <StepDossierBuild initialDossierStep={initialDossierStep} onComplete={onComplete} />
        </div>
      </main>
    </div>
  )
}
