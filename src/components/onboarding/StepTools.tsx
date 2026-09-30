'use client'

import {
  useRef,
  useEffect,
  useState,
  useTransition,
  useSyncExternalStore,
  useId,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { saveToolsAndTreatments } from '@/app/actions/onboarding'
import './stepTools.css'
import type {
  HomeDeviceType,
  ProfessionalTreatmentType,
  ToolUsageFrequency,
  ToolLastUsed,
} from '@prisma/client'

const noopSubscribe = () => () => {}

// ─── Option lists ─────────────────────────────────────────────

type Kind = 'home' | 'pro'
type Option = { value: string; label: string }

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

// Grouped as in templates/stepTreatment.html — only "Popular" shows until
// the user asks for all 20.
const PRO_GROUPS: {
  label: string
  options: { value: ProfessionalTreatmentType; label: string }[]
}[] = [
  {
    label: 'Popular',
    options: [
      { value: 'FACIALS', label: 'Facials' },
      { value: 'CHEMICAL_PEELS', label: 'Chemical peels' },
      { value: 'NEUROMODULATORS', label: 'Neuromodulators (Botox-type)' },
      { value: 'DERMAL_FILLERS', label: 'Dermal fillers' },
      { value: 'LASER_RESURFACING', label: 'Laser / resurfacing' },
      { value: 'MICRONEEDLING', label: 'Microneedling' },
      { value: 'HYDRADERMABRASION', label: 'Hydradermabrasion' },
      { value: 'IPL_BBL', label: 'IPL / BBL' },
    ],
  },
  {
    label: 'Energy & light',
    options: [
      { value: 'RF_MICRONEEDLING', label: 'RF microneedling' },
      { value: 'RADIOFREQUENCY', label: 'Radiofrequency' },
      { value: 'ULTRASOUND_HIFU', label: 'Ultrasound / HIFU' },
      { value: 'LED_PHOTOTHERAPY', label: 'LED / phototherapy' },
    ],
  },
  {
    label: 'Injectables & regenerative',
    options: [
      { value: 'SKIN_BOOSTERS', label: 'Skin boosters' },
      { value: 'BIOSTIMULATORS', label: 'Biostimulators' },
      { value: 'PRP_PRF', label: 'PRP / PRF' },
    ],
  },
  {
    label: 'Resurfacing & other',
    options: [
      { value: 'MICRODERMABRASION', label: 'Microdermabrasion' },
      { value: 'DERMAPLANING', label: 'Dermaplaning' },
      { value: 'THREAD_LIFTS', label: 'Thread lifts' },
      { value: 'SURGERY', label: 'Surgery' },
      { value: 'OTHER', label: 'Other' },
    ],
  },
]
const PRO_TREATMENTS: Option[] = PRO_GROUPS.flatMap((g) => g.options)

const FREQUENCY_OPTIONS: { value: ToolUsageFrequency; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'OCCASIONALLY', label: 'Now & then' },
  { value: 'ONCE', label: 'Rarely' },
]

const LAST_USED_OPTIONS: { value: ToolLastUsed; label: string }[] = [
  { value: 'WITHIN_WEEK', label: 'This week' },
  { value: 'WITHIN_MONTH', label: 'This month' },
  { value: 'ONE_TO_SIX_MONTHS', label: '1–6 mo' },
  { value: 'OVER_SIX_MONTHS', label: '6+ mo' },
]

// Regular use implies a recent session, so "When was the last time?" is
// skipped and answered for the user.
const isRegular = (f: ToolUsageFrequency | null) => f === 'DAILY' || f === 'WEEKLY'

// ─── Face zones ───────────────────────────────────────────────

const ZONE_LABELS: Record<string, string> = {
  forehead: 'Forehead',
  under_eyes: 'Under-eyes',
  nose: 'Nose',
  cheeks: 'Cheeks',
  jawline: 'Jawline',
  chin: 'Chin',
  neck: 'Neck',
}
const FACE_ZONES = ['forehead', 'under_eyes', 'nose', 'cheeks', 'jawline', 'chin']
const FULL = FACE_ZONES
const FULL_NECK = [...FACE_ZONES, 'neck']

// Usual treatment areas, keyed by type. Anything not listed (fillers,
// surgery, Other) varies too much to guess and starts empty.
const HOME_DEFAULTS: Partial<Record<HomeDeviceType, string[]>> = {
  LED_THERAPY: FULL,
  MICROCURRENT: FULL,
  RF_DEVICE: FULL,
  MICRONEEDLING: FULL,
  CLEANSING_DEVICE: FULL,
  DERMAPLANING: FULL,
  HIGH_FREQUENCY_WAND: FULL,
  ULTRASONIC_DEVICE: FULL,
  MICRODERMABRASION: FULL,
  PORE_VACUUM: ['forehead', 'nose', 'chin'],
  FACIAL_STEAMER: FULL,
  IPL_LIGHT_DEVICE: FULL,
  GUA_SHA: FULL_NECK,
  FACIAL_ROLLER: FULL,
}
const PRO_DEFAULTS: Partial<Record<ProfessionalTreatmentType, string[]>> = {
  FACIALS: FULL,
  CHEMICAL_PEELS: FULL,
  NEUROMODULATORS: ['forehead'],
  LASER_RESURFACING: FULL,
  HYDRADERMABRASION: FULL,
  IPL_BBL: FULL,
  RF_MICRONEEDLING: FULL,
  ULTRASOUND_HIFU: FULL_NECK,
  LED_PHOTOTHERAPY: FULL,
  SKIN_BOOSTERS: FULL,
  BIOSTIMULATORS: FULL,
  PRP_PRF: FULL,
  THREAD_LIFTS: ['cheeks', 'jawline'],
}
const defaultsFor = (kind: Kind, type: string): string[] | undefined =>
  kind === 'home'
    ? HOME_DEFAULTS[type as HomeDeviceType]
    : PRO_DEFAULTS[type as ProfessionalTreatmentType]

// Answers saved by the previous version of this screen may hold `full_face`.
const normalizeZones = (zones: string[]) =>
  zones.includes('full_face')
    ? [...new Set([...zones.filter((z) => z !== 'full_face'), ...FACE_ZONES])]
    : zones
const isFullFace = (zones: string[]) => FACE_ZONES.every((z) => zones.includes(z))
const zoneText = (zones: string[]) =>
  !zones.length
    ? ''
    : isFullFace(zones)
      ? 'Full face' + (zones.includes('neck') ? ' + neck' : '')
      : zones.map((z) => ZONE_LABELS[z] ?? z).join(', ')

// ─── Shared item type ─────────────────────────────────────────

export type ToolItemState = {
  type: string
  frequency: ToolUsageFrequency | null
  lastUsed: ToolLastUsed | null
  faceAreas: string[]
  /** Areas were pre-filled from the usual ones and not yet touched. UI only. */
  suggested?: boolean
}

const answeredCount = (i: ToolItemState) =>
  Number(i.frequency != null) +
  Number(i.frequency != null && (isRegular(i.frequency) || i.lastUsed != null)) +
  Number(normalizeZones(i.faceAreas).length > 0)
const isComplete = (i: ToolItemState) => answeredCount(i) === 3

type Props = {
  homeDevices: ToolItemState[]
  professionalTreatments: ToolItemState[]
  onHomeDevicesChange: (v: ToolItemState[]) => void
  onProfessionalTreatmentsChange: (v: ToolItemState[]) => void
  onContinue: () => void
  onBack: () => void
}

type Pick = { id: string; kind: Kind; item: ToolItemState; label: string }

const pickId = (kind: Kind, type: string) => `${kind}:${type}`

// ─── Progress ring ────────────────────────────────────────────

function Ring({ item }: { item: ToolItemState }) {
  if (isComplete(item)) {
    return (
      <svg className="st-ring" viewBox="0 0 26 26" aria-hidden="true">
        <circle cx="13" cy="13" r="10" style={{ stroke: 'var(--st-ok)', opacity: 0.4 }} />
        <text x="13" y="17.5" textAnchor="middle">
          ✓
        </text>
      </svg>
    )
  }
  const c = 2 * Math.PI * 10
  return (
    <svg className="st-ring" viewBox="0 0 26 26" aria-hidden="true">
      <circle className="st-ring-bg" cx="13" cy="13" r="10" />
      <circle
        className="st-ring-fg"
        cx="13"
        cy="13"
        r="10"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - answeredCount(item) / 3)}
        transform="rotate(-90 13 13)"
      />
    </svg>
  )
}

// ─── Face map ─────────────────────────────────────────────────

function FaceMap({
  zones,
  suggested,
  onToggle,
}: {
  zones: string[]
  suggested: boolean
  onToggle: (zone: string) => void
}) {
  const zoneProps = (key: string) => ({
    className: `st-zone${zones.includes(key) ? ' on' : ''}`,
    tabIndex: 0,
    role: 'checkbox',
    'aria-checked': zones.includes(key),
    'aria-label': ZONE_LABELS[key],
    onClick: () => onToggle(key),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        onToggle(key)
      }
    },
  })

  return (
    <svg
      className={`st-face${suggested ? ' suggested' : ''}`}
      viewBox="0 0 200 262"
      role="group"
      aria-label="Face areas"
    >
      <path
        className="st-face-outline"
        d="M100 18C152 18 170 60 167 112C164 162 148 204 100 222C52 204 36 162 33 112C30 60 48 18 100 18Z"
      />
      <path className="st-face-outline" d="M78 216V258M122 216V258" />
      <path className="st-face-deco" d="M60 104q12-7 24 0M116 104q12-7 24 0M88 172q12 7 24 0" />
      <g {...zoneProps('neck')}>
        <rect x="80" y="226" width="40" height="32" rx="6" />
      </g>
      <g {...zoneProps('forehead')}>
        <ellipse cx="100" cy="62" rx="50" ry="22" />
      </g>
      <g {...zoneProps('under_eyes')}>
        <ellipse cx="72" cy="121" rx="17" ry="6" />
        <ellipse cx="128" cy="121" rx="17" ry="6" />
      </g>
      <g {...zoneProps('nose')}>
        <ellipse cx="100" cy="138" rx="11" ry="21" />
      </g>
      <g {...zoneProps('cheeks')}>
        <ellipse cx="63" cy="152" rx="18" ry="19" />
        <ellipse cx="137" cy="152" rx="18" ry="19" />
      </g>
      <g {...zoneProps('jawline')}>
        <ellipse cx="60" cy="190" rx="22" ry="7" transform="rotate(52 60 190)" />
        <ellipse cx="140" cy="190" rx="22" ry="7" transform="rotate(-52 140 190)" />
      </g>
      <g {...zoneProps('chin')}>
        <ellipse cx="100" cy="203" rx="17" ry="9" />
      </g>
    </svg>
  )
}

// ─── One scale question (segmented radio row) ─────────────────

function Scale<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T | null
  onChange: (v: T) => void
}) {
  return (
    <div className="st-q">
      <span className="st-qlabel">{label}</span>
      <div
        className="st-scale"
        role="radiogroup"
        aria-label={label}
        style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Expanded body of a details row ───────────────────────────

function DetailsBody({
  pick,
  pulse,
  hasOtherIncomplete,
  onPatch,
  onConfirm,
}: {
  pick: Pick
  pulse: boolean
  hasOtherIncomplete: boolean
  onPatch: (patch: Partial<ToolItemState>, answered: boolean) => void
  onConfirm: () => void
}) {
  const { item, kind } = pick
  const zones = normalizeZones(item.faceAreas)
  const defaults = defaultsFor(kind, item.type)
  const suggested = !!item.suggested
  const verb = kind === 'home' ? 'use it' : 'have it'
  const lower = pick.label.split(' (')[0].toLowerCase()

  const toggleZone = (z: string) =>
    onPatch(
      {
        suggested: false,
        faceAreas: zones.includes(z) ? zones.filter((x) => x !== z) : [...zones, z],
      },
      false
    )
  const toggleFull = () =>
    onPatch(
      {
        suggested: false,
        faceAreas: isFullFace(zones)
          ? zones.filter((z) => z === 'neck')
          : [...new Set([...zones, ...FACE_ZONES])],
      },
      false
    )

  return (
    <div className="st-body">
      <Scale
        label={`How often do you ${verb}?`}
        options={FREQUENCY_OPTIONS}
        value={item.frequency}
        onChange={(f) =>
          onPatch(
            {
              frequency: f,
              // As in the template: regular use clears the answer (the payload
              // sends WITHIN_WEEK), and leaving regular use asks it afresh.
              lastUsed: isRegular(f) || isRegular(item.frequency) ? null : item.lastUsed,
            },
            true
          )
        }
      />

      {item.frequency != null && !isRegular(item.frequency) && (
        <Scale
          label="When was the last time?"
          options={LAST_USED_OPTIONS}
          value={item.lastUsed}
          onChange={(l) => onPatch({ lastUsed: l }, true)}
        />
      )}
      {isRegular(item.frequency) && (
        <span className="st-skip-note">
          Regular use, so we won&apos;t ask when you last had it.
        </span>
      )}

      <div className="st-q">
        <span className="st-qlabel">Which areas?</span>
        {suggested && defaults && (
          <div className={`st-suggest${pulse ? ' pulse' : ''}`}>
            <span className="st-spark" aria-hidden="true">
              ✦
            </span>
            {isFullFace(defaults) ? (
              <span>
                We&apos;ve filled in <b>{zoneText(defaults).toLowerCase()}</b>, the usual for{' '}
                {lower}. Treat a smaller area? Tap to change it.
              </span>
            ) : (
              <span>
                We&apos;ve filled in <b>{zoneText(defaults).toLowerCase()}</b>, where {lower} is
                usually done. Tap the face to change it.
              </span>
            )}
          </div>
        )}
        {!defaults && !zones.length && (
          <span className="st-varies">
            This one varies from person to person. Tap where you&apos;ve had it.
          </span>
        )}

        <div className="st-face-wrap">
          <FaceMap zones={zones} suggested={suggested} onToggle={toggleZone} />
          <div className="st-zone-side">
            <div className={`st-zone-list${zones.length ? '' : ' empty'}`}>
              {zones.length ? zoneText(zones) : 'No areas yet'}
            </div>
            {suggested && <span className="st-tag">Suggested</span>}
            <button
              type="button"
              className="st-pill"
              aria-pressed={isFullFace(zones)}
              onClick={toggleFull}
            >
              Full face
            </button>
            {suggested ? (
              <button type="button" className="st-confirm" onClick={onConfirm}>
                Looks right{hasOtherIncomplete ? ', next' : ''}
              </button>
            ) : (
              <span className="st-hint">Tap an area to add or remove it</span>
            )}
          </div>
        </div>
      </div>
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
  const [tab, setTab] = useState<Kind>('home')
  const [showAllPro, setShowAllPro] = useState(false)
  const [none, setNone] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  // The last pick added — its "we've filled in" note pulses once.
  const [freshId, setFreshId] = useState<string | null>(null)
  const tabsId = useId()
  // createPortal needs a real <body> — only available after mount.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )

  useEffect(() => {
    const node = rootRef.current
    if (!node) return
    const reduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

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

  const listFor = (kind: Kind) => (kind === 'home' ? homeDevices : professionalTreatments)
  const setListFor = (kind: Kind, v: ToolItemState[]) =>
    kind === 'home' ? onHomeDevicesChange(v) : onProfessionalTreatmentsChange(v)
  const labelFor = (kind: Kind, type: string) =>
    (kind === 'home' ? HOME_DEVICES : PRO_TREATMENTS).find((o) => o.value === type)?.label ?? type

  const toPicks = (home: ToolItemState[], pro: ToolItemState[]): Pick[] => [
    ...home.map((item) => ({
      id: pickId('home', item.type),
      kind: 'home' as const,
      item,
      label: labelFor('home', item.type),
    })),
    ...pro.map((item) => ({
      id: pickId('pro', item.type),
      kind: 'pro' as const,
      item,
      label: labelFor('pro', item.type),
    })),
  ]
  const picks = toPicks(homeDevices, professionalTreatments)
  const doneCount = picks.filter((p) => isComplete(p.item)).length
  const allComplete = doneCount === picks.length

  // Opens the next unfinished row once the current one is done.
  const openNextAfter = (id: string, next: Pick[], delay: number) => {
    const nxt = next.find((p) => p.id !== id && !isComplete(p.item))
    window.setTimeout(() => {
      setOpenId(nxt ? nxt.id : null)
      if (nxt && window.innerWidth < 1024) {
        document
          .querySelector(`[data-item="${CSS.escape(nxt.id)}"]`)
          ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }, delay)
  }

  const togglePick = (kind: Kind, type: string) => {
    const id = pickId(kind, type)
    const list = listFor(kind)
    if (list.some((i) => i.type === type)) {
      setListFor(
        kind,
        list.filter((i) => i.type !== type)
      )
      if (openId === id) setOpenId(null)
      return
    }
    const defaults = defaultsFor(kind, type)
    setListFor(kind, [
      ...list,
      {
        type,
        frequency: null,
        lastUsed: null,
        faceAreas: defaults ? [...defaults] : [],
        suggested: !!defaults,
      },
    ])
    setNone(false)
    setFreshId(id)
    const current = picks.find((p) => p.id === openId)
    if (!current || isComplete(current.item)) setOpenId(id)
  }

  const patchPick = (pick: Pick, patch: Partial<ToolItemState>, answered: boolean) => {
    const nextItem = { ...pick.item, ...patch }
    const nextList = listFor(pick.kind).map((i) => (i.type === pick.item.type ? nextItem : i))
    setListFor(pick.kind, nextList)
    setFreshId(null)
    if (answered && isComplete(nextItem) && !nextItem.suggested) {
      const next =
        pick.kind === 'home'
          ? toPicks(nextList, professionalTreatments)
          : toPicks(homeDevices, nextList)
      openNextAfter(pick.id, next, 450)
    }
  }

  const confirmPick = (pick: Pick) => {
    patchPick(pick, { suggested: false }, false)
    if (isComplete(pick.item)) openNextAfter(pick.id, picks, 250)
  }

  const toggleNone = () => {
    const next = !none
    setNone(next)
    if (next) {
      onHomeDevicesChange([])
      onProfessionalTreatmentsChange([])
      setOpenId(null)
    }
  }

  const handleContinue = () => {
    if (!allComplete) {
      setError('Please answer the questions for each item you selected.')
      return
    }
    setError(null)
    const toPayload = (i: ToolItemState) => ({
      frequency: i.frequency as ToolUsageFrequency,
      lastUsed: (isRegular(i.frequency) ? 'WITHIN_WEEK' : i.lastUsed) as ToolLastUsed,
      faceAreas: normalizeZones(i.faceAreas),
    })
    startTransition(async () => {
      try {
        await saveToolsAndTreatments({
          homeDevices: homeDevices.map((i) => ({
            type: i.type as HomeDeviceType,
            ...toPayload(i),
          })),
          professionalTreatments: professionalTreatments.map((i) => ({
            type: i.type as ProfessionalTreatmentType,
            ...toPayload(i),
          })),
        })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  const chip = (kind: Kind, o: Option) => {
    const selected = listFor(kind).some((i) => i.type === o.value)
    return (
      <button
        key={o.value}
        type="button"
        className="st-chip"
        aria-pressed={selected}
        onClick={() => togglePick(kind, o.value)}
      >
        <span className="st-plus" aria-hidden="true">
          +
        </span>
        {o.label}
      </button>
    )
  }

  const summary = (item: ToolItemState) => {
    const bits: ReactNode[] = []
    const zones = normalizeZones(item.faceAreas)
    if (item.frequency) {
      bits.push(FREQUENCY_OPTIONS.find((o) => o.value === item.frequency)?.label)
    }
    if (item.frequency && !isRegular(item.frequency) && item.lastUsed) {
      bits.push(
        'last ' + LAST_USED_OPTIONS.find((o) => o.value === item.lastUsed)?.label.toLowerCase()
      )
    }
    if (zones.length) {
      bits.push(
        <>
          {zoneText(zones)}
          {item.suggested && <em> (suggested)</em>}
        </>
      )
    }
    if (!bits.length) return 'Add details'
    return bits.map((b, i) => (
      <span key={i}>
        {i > 0 && ' · '}
        {b}
      </span>
    ))
  }

  return (
    <div ref={rootRef}>
      {/* Full-bleed background — the treatment-room photo from
          templates/stepTreatment.html (framing and scrim in stepTools.css).
          Portaled to <body> to escape the content column's transform. */}
      {mounted &&
        createPortal(
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
              backgroundColor: '#0b0a09',
            }}
          >
            <div className="step-tools-frame">
              <Image
                src="/images/onboarding/stepTreatment/onboarding-step-treatment.webp"
                alt=""
                fill
                priority
                sizes="100vw"
                className="step-tools-image"
              />
            </div>
            <div className="step-tools-scrim" />
          </div>,
          document.body
        )}

      <div className="st-root">
        <div className="st-grid">
          <div className="st-left">
            <div data-reveal className="st-intro">
              <span className="st-eyebrow">Last step · Your routine</span>
              <h2 className="st-title">Any tools or treatments?</h2>
              <p className="st-sub">
                Tap everything you use. We&apos;ll pre-fill the usual details, so you only change
                what&apos;s different.
              </p>
            </div>

            {/* ── Picker ── */}
            <section
              data-reveal
              className="st-panel st-glass"
              aria-label="Pick tools and treatments"
            >
              <div
                className="st-seg"
                role="tablist"
                aria-label="Where"
                onKeyDown={(e) => {
                  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
                  e.preventDefault()
                  const next: Kind =
                    e.key === 'Home'
                      ? 'home'
                      : e.key === 'End'
                        ? 'pro'
                        : tab === 'home'
                          ? 'pro'
                          : 'home'
                  setTab(next)
                  document.getElementById(`${tabsId}-${next}`)?.focus()
                }}
              >
                {(['home', 'pro'] as const).map((k) => {
                  const count = listFor(k).length
                  return (
                    <button
                      key={k}
                      type="button"
                      role="tab"
                      id={`${tabsId}-${k}`}
                      aria-selected={tab === k}
                      aria-controls={`${tabsId}-panel`}
                      tabIndex={tab === k ? 0 : -1}
                      onClick={() => setTab(k)}
                    >
                      {k === 'home' ? 'At home' : 'In clinic'}
                      {count > 0 && <span className="st-badge">{count}</span>}
                    </button>
                  )
                })}
              </div>

              <div
                className="st-chips"
                role="tabpanel"
                id={`${tabsId}-panel`}
                aria-labelledby={`${tabsId}-${tab}`}
              >
                {tab === 'home'
                  ? HOME_DEVICES.map((o) => chip('home', o))
                  : (showAllPro ? PRO_GROUPS : PRO_GROUPS.slice(0, 1)).map((g) => (
                      <div key={g.label} className="st-chips-group">
                        {showAllPro && <span className="st-group-label">{g.label}</span>}
                        {g.options.map((o) => chip('pro', o))}
                      </div>
                    ))}
                {tab === 'pro' && (
                  <button
                    type="button"
                    className="st-linkbtn"
                    onClick={() => setShowAllPro((v) => !v)}
                  >
                    {showAllPro ? 'Show fewer' : `Show all ${PRO_TREATMENTS.length} treatments`}
                  </button>
                )}
              </div>

              <button type="button" className="st-none" aria-pressed={none} onClick={toggleNone}>
                I don&apos;t use any of these
              </button>
            </section>
          </div>

          {/* ── Details ── */}
          <section data-reveal className="st-panel st-glass st-details" aria-label="Your details">
            <div className="st-details-head">
              <h3>Your details</h3>
              {picks.length > 0 && (
                <span className="st-eyebrow">
                  {doneCount} of {picks.length} done
                </span>
              )}
            </div>

            <div className="st-list">
              {none ? (
                <div className="st-empty">Nothing to add. Tap Next to continue.</div>
              ) : !picks.length ? (
                <div className="st-empty">
                  Pick a tool or treatment and its questions appear here.
                </div>
              ) : (
                picks.map((p) => {
                  const open = openId === p.id
                  return (
                    <div key={p.id} className={`st-item${open ? ' open' : ''}`} data-item={p.id}>
                      <button
                        type="button"
                        className="st-row"
                        aria-expanded={open}
                        onClick={() => setOpenId(open ? null : p.id)}
                      >
                        <Ring item={p.item} />
                        <span className="st-meta">
                          <span className="st-name">
                            {p.label}{' '}
                            <span className="st-kind">{p.kind === 'home' ? 'Home' : 'Clinic'}</span>
                          </span>
                          <span className="st-summary">{summary(p.item)}</span>
                        </span>
                        <span className="st-chev" aria-hidden="true">
                          ⌄
                        </span>
                      </button>
                      {open && (
                        <DetailsBody
                          pick={p}
                          pulse={freshId === p.id}
                          hasOtherIncomplete={picks.some(
                            (q) => q.id !== p.id && !isComplete(q.item)
                          )}
                          onPatch={(patch, answered) => patchPick(p, patch, answered)}
                          onConfirm={() => confirmPick(p)}
                        />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </section>
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
