'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { RadioPill } from './RadioPill'
import { saveToolsAndTreatments } from '@/app/actions/onboarding'
import type {
  HomeDeviceType,
  ProfessionalTreatmentType,
  ToolUsageFrequency,
  ToolLastUsed,
} from '@prisma/client'

// ─── Option lists ─────────────────────────────────────────────

const HOME_DEVICES: { value: HomeDeviceType; label: string }[] = [
  { value: 'LED_THERAPY', label: 'LED / light therapy' },
  { value: 'MICROCURRENT', label: 'Microcurrent' },
  { value: 'RF_DEVICE', label: 'Radiofrequency' },
  { value: 'MICRONEEDLING', label: 'Microneedling' },
  { value: 'CLEANSING_DEVICE', label: 'Cleansing device' },
  { value: 'DERMAPLANING', label: 'Dermaplaning' },
  { value: 'HIGH_FREQUENCY_WAND', label: 'High-frequency wand' },
  { value: 'ULTRASONIC_DEVICE', label: 'Ultrasonic device' },
  { value: 'MICRODERMABRASION', label: 'Microdermabrasion' },
  { value: 'PORE_VACUUM', label: 'Pore vacuum' },
  { value: 'FACIAL_STEAMER', label: 'Facial steamer' },
  { value: 'IPL_LIGHT_DEVICE', label: 'IPL / light device' },
  { value: 'GUA_SHA', label: 'Gua sha' },
  { value: 'FACIAL_ROLLER', label: 'Facial roller' },
  { value: 'OTHER', label: 'Other' },
]

const PRO_TREATMENTS: { value: ProfessionalTreatmentType; label: string }[] = [
  { value: 'FACIALS', label: 'Facials' },
  { value: 'CHEMICAL_PEELS', label: 'Chemical peels' },
  { value: 'MICRONEEDLING', label: 'Microneedling' },
  { value: 'RF_MICRONEEDLING', label: 'RF microneedling' },
  { value: 'LASER_RESURFACING', label: 'Laser / resurfacing' },
  { value: 'IPL_BBL', label: 'IPL / BBL' },
  { value: 'RADIOFREQUENCY', label: 'Radiofrequency' },
  { value: 'ULTRASOUND_HIFU', label: 'Ultrasound / HIFU' },
  { value: 'NEUROMODULATORS', label: 'Neuromodulators (Botox-type)' },
  { value: 'DERMAL_FILLERS', label: 'Dermal fillers' },
  { value: 'SKIN_BOOSTERS', label: 'Skin boosters' },
  { value: 'BIOSTIMULATORS', label: 'Biostimulators' },
  { value: 'PRP_PRF', label: 'PRP / PRF' },
  { value: 'HYDRADERMABRASION', label: 'Hydradermabrasion' },
  { value: 'MICRODERMABRASION', label: 'Microdermabrasion' },
  { value: 'DERMAPLANING', label: 'Dermaplaning' },
  { value: 'LED_PHOTOTHERAPY', label: 'LED / phototherapy' },
  { value: 'THREAD_LIFTS', label: 'Thread lifts' },
  { value: 'SURGERY', label: 'Surgery' },
  { value: 'OTHER', label: 'Other' },
]

const FREQUENCY_OPTIONS: { value: ToolUsageFrequency; title: string }[] = [
  { value: 'DAILY', title: 'Daily' },
  { value: 'WEEKLY', title: 'Weekly' },
  { value: 'MONTHLY', title: 'Monthly' },
  { value: 'OCCASIONALLY', title: 'Occasionally' },
  { value: 'ONCE', title: 'Once / rarely' },
]

const LAST_USED_OPTIONS: { value: ToolLastUsed; title: string }[] = [
  { value: 'WITHIN_WEEK', title: 'Within the past week' },
  { value: 'WITHIN_MONTH', title: 'Within the past month' },
  { value: 'ONE_TO_SIX_MONTHS', title: '1–6 months ago' },
  { value: 'OVER_SIX_MONTHS', title: 'More than 6 months ago' },
]

const FACE_AREAS: { value: string; label: string }[] = [
  { value: 'forehead', label: 'Forehead' },
  { value: 'cheeks', label: 'Cheeks' },
  { value: 'nose', label: 'Nose' },
  { value: 'chin', label: 'Chin' },
  { value: 'jawline', label: 'Jawline' },
  { value: 'under_eyes', label: 'Under-eyes' },
  { value: 'neck', label: 'Neck' },
  { value: 'full_face', label: 'Full face' },
]

// ─── Shared item type ─────────────────────────────────────────

export type ToolItemState = {
  type: string
  frequency: ToolUsageFrequency | null
  lastUsed: ToolLastUsed | null
  faceAreas: string[]
}

const isComplete = (i: ToolItemState) =>
  i.frequency != null && i.lastUsed != null && i.faceAreas.length > 0

type Props = {
  homeDevices: ToolItemState[]
  professionalTreatments: ToolItemState[]
  onHomeDevicesChange: (v: ToolItemState[]) => void
  onProfessionalTreatmentsChange: (v: ToolItemState[]) => void
  onContinue: () => void
  onBack: () => void
}

// ─── Per-item inline follow-up panel ─────────────────────────

function FollowUpPanel({
  item,
  onChange,
}: {
  item: ToolItemState
  onChange: (patch: Partial<ToolItemState>) => void
}) {
  const freqLabelId = useId()
  const lastLabelId = useId()
  const areasLabelId = useId()

  const toggleArea = (area: string) => {
    const has = item.faceAreas.includes(area)
    onChange({
      faceAreas: has
        ? item.faceAreas.filter((a) => a !== area)
        : [...item.faceAreas, area],
    })
  }

  return (
    <div
      style={{
        marginTop: '0.75rem',
        marginBottom: '0.5rem',
        padding: '1rem',
        borderRadius: 'var(--radius-card)',
        border: '1px solid rgba(184,134,61,0.28)',
        backgroundColor: 'rgba(6,5,5,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      <div>
        <span id={freqLabelId} className="label-caps" style={{ display: 'block', marginBottom: '0.5rem' }}>
          How often do you use / have it?
        </span>
        <div
          role="radiogroup"
          aria-labelledby={freqLabelId}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          {FREQUENCY_OPTIONS.map((o) => (
            <RadioPill
              key={o.value}
              value={o.value}
              title={o.title}
              ariaLabel={o.title}
              selected={item.frequency === o.value}
              onChange={() => onChange({ frequency: o.value })}
            />
          ))}
        </div>
      </div>

      <div>
        <span id={lastLabelId} className="label-caps" style={{ display: 'block', marginBottom: '0.5rem' }}>
          When did you last have it?
        </span>
        <div
          role="radiogroup"
          aria-labelledby={lastLabelId}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          {LAST_USED_OPTIONS.map((o) => (
            <RadioPill
              key={o.value}
              value={o.value}
              title={o.title}
              ariaLabel={o.title}
              selected={item.lastUsed === o.value}
              onChange={() => onChange({ lastUsed: o.value })}
            />
          ))}
        </div>
      </div>

      <div>
        <span id={areasLabelId} className="label-caps" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Which areas of your face? — select all that apply
        </span>
        <div
          role="group"
          aria-labelledby={areasLabelId}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}
        >
          {FACE_AREAS.map((a) => {
            const selected = item.faceAreas.includes(a.value)
            return (
              <button
                key={a.value}
                type="button"
                role="checkbox"
                aria-checked={selected}
                onClick={() => toggleArea(a.value)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    toggleArea(a.value)
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: selected
                    ? '1.5px solid var(--color-sienna-500)'
                    : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: selected ? 'var(--color-accent-subtle)' : 'transparent',
                  cursor: 'pointer',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 300,
                  fontSize: '0.75rem',
                  color: selected ? 'var(--color-alabaster-50)' : 'var(--color-alabaster-300)',
                  transition: 'all var(--duration-micro) var(--ease-luxury)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    border: selected
                      ? '1px solid var(--color-sienna-400)'
                      : '1px solid rgba(184,134,61,0.45)',
                    backgroundColor: selected ? 'var(--color-sienna-400)' : 'transparent',
                    flexShrink: 0,
                  }}
                />
                {a.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Section (a list of selectable chips + inline follow-ups) ──

function ToolSection({
  labelId,
  heading,
  options,
  items,
  onItemsChange,
}: {
  labelId: string
  heading: string
  options: { value: string; label: string }[]
  items: ToolItemState[]
  onItemsChange: (v: ToolItemState[]) => void
}) {
  const toggle = (type: string) => {
    const existing = items.find((i) => i.type === type)
    if (existing) {
      onItemsChange(items.filter((i) => i.type !== type))
    } else {
      onItemsChange([...items, { type, frequency: null, lastUsed: null, faceAreas: [] }])
    }
  }

  const patchItem = (type: string, patch: Partial<ToolItemState>) => {
    onItemsChange(items.map((i) => (i.type === type ? { ...i, ...patch } : i)))
  }

  return (
    <div data-reveal style={{ marginBottom: '2rem' }}>
      <span id={labelId} className="label-caps" style={{ display: 'block', marginBottom: '0.75rem' }}>
        {heading}
      </span>

      <div
        role="group"
        aria-labelledby={labelId}
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}
      >
        {options.map((o) => {
          const selected = items.some((i) => i.type === o.value)
          return (
            <button
              key={o.value}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => toggle(o.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '8px',
                border: selected
                  ? '1.5px solid var(--color-sienna-500)'
                  : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: selected ? 'var(--color-accent-subtle)' : 'transparent',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                fontWeight: 300,
                fontSize: '0.8125rem',
                color: selected ? 'var(--color-alabaster-50)' : 'var(--color-alabaster-300)',
                transition: 'all var(--duration-micro) var(--ease-luxury)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  border: selected
                    ? '1px solid var(--color-sienna-400)'
                    : '1px solid rgba(184,134,61,0.45)',
                  backgroundColor: selected ? 'var(--color-sienna-400)' : 'transparent',
                  flexShrink: 0,
                }}
              />
              {o.label}
            </button>
          )
        })}
      </div>

      {/* Inline follow-ups, one per selected item, in selection order */}
      {items.map((item) => {
        const label = options.find((o) => o.value === item.type)?.label ?? item.type
        return (
          <div key={item.type} style={{ marginTop: '1rem' }}>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-heading)',
                fontWeight: 300,
                fontSize: '0.9375rem',
                color: 'var(--color-alabaster-50)',
                marginBottom: '0.25rem',
              }}
            >
              {label}
              {!isComplete(item) && (
                <span
                  style={{
                    marginLeft: '0.5rem',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.6875rem',
                    color: 'var(--color-sienna-400)',
                  }}
                >
                  — 3 quick questions
                </span>
              )}
            </span>
            <FollowUpPanel item={item} onChange={(patch) => patchItem(item.type, patch)} />
          </div>
        )
      })}
    </div>
  )
}

// ─── Step ─────────────────────────────────────────────────────

export function StepTools({
  homeDevices,
  professionalTreatments,
  onHomeDevicesChange,
  onProfessionalTreatmentsChange,
  onContinue,
  onBack,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const homeLabelId = useId()
  const proLabelId = useId()

  useEffect(() => {
    const node = rootRef.current
    if (!node) return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      const blocks = node.querySelectorAll('[data-reveal]')
      if (!blocks.length) return
      if (reduced) {
        gsap.set(blocks, { y: 0, opacity: 1 })
        return
      }
      gsap.fromTo(
        blocks,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.09, ease: 'power3.out', delay: 0.15 }
      )
    }, node)
    return () => ctx.revert()
  }, [])

  // Any selected item with an incomplete follow-up blocks Next.
  const allComplete =
    homeDevices.every(isComplete) && professionalTreatments.every(isComplete)

  const handleContinue = () => {
    if (!allComplete) {
      setError('Please answer all three questions for each item you selected.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveToolsAndTreatments({
          homeDevices: homeDevices.map((i) => ({
            type: i.type as HomeDeviceType,
            frequency: i.frequency as ToolUsageFrequency,
            lastUsed: i.lastUsed as ToolLastUsed,
            faceAreas: i.faceAreas,
          })),
          professionalTreatments: professionalTreatments.map((i) => ({
            type: i.type as ProfessionalTreatmentType,
            frequency: i.frequency as ToolUsageFrequency,
            lastUsed: i.lastUsed as ToolLastUsed,
            faceAreas: i.faceAreas,
          })),
        })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '34rem' }}>
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
          }}
        >
          Do you use any tools or receive professional treatments?
        </h2>

        <p
          data-reveal
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.9375rem',
            lineHeight: 1.6,
            color: 'var(--color-alabaster-400)',
            margin: '0 0 2.25rem',
          }}
        >
          Select any that apply. For each one, we&apos;ll ask three quick
          questions.
        </p>

        <ToolSection
          labelId={homeLabelId}
          heading="At-home tools & devices"
          options={HOME_DEVICES}
          items={homeDevices}
          onItemsChange={onHomeDevicesChange}
        />

        <ToolSection
          labelId={proLabelId}
          heading="Professional treatments"
          options={PRO_TREATMENTS}
          items={professionalTreatments}
          onItemsChange={onProfessionalTreatmentsChange}
        />

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

        <StepFooter
          onContinue={handleContinue}
          onBack={onBack}
          isLoading={isPending}
          continueDisabled={!allComplete}
        />
      </div>
    </div>
  )
}
