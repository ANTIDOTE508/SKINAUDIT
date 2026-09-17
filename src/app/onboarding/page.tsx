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
      sunResponse: true,
      skinUndertone: true,
      pihFrequency: true,
      pihDuration: true,
      unevenPatches: true,
      productReactivity: true,
      inflammatoryHistory: true,
      productReactionSeverity: true,
      recoveryTime: true,
      oilyAndTight: true,
      breakoutPattern: true,
      breakoutAreas: true,
      rednessPattern: true,
      rednessAreas: true,
      flushTriggers: true,
      flushFadeSpeed: true,
      currentStateNormal: true,
      currentStateDiffs: true,
      recentChange: true,
      recentChangeDetail: true,
      darkerAreas: true,
      darkerAreaTriggers: true,
      skinType: true,
      primaryConcerns: true,
      goals: true,
      skincareExperience: true,
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

  // Tools & treatments also live in their own tables (one row per selected
  // item, each carrying its three follow-up answers). An empty result is a
  // legitimate "nothing selected yet" state.
  const [homeDevices, professionalTreatments] = await Promise.all([
    prisma.userHomeDevice.findMany({
      where: { userId: session.user.id },
      select: { deviceType: true, frequency: true, lastUsed: true, faceAreas: true },
    }),
    prisma.userProfessionalTreatment.findMany({
      where: { userId: session.user.id },
      select: { treatmentType: true, frequency: true, lastUsed: true, faceAreas: true },
    }),
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
              sunResponse: profile.sunResponse,
              skinUndertone: profile.skinUndertone,
              pihFrequency: profile.pihFrequency,
              pihDuration: profile.pihDuration,
              unevenPatches: profile.unevenPatches,
              productReactivity: profile.productReactivity,
              inflammatoryHistory: profile.inflammatoryHistory,
              productReactionSeverity: profile.productReactionSeverity,
              recoveryTime: profile.recoveryTime,
              oilyAndTight: profile.oilyAndTight,
              breakoutPattern: profile.breakoutPattern,
              breakoutAreas: profile.breakoutAreas,
              rednessPattern: profile.rednessPattern,
              rednessAreas: profile.rednessAreas,
              flushTriggers: profile.flushTriggers,
              flushFadeSpeed: profile.flushFadeSpeed,
              currentStateNormal: profile.currentStateNormal,
              currentStateDiffs: profile.currentStateDiffs,
              recentChange: profile.recentChange,
              recentChangeDetail: profile.recentChangeDetail,
              darkerAreas: profile.darkerAreas,
              darkerAreaTriggers: profile.darkerAreaTriggers,
              skinType: profile.skinType,
              primaryConcerns: profile.primaryConcerns,
              goals: profile.goals,
              skincareExperience: profile.skincareExperience,
              city: environment?.city,
              countryCode: environment?.countryCode,
              climateZone: environment?.climateZone,
              season: environment?.season,
              homeDevices: homeDevices.map((d) => ({
                type: d.deviceType,
                frequency: d.frequency,
                lastUsed: d.lastUsed,
                faceAreas: d.faceAreas,
              })),
              professionalTreatments: professionalTreatments.map((t) => ({
                type: t.treatmentType,
                frequency: t.frequency,
                lastUsed: t.lastUsed,
                faceAreas: t.faceAreas,
              })),
            }
          : null
      }
    />
  )
}
