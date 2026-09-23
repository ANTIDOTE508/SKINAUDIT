import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Session + onboarding guards and Dossier state shared by /dashboard and
 * /studio. Redirects away when the user is signed out or mid-onboarding.
 */
export async function loadStudioContext() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user?.id) {
    redirect('/signin')
  }

  const userId = session.user.id

  const [profile, dossierProductCount] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId },
      select: { onboardingCompletedAt: true },
    }),
    // The "Dossier is empty" marker is derived, never stored: archived
    // products no longer count as being in the Dossier.
    prisma.userDossierProduct.count({
      where: { userId, status: { not: 'ARCHIVED' } },
    }),
  ])

  // Onboarding is complete only when onboardingCompletedAt is set
  if (!profile?.onboardingCompletedAt) {
    redirect('/onboarding')
  }

  return {
    user: { name: session.user.name ?? null, email: session.user.email },
    isDossierEmpty: dossierProductCount === 0,
  }
}
