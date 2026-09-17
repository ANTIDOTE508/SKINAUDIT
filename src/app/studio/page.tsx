import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StudioShell } from '@/components/studio/StudioShell'
import { DossierGate } from '@/components/studio/DossierGate'

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ skipGate?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user?.id) {
    redirect('/signin')
  }

  const user = {
    name: session.user.name ?? null,
    email: session.user.email,
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      onboardingCompletedAt: true,
      dossierCompletedAt: true,
    },
  })

  // Onboarding is complete only when onboardingCompletedAt is set
  if (!profile?.onboardingCompletedAt) {
    redirect('/onboarding')
  }

  const { skipGate } = await searchParams

  // Onboarding done, Dossier build not done yet: show the entry gate unless
  // the user explicitly chose "Go to Studio" from it (skipGate=1).
  if (!profile.dossierCompletedAt && skipGate !== '1') {
    return <DossierGate userName={user.name} />
  }

  return <StudioShell user={user} />
}
