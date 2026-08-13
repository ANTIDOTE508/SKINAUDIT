import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

export default async function OnboardingPage() {
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
      onboardingStep: true,
      onboardingCompletedAt: true,
    },
  })

  // Onboarding is complete only when onboardingCompletedAt is set
  if (profile?.onboardingCompletedAt) {
    redirect('/dashboard')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <DashboardHeader user={user} />

      <div style={{ flex: 1 }}>
        <OnboardingWizard
          user={{
            id: session.user.id,
            email: session.user.email,
            name: session.user.name ?? null,
          }}
          initialStep={profile?.onboardingStep ?? 0}
        />
      </div>
    </div>
  )
}
