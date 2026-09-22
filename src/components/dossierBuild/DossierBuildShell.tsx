'use client'

import { useRouter } from 'next/navigation'
import { StepDossierBuild } from '@/components/onboarding/dossierBuild/StepDossierBuild'
import './dossierBuild.css'

type Props = {
  initialDossierStep: number
}

/**
 * Chrome for the standalone Dossier build route. Every mockup
 * (templates/buildDossier/screen02-screen12.html) renders full-bleed on
 * `var(--bg)` inside a single centred column — no side rail, no bordered
 * card. Each screen owns its own topbar via ScreenHeader.
 */
export function DossierBuildShell({ initialDossierStep }: Props) {
  const router = useRouter()

  const onComplete = async () => {
    router.push('/studio')
  }

  return (
    <div className="db-app">
      <StepDossierBuild initialDossierStep={initialDossierStep} onComplete={onComplete} />
    </div>
  )
}
