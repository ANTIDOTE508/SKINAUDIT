'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
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
import { StepFooter } from './StepFooter'
import { saveToolsAndTreatments } from '@/app/actions/onboarding'
import type { HomeDeviceType, ProfessionalTreatmentType } from '@prisma/client'

const ICON_SIZE = 22
const ICON_STROKE = 1.5

const HOME_DEVICES: { value: HomeDeviceType; label: string; icon: React.ReactNode }[] = [
  { value: 'LED_THERAPY', label: 'LED therapy', icon: <Lightbulb size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'MICROCURRENT', label: 'Microcurrent', icon: <Zap size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'RF_DEVICE', label: 'RF device', icon: <Radio size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'GUA_SHA', label: 'Gua sha', icon: <Gem size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'FACIAL_ROLLER', label: 'Facial roller', icon: <CircleDot size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'DERMA_ROLLER', label: 'Derma roller', icon: <ScanLine size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'ULTRASONIC_SCRUBBER', label: 'Ultrasonic scrubber', icon: <Waves size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'HIGH_FREQUENCY_WAND', label: 'High-frequency wand', icon: <Sparkle size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
]

const PRO_TREATMENTS: { value: ProfessionalTreatmentType; label: string; icon: React.ReactNode }[] = [
  { value: 'FACIALS', label: 'Facials', icon: <Sparkles size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'PEELS', label: 'Peels', icon: <FlaskConical size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'INJECTABLES', label: 'Injectables', icon: <Syringe size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'LASERS', label: 'Lasers', icon: <Flame size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'OTHER', label: 'Other', icon: <Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
]

const SUB_COPY: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 300,
  fontSize: '0.9375rem',
  lineHeight: 1.6,
  color: 'var(--color-alabaster-400)',
  margin: '0 0 2.25rem',
}

type Props = {
  homeDevices: string[]
  professionalTreatments: string[]
  onHomeDevicesChange: (v: string[]) => void
  onProfessionalTreatmentsChange: (v: string[]) => void
  onContinue: () => void
  onBack: () => void
}

function ToolCard({
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
      role="checkbox"
      data-card
      onClick={onClick}
      aria-checked={isSelected}
      aria-label={label}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.625rem',
        padding: '1rem 0.5rem',
        borderRadius: 'var(--radius-card)',
        border: isSelected ? '1.5px solid var(--color-sienna-400)' : '1px solid var(--color-border)',
        backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
        cursor: 'pointer',
        outline: 'none',
        transition: 'border-color 180ms var(--ease-luxury), background-color 180ms var(--ease-luxury)',
        minHeight: '84px',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: isSelected ? '1px solid var(--color-sienna-400)' : '1px solid rgba(184,134,61,0.28)',
          color: isSelected ? 'var(--color-sienna-400)' : 'var(--color-alabaster-400)',
          transition: 'border-color 180ms var(--ease-luxury), color 180ms var(--ease-luxury)',
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '0.75rem',
          textAlign: 'center',
          lineHeight: 1.3,
          color: isSelected ? 'var(--color-alabaster-50)' : 'var(--color-alabaster-300)',
          transition: 'color 180ms ease',
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
  const rootRef = useRef<HTMLDivElement>(null)
  const homeRef = useRef<HTMLDivElement>(null)
  const proRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const homeLabelId = useId()
  const proLabelId = useId()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const node = rootRef.current
    if (!node) return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      const blocks = node.querySelectorAll('[data-reveal]')
      if (reduced) {
        if (blocks.length) gsap.set(blocks, { y: 0, opacity: 1 })
        return
      }
      if (blocks.length) {
        gsap.fromTo(
          blocks,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, stagger: 0.09, ease: 'power3.out', delay: 0.15 }
        )
      }

      const homeCards = homeRef.current?.querySelectorAll('[data-card]')
      if (homeCards?.length) {
        gsap.fromTo(
          homeCards,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: 'power2.out', delay: 0.4 }
        )
      }

      const proCards = proRef.current?.querySelectorAll('[data-card]')
      if (proCards?.length) {
        gsap.fromTo(
          proCards,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.65 }
        )
      }
    }, node)
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
    setError(null)
    startTransition(async () => {
      try {
        await saveToolsAndTreatments({
          homeDevices: homeDevices as HomeDeviceType[],
          professionalTreatments: professionalTreatments as ProfessionalTreatmentType[],
        })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef}>
      {/* Background scene — portaled to body so GSAP's transform on ancestor
          content doesn't trap this fixed layer inside the wizard's 680px
          column. Content spans the full height (two card grids), so a
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
        <h2
          data-reveal
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            color: 'var(--color-alabaster-50)',
            margin: '0 0 1rem',
            textShadow: '0 1px 24px rgba(6,5,5,0.7)',
          }}
        >
          Do you use any tools
          <br />
          or receive treatments?
        </h2>

        <p data-reveal style={SUB_COPY}>
          Select any that apply.
        </p>

        {/* At home */}
        <div data-reveal style={{ marginBottom: '2rem' }}>
          <span
            id={homeLabelId}
            className="label-caps"
            style={{ display: 'block', marginBottom: '0.75rem' }}
          >
            At home
          </span>
          <div
            ref={homeRef}
            role="group"
            aria-labelledby={homeLabelId}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.625rem',
            }}
          >
            {HOME_DEVICES.map((d) => (
              <ToolCard
                key={d.value}
                label={d.label}
                icon={d.icon}
                isSelected={homeDevices.includes(d.value)}
                onClick={() => toggleHome(d.value)}
              />
            ))}
          </div>
        </div>

        {/* Professional treatments */}
        <div data-reveal style={{ marginBottom: '0.5rem' }}>
          <span
            id={proLabelId}
            className="label-caps"
            style={{ display: 'block', marginBottom: '0.75rem' }}
          >
            Professional treatments
          </span>
          <div
            ref={proRef}
            role="group"
            aria-labelledby={proLabelId}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.625rem',
            }}
          >
            {PRO_TREATMENTS.map((t) => (
              <ToolCard
                key={t.value}
                label={t.label}
                icon={t.icon}
                isSelected={professionalTreatments.includes(t.value)}
                onClick={() => togglePro(t.value)}
              />
            ))}
          </div>
        </div>

        {error && (
          <p
            role="alert"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: 'var(--color-blush-500)',
              marginBottom: '1rem',
            }}
          >
            {error}
          </p>
        )}

        <StepFooter onContinue={handleContinue} onBack={onBack} isLoading={isPending} />
      </div>
    </div>
  )
}
