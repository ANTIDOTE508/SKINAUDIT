import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user?.id) {
    redirect('/signin')
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      onboardingStep: true,
      onboardingCompletedAt: true,
      genderIdentity: true,
      preferredName: true,
      birthMonth: true,
      birthYear: true,
      skinToneScale: true,
      vitiligo: true,
      sunResponse: true,
      skinUndertone: true,
      pihFrequency: true,
      pihDuration: true,
      unevenPatches: true,
      skinType: true,
      concerns: true,
      sensitivityScore: true,
      goals: true,
      experienceLevel: true,
    },
  })

  // Onboarding is complete only when onboardingCompletedAt is set
  if (profile?.onboardingCompletedAt) {
    redirect('/studio')
  }

  // Environment answers live in a separate table from UserProfile, so they
  // need their own query to prefill StepEnvironment on resume.
  const environment = await prisma.userEnvironmentContext.findUnique({
    where: { userId: session.user.id },
    select: {
      city: true,
      countryCode: true,
      climateZone: true,
      season: true,
    },
  })

  // Tools & treatments also live in their own tables (each row is one
  // selected chip) — unlike experienceLevel, an empty result here is a
  // legitimate "nothing selected yet" state, no onboardingStep guard needed.
  const [homeDevices, professionalTreatments] = await Promise.all([
    prisma.userHomeDevice.findMany({ where: { userId: session.user.id }, select: { deviceType: true } }),
    prisma.userProfessionalTreatment.findMany({ where: { userId: session.user.id }, select: { treatmentType: true } }),
  ])

  return (
    <OnboardingWizard
      user={{
        id: session.user.id,
        email: session.user.email,
        name: session.user.name ?? null,
      }}
      initialStep={profile?.onboardingStep ?? 0}
      initialProfile={
        profile
          ? {
              genderIdentity: profile.genderIdentity,
              preferredName: profile.preferredName,
              birthMonth: profile.birthMonth,
              birthYear: profile.birthYear,
              skinToneScale: profile.skinToneScale,
              vitiligo: profile.vitiligo,
              sunResponse: profile.sunResponse,
              skinUndertone: profile.skinUndertone,
              pihFrequency: profile.pihFrequency,
              pihDuration: profile.pihDuration,
              unevenPatches: profile.unevenPatches,
              skinType: profile.skinType,
              concerns: profile.concerns,
              sensitivityScore: profile.sensitivityScore,
              goals: profile.goals,
              city: environment?.city,
              countryCode: environment?.countryCode,
              climateZone: environment?.climateZone,
              season: environment?.season,
              // experienceLevel defaults to BEGINNER in the DB the moment a
              // UserProfile row exists (schema default), even if the user
              // never reached this step — only trust it once onboardingStep
              // shows they've actually answered step 12, otherwise every
              // first-time visitor would see "New to skincare" pre-selected.
              experienceLevel: (profile.onboardingStep ?? 0) >= 12 ? profile.experienceLevel : null,
              homeDevices: homeDevices.map((d) => d.deviceType),
              professionalTreatments: professionalTreatments.map((t) => t.treatmentType),
            }
          : null
      }
    />
  )
}
