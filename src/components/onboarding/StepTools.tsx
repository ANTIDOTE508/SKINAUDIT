'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import {
  Lightbulb,
  Zap,
  Radio,
  Gem,
  CircleDot,
  ScanLine,
  Waves,
  Sparkle,
  Sparkles,
  FlaskConical,
  Syringe,
  Flame,
  Plus,
} from 'lucide-react'
import { StepHeader } from './StepHeader'
import { StepNav } from './StepNav'
import { saveToolsAndTreatments } from '@/app/actions/onboarding'
import type { HomeDeviceType, ProfessionalTreatmentType } from '@prisma/client'

const ICON_SIZE = 20
const ICON_STROKE = 1.5

const HOME_DEVICES: { value: HomeDeviceType; label: string; icon: React.ReactNode }[] = [
  { value: 'LED_THERAPY', label: 'LED therapy', icon: <Lightbulb size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'MICROCURRENT', label: 'Microcurrent', icon: <Zap size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'RF_DEVICE', label: 'RF device', icon: <Radio size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'GUA_SHA', label: 'Gua sha', icon: <Gem size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'FACIAL_ROLLER', label: 'Facial roller', icon: <CircleDot size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'DERMA_ROLLER', label: 'Derma roller', icon: <ScanLine size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'ULTRASONIC_SCRUBBER', label: 'Ultrasonic scrubber', icon: <Waves size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'HIGH_FREQUENCY_WAND', label: 'High-freq. wand', icon: <Sparkle size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
]

const PRO_TREATMENTS: { value: ProfessionalTreatmentType; label: string; icon: React.ReactNode }[] = [
  { value: 'FACIALS', label: 'Facials', icon: <Sparkles size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'PEELS', label: 'Peels', icon: <FlaskConical size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'INJECTABLES', label: 'Injectables', icon: <Syringe size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'LASERS', label: 'Lasers', icon: <Flame size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'OTHER', label: 'Other', icon: <Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
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
  icon: React.ReactNode
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
        gap: '0.5rem',
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
      <span
        style={{
          display: 'flex',
          color: isSelected ? 'var(--color-sienna-400)' : 'var(--color-alabaster-300)',
          transition: 'color 180ms ease',
        }}
      >
        {icon}
      </span>
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
      {/* Background scene — portaled to body so GSAP's transform on ancestor
          content doesn't trap this fixed layer inside the wizard's 680px
          column. Content spans the full height (two chip grids), so a
          single full-bleed treatment with a strong, even scrim is used
          across all breakpoints — the dense grid must stay legible everywhere. */}
      {mounted &&
        createPortal(
          <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none', backgroundColor: 'var(--color-obsidian-950)' }}>
            <Image
              src="/images/onboarding/step7/bg-treatment-room.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="step7-bg-image"
            />
            <div className="step7-bg-scrim" />

            <style>{`
              .step7-bg-image {
                object-fit: cover;
                object-position: center 30%;
              }
              @media (min-width: 1024px) {
                .step7-bg-image { object-position: 30% center; }
              }
              .step7-bg-scrim {
                position: absolute;
                inset: 0;
                background:
                  linear-gradient(
                    180deg,
                    rgba(6,5,5,0.55) 0%,
                    rgba(6,5,5,0.45) 40%,
                    rgba(6,5,5,0.65) 100%
                  ),
                  linear-gradient(
                    90deg,
                    rgba(6,5,5,0.2) 0%,
                    rgba(6,5,5,0.55) 55%,
                    rgba(6,5,5,0.7) 100%
                  );
              }
            `}</style>
          </div>,
          document.body
        )}

      <div style={{ position: 'relative', zIndex: 1 }}>
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
    </div>
  )
}
