import { StudioShell } from '@/components/studio/StudioShell'
import { loadStudioContext } from '@/lib/studio-context'

// Post-login / post-onboarding landing. While the Dossier is empty, the
// Dossier modal opens on arrival.
export default async function DashboardPage() {
  const { user, isDossierEmpty, sidebarCollapsed } = await loadStudioContext()

  return (
    <StudioShell
      user={user}
      sidebarCollapsed={sidebarCollapsed}
      initialDossierOpen={isDossierEmpty}
    />
  )
}
