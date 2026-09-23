import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SIDEBAR_COOKIE } from '@/lib/studio-sidebar'

/**
 * Session + onboarding guards, Dossier state and shell preferences shared by
 * /dashboard, /studio and /dossier. Redirects away when the user is signed out or mid-onboarding.
 */
export async function loadStudioContext() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user?.id) {
    redirect('/signin')
  }

  const userId = session.user.id

  const [profile, dossierProductCount, cookieStore] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId },
      select: { onboardingCompletedAt: true },
    }),
    // The "Dossier is empty" marker is derived, never stored: archived
    // products no longer count as being in the Dossier.
    prisma.userDossierProduct.count({
      where: { userId, status: { not: 'ARCHIVED' } },
    }),
    cookies(),
  ])

  // Onboarding is complete only when onboardingCompletedAt is set
  if (!profile?.onboardingCompletedAt) {
    redirect('/onboarding')
  }

  return {
    userId,
    user: { name: session.user.name ?? null, email: session.user.email },
    isDossierEmpty: dossierProductCount === 0,
    // Read on the server so the desktop sidebar renders at its saved width on
    // first paint, without a collapse animation or hydration mismatch.
    sidebarCollapsed: cookieStore.get(SIDEBAR_COOKIE)?.value === 'collapsed',
  }
}
