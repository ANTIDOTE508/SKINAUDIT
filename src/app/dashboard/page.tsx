import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

export default async function DashboardPage() {
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
      skinType: true,
      sensitivity: true,
      experienceLevel: true,
      concerns: true,
      onboardingStep: true,
      onboardingCompletedAt: true,
    },
  })

  // Onboarding is complete only when onboardingCompletedAt is set
  if (profile?.onboardingCompletedAt) {
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

        <main
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '1rem',
            padding: '2rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 300,
              color: 'var(--color-alabaster-50)',
              letterSpacing: '0.02em',
            }}
          >
            Your dashboard is being crafted.
          </span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: 'var(--color-text-muted)',
              fontWeight: 300,
            }}
          >
            Welcome back, {user.name ?? user.email}.
          </span>
        </main>
      </div>
    )
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
