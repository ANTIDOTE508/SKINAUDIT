import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StudioShell } from '@/components/studio/StudioShell'

export default async function StudioPage() {
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
    },
  })

  // Onboarding is complete only when onboardingCompletedAt is set
  if (!profile?.onboardingCompletedAt) {
    redirect('/onboarding')
  }

  return <StudioShell user={user} />
}
