'use client'

import { useRef, useEffect, useTransition } from 'react'
import { gsap } from 'gsap'
import { StepHeader } from './StepHeader'
import { StepNav } from './StepNav'
import { saveToolsAndTreatments } from '@/app/actions/onboarding'
import type { HomeDeviceType, ProfessionalTreatmentType } from '@prisma/client'

const HOME_DEVICES: { value: HomeDeviceType; label: string; icon: string }[] = [
  { value: 'LED_THERAPY', label: 'LED therapy', icon: '💡' },
  { value: 'MICROCURRENT', label: 'Microcurrent', icon: '⚡' },
  { value: 'RF_DEVICE', label: 'RF device', icon: '📡' },
  { value: 'GUA_SHA', label: 'Gua sha', icon: '🪨' },
  { value: 'FACIAL_ROLLER', label: 'Facial roller', icon: '🫧' },
  { value: 'DERMA_ROLLER', label: 'Derma roller', icon: '🔬' },
  { value: 'ULTRASONIC_SCRUBBER', label: 'Ultrasonic scrubber', icon: '〰' },
  { value: 'HIGH_FREQUENCY_WAND', label: 'High-freq. wand', icon: '🔮' },
]

const PRO_TREATMENTS: { value: ProfessionalTreatmentType; label: string; icon: string }[] = [
  { value: 'FACIALS', label: 'Facials', icon: '✨' },
  { value: 'PEELS', label: 'Peels', icon: '🧪' },
  { value: 'INJECTABLES', label: 'Injectables', icon: '💉' },
  { value: 'LASERS', label: 'Lasers', icon: '🔴' },
  { value: 'OTHER', label: 'Other', icon: '＋' },
]

type Props = {
  homeDevices: string[]
  professionalTreatments: string[]
  onHomeDevicesChange: (v: string[]) => void
  onProfessionalTreatmentsChange: (v: string[]) => void
  onContinue: () => void
  onBack: () => void
}

function ToolChip({
  label,
  icon,
  isSelected,
  onClick,
}: {
  label: string
  icon: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.875rem 0.5rem',
        borderRadius: '8px',
        border: isSelected ? '1.5px solid var(--color-sienna-500)' : '1px solid rgba(255,255,255,0.1)',
        backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'transparent',
        cursor: 'pointer',
        transition: 'all 180ms var(--ease-luxury)',
        outline: 'none',
        minHeight: '72px',
      }}
    >
      <span style={{ fontSize: '1.25rem' }}>{icon}</span>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '10px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: isSelected ? 'var(--color-sienna-300)' : 'var(--color-alabaster-400)',
          textAlign: 'center',
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>
    </button>
  )
}

export function StepTools({
  homeDevices,
  professionalTreatments,
  onHomeDevicesChange,
  onProfessionalTreatmentsChange,
  onContinue,
  onBack,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const sections = containerRef.current?.querySelectorAll('[data-section]')
    const ctx = gsap.context(() => {
      if (sections?.length) {
        gsap.fromTo(
          sections,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.15, ease: 'power2.out', delay: 0.2 }
        )
      }
    })
    return () => ctx.revert()
  }, [])

  const toggleHome = (v: string) => {
    onHomeDevicesChange(
      homeDevices.includes(v) ? homeDevices.filter((d) => d !== v) : [...homeDevices, v]
    )
  }

  const togglePro = (v: string) => {
    onProfessionalTreatmentsChange(
      professionalTreatments.includes(v)
        ? professionalTreatments.filter((t) => t !== v)
        : [...professionalTreatments, v]
    )
  }

  const handleContinue = () => {
    startTransition(async () => {
      await saveToolsAndTreatments({
        homeDevices: homeDevices as HomeDeviceType[],
        professionalTreatments: professionalTreatments as ProfessionalTreatmentType[],
      })
      onContinue()
    })
  }

  return (
    <div ref={containerRef}>
      <StepHeader
        eyebrow="07 / 08"
        title="Do you use any tools or receive treatments?"
        subtitle="Select any that apply."
      />

      {/* At home */}
      <div data-section style={{ marginBottom: '2rem' }}>
        <span
          className="label-caps"
          style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.875rem' }}
        >
          At home
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          {HOME_DEVICES.map((d) => (
            <ToolChip
              key={d.value}
              label={d.label}
              icon={d.icon}
              isSelected={homeDevices.includes(d.value)}
              onClick={() => toggleHome(d.value)}
            />
          ))}
        </div>
      </div>

      <hr className="divider-subtle" style={{ marginBottom: '2rem' }} />

      {/* Professional */}
      <div data-section>
        <span
          className="label-caps"
          style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.875rem' }}
        >
          Professional treatments
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          {PRO_TREATMENTS.map((t) => (
            <ToolChip
              key={t.value}
              label={t.label}
              icon={t.icon}
              isSelected={professionalTreatments.includes(t.value)}
              onClick={() => togglePro(t.value)}
            />
          ))}
        </div>
      </div>

      <StepNav onContinue={handleContinue} onBack={onBack} isLoading={isPending} />
    </div>
  )
}
