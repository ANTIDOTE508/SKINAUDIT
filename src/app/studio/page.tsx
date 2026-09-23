import { StudioShell } from '@/components/studio/StudioShell'
import { loadStudioContext } from '@/lib/studio-context'

export default async function StudioPage() {
  const { user } = await loadStudioContext()

  return <StudioShell user={user} />
}
