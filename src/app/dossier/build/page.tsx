import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DossierBuildShell } from '@/components/dossierBuild/DossierBuildShell'

export default async function DossierBuildPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user?.id) {
    redirect('/signin')
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      onboardingCompletedAt: true,
      dossierStep: true,
      dossierCompletedAt: true,
    },
  })

  if (!profile?.onboardingCompletedAt) {
    redirect('/onboarding')
  }

  if (profile.dossierCompletedAt) {
    redirect('/studio')
  }

  return <DossierBuildShell initialDossierStep={profile.dossierStep} />
}
