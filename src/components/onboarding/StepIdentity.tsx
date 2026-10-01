'use client'

import { useRef, useEffect, useState, useTransition, useMemo, type KeyboardEvent } from 'react'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { saveIdentity } from '@/app/actions/onboarding'
import { PREFERRED_NAME_MAX_LENGTH, birthYearBounds } from '@/lib/onboarding-rules'
import type { GenderIdentity } from '@prisma/client'
import './stepProfile.css'

// Screen 1 — profile (templates/stepProfile). Three numbered question cards
// (name, identity, birth date) under a sticky stepper, with a live summary
// column on wide screens. The birth year is picked on a scrollable ruler.

const OPTIONS: { value: GenderIdentity; label: string }[] = [
  { value: 'WOMAN', label: 'Woman' },
  { value: 'MAN', label: 'Man' },
  { value: 'NON_BINARY', label: 'Non-binary' },
  { value: 'OTHER', label: 'Another identity' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
]

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** Width of one year on the ruler, in px — must match `.sp-yr` in the CSS. */
const YEAR_PX = 14
/** Where the ruler rests before the user has picked a year. */
const DEFAULT_RULER_YEAR = 1990

const PERSON_ICON = (
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </>
)

type CardId = 'name' | 'identity' | 'birth'
const STEPS: { id: CardId; label: string }[] = [
  { id: 'name', label: 'Name' },
  { id: 'identity', label: 'Identity' },
  { id: 'birth', label: 'Birth date' },
]

type Props = {
  value: string
  onChange: (v: string) => void
  preferredName: string
  onPreferredNameChange: (v: string) => void
  birthMonth: string
  onBirthMonthChange: (v: string) => void
  birthYear: string
  onBirthYearChange: (v: string) => void
  onContinue: () => void
  onBack?: () => void
}

/** Closest ancestor that scrolls vertically — the wizard's content area. */
function scrollParent(node: HTMLElement | null): HTMLElement | null {
  for (let el = node?.parentElement ?? null; el; el = el.parentElement) {
    const oy = getComputedStyle(el).overflowY
    if (oy === 'auto' || oy === 'scroll') return el
  }
  return null
}

export function StepIdentity({
  value,
  onChange,
  preferredName,
  onPreferredNameChange,
  birthMonth,
  onBirthMonthChange,
  birthYear,
  onBirthYearChange,
  onContinue,
  onBack,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const pillsRef = useRef<HTMLDivElement>(null)
  const monthsRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState<CardId | null>(null)
  const [stuck, setStuck] = useState(false)

  const { min: minYear, max: maxYear } = useMemo(() => birthYearBounds(), [])
  const clampYear = (y: number) => Math.max(minYear, Math.min(maxYear, y))

  const month = birthMonth ? Number(birthMonth) - 1 : null // 0-based
  const year = birthYear ? Number(birthYear) : null
  // Year under the needle while scrolling; becomes the answer once settled.
  const [rulerYear, setRulerYear] = useState(() => clampYear(year ?? DEFAULT_RULER_YEAR))

  // Ruler gesture state — refs, since they change on every scroll frame.
  const userMoved = useRef(false)
  // Mouse drag in progress; `moved` stays false for a plain click.
  const drag = useRef<{ x: number; s: number; moved: boolean } | null>(null)
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null)

  const trimmedName = preferredName.trim()
  const ok = {
    name: trimmedName.length > 0,
    identity: Boolean(value),
    birth: month !== null && year !== null,
  }
  const canContinue = ok.name && ok.identity && ok.birth

  const now = new Date()
  const age =
    year === null
      ? null
      : now.getFullYear() - year - (month !== null && month > now.getMonth() ? 1 : 0)

  // ─── Effects ──────────────────────────────────────────────────
  useEffect(() => {
    const node = rootRef.current
    if (!node) return
    const ctx = gsap.context(() => {
      const blocks = node.querySelectorAll('[data-reveal]')
      if (blocks.length) {
        gsap.fromTo(
          blocks,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, stagger: 0.09, ease: 'power3.out', delay: 0.15 }
        )
      }
    }, node)
    return () => ctx.revert()
  }, [])

  // Park the ruler on the saved (or default) year without counting it as a pick.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const raf = requestAnimationFrame(() => {
      track.scrollLeft = (rulerYear - minYear) * YEAR_PX
    })
    return () => cancelAnimationFrame(raf)
    // Mount only: later positions are driven by the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(
    () => () => {
      if (settle.current) clearTimeout(settle.current)
    },
    []
  )

  // The stepper gets a hairline once it is pinned to the top of the scroll area.
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), {
      root: scrollParent(sentinel),
    })
    io.observe(sentinel)
    return () => io.disconnect()
  }, [])

  // ─── Handlers ─────────────────────────────────────────────────
  const commitYear = (y: number) => {
    onBirthYearChange(String(y))
    setError(null)
  }

  const handleTrackScroll = () => {
    const track = trackRef.current
    if (!track) return
    const y = clampYear(minYear + Math.round(track.scrollLeft / YEAR_PX))
    setRulerYear(y)
    if (settle.current) clearTimeout(settle.current)
    settle.current = setTimeout(() => {
      if (userMoved.current) commitYear(y)
    }, 120)
  }

  /** Glide the ruler to `y` and take it as the answer. */
  const goToYear = (target: number) => {
    userMoved.current = true
    const y = clampYear(target)
    trackRef.current?.scrollTo({ left: (y - minYear) * YEAR_PX, behavior: 'smooth' })
    commitYear(y)
  }
  const nudge = (d: number) => goToYear((year ?? rulerYear) + d)

  const markMoved = () => {
    userMoved.current = true
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const track = e.currentTarget
    drag.current = { x: e.clientX, s: track.scrollLeft, moved: false }
    track.classList.add('drag')
    track.setPointerCapture(e.pointerId)
  }
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    // A few px of jitter during a click is not a drag.
    if (!d.moved && Math.abs(dx) < 3) return
    if (!d.moved) {
      d.moved = true
      markMoved()
    }
    e.currentTarget.scrollLeft = d.s - dx
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    drag.current = null
    const track = e.currentTarget
    track.classList.remove('drag')
    // A plain click picks nothing — otherwise it would silently answer with
    // the default year.
    if (!d.moved) return
    // Read the year from the DOM: the last scroll event (and so rulerYear)
    // can lag a frame behind the final pointermove.
    goToYear(minYear + Math.round(track.scrollLeft / YEAR_PX))
  }

  const handleRulerKey = (e: KeyboardEvent) => {
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      goToYear(e.key === 'Home' ? minYear : maxYear)
      return
    }
    const step = (
      { ArrowLeft: -1, ArrowRight: 1, PageDown: -10, PageUp: 10 } as Record<string, number>
    )[e.key]
    if (!step) return
    e.preventDefault()
    nudge(step)
  }

  /** Arrow keys move through a radiogroup and select as they go (WAI-ARIA).
   *  Wraps around at both ends. */
  const radioKeys = (
    e: KeyboardEvent,
    index: number,
    count: number,
    select: (i: number) => void,
    group: HTMLDivElement | null
  ) => {
    const delta =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + count) % count
    select(next)
    group?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus()
  }

  const pickIdentity = (i: number) => {
    onChange(OPTIONS[i].value)
    setError(null)
  }
  const pickMonth = (i: number) => {
    onBirthMonthChange(String(i + 1))
    setError(null)
  }

  /** Stepper: jump to a card and focus its first control. */
  const goTo = (id: CardId) => {
    const card = rootRef.current?.querySelector<HTMLElement>(`[data-card="${id}"]`)
    if (!card) return
    card.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const target = card.querySelector<HTMLElement>('input, [tabindex="0"], button')
    if (target) setTimeout(() => target.focus({ preventScroll: true }), 400)
  }

  const handleContinue = () => {
    if (!trimmedName) {
      setError('Please tell us what to call you.')
      return
    }
    if (!value) {
      setError('Please choose how you identify to continue.')
      return
    }
    if (month === null || year === null) {
      setError('Please select both your birth month and year.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveIdentity({
          genderIdentity: value as GenderIdentity,
          preferredName: trimmedName,
          birthMonth: month + 1,
          birthYear: year,
        })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  // ─── Derived display ──────────────────────────────────────────
  const answered = [ok.name, ok.identity, month !== null, year !== null].filter(Boolean).length
  const pct = answered * 25
  const firstOpen = STEPS.findIndex((s) => !ok[s.id])
  // Fill the stepper line up to the furthest step finished in a row.
  const run = ok.name ? (ok.identity ? (ok.birth ? 3 : 2) : 1) : 0
  const identityIndex = OPTIONS.findIndex((o) => o.value === value)
  const identityLabel =
    value === 'PREFER_NOT_TO_SAY'
      ? 'Private'
      : (OPTIONS.find((o) => o.value === value)?.label ?? null)
  const born =
    year !== null
      ? `${month !== null ? MONTHS[month].slice(0, 3) + ' ' : ''}${year}`
      : month !== null
        ? MONTHS[month]
        : null

  const cardProps = (id: CardId) => ({
    'data-card': id,
    className: `sp-card${ok[id] ? ' ok' : ''}${focused === id ? ' focus' : ''}`,
    onFocus: () => setFocused(id),
  })

  const ticks = useMemo(() => {
    const out = []
    for (let y = minYear; y <= maxYear; y++) {
      out.push(
        <div key={y} className={`sp-yr${y % 10 === 0 ? ' ten' : y % 5 === 0 ? ' five' : ''}`}>
          <i />
          {y % 10 === 0 && <small>{y}</small>}
        </div>
      )
    }
    return out
  }, [minYear, maxYear])

  const summaryRow = (icon: React.ReactNode, label: string, v: string | null) => (
    <div className="sp-r">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {icon}
      </svg>
      <span>{label}</span>
      <b className={v === null ? 'empty' : undefined}>{v ?? '—'}</b>
    </div>
  )

  return (
    <div ref={rootRef}>
      <div className="sp-root">
        <div data-reveal>
          <h2 className="sp-title">Your Profile</h2>
          <p className="sp-sub">Tell us a bit about you.</p>
        </div>

        <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
        <nav className={`sp-stepper${stuck ? ' stuck' : ''}`} aria-label="Progress">
          <div
            className="sp-fill"
            style={{ width: `calc((100% - 8px) * ${Math.max(0, run - 1) / 3})` }}
          />
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`sp-st${ok[s.id] ? ' done' : i === firstOpen ? ' active' : ''}`}
              onClick={() => goTo(s.id)}
            >
              <span className="n">{i + 1}</span>
              {s.label}
            </button>
          ))}
        </nav>

        <div className="sp-grid">
          <div className="sp-col" data-reveal>
            {/* 1 — name */}
            <section {...cardProps('name')}>
              <div className="sp-ch">
                <span className="num">1</span>
                <h3>What should we call you?</h3>
                <span className="tick">✓ Done</span>
              </div>
              <label className="sp-field">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {PERSON_ICON}
                </svg>
                <input
                  type="text"
                  value={preferredName}
                  onChange={(e) => {
                    onPreferredNameChange(e.target.value)
                    setError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return
                    e.preventDefault()
                    pillsRef.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus()
                  }}
                  placeholder="First name or nickname"
                  maxLength={PREFERRED_NAME_MAX_LENGTH}
                  autoComplete="given-name"
                  required
                  aria-required="true"
                  aria-label="What should we call you?"
                />
              </label>
            </section>

            {/* 2 — identity */}
            <section {...cardProps('identity')}>
              <div className="sp-ch">
                <span className="num">2</span>
                <h3>How do you identify?</h3>
                <span className="tick">✓ Done</span>
              </div>
              <div
                ref={pillsRef}
                className="sp-pills"
                role="radiogroup"
                aria-label="How do you identify?"
                aria-required="true"
              >
                {OPTIONS.map((o, i) => (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    className="sp-pill"
                    aria-checked={value === o.value}
                    tabIndex={(identityIndex < 0 ? 0 : identityIndex) === i ? 0 : -1}
                    onClick={() => pickIdentity(i)}
                    onKeyDown={(e) =>
                      radioKeys(e, i, OPTIONS.length, pickIdentity, pillsRef.current)
                    }
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </section>

            {/* 3 — birth date */}
            <section {...cardProps('birth')}>
              <div className="sp-ch">
                <span className="num">3</span>
                <h3>When were you born?</h3>
                <span className="tick">✓ Done</span>
              </div>
              <div>
                <div className="sp-lab">Month</div>
                <div
                  ref={monthsRef}
                  className="sp-months"
                  role="radiogroup"
                  aria-label="Birth month"
                  aria-required="true"
                >
                  {MONTHS.map((m, i) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      className="sp-mchip"
                      aria-checked={month === i}
                      aria-label={m}
                      tabIndex={(month ?? 0) === i ? 0 : -1}
                      onClick={() => pickMonth(i)}
                      onKeyDown={(e) =>
                        radioKeys(e, i, MONTHS.length, pickMonth, monthsRef.current)
                      }
                    >
                      {m.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="sp-lab">Year</div>
                <div className="sp-yearread">
                  <b className={year === null ? 'unset' : undefined}>{rulerYear}</b>
                  <span>{age !== null ? `${age} years old` : 'Slide to choose'}</span>
                </div>
                <div
                  className="sp-ruler"
                  tabIndex={0}
                  role="slider"
                  aria-label="Birth year"
                  aria-valuemin={minYear}
                  aria-valuemax={maxYear}
                  aria-valuenow={rulerYear}
                  aria-valuetext={year === null ? 'Not selected yet' : String(rulerYear)}
                  onKeyDown={handleRulerKey}
                >
                  <div className="sp-needle" />
                  <div
                    ref={trackRef}
                    className="sp-track"
                    // The parent slider is the single tab stop; keep Chrome from
                    // making this scroller a second one.
                    tabIndex={-1}
                    onScroll={handleTrackScroll}
                    onWheel={markMoved}
                    onTouchStart={markMoved}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                  >
                    {ticks}
                  </div>
                </div>
                <div className="sp-nudge">
                  <button type="button" aria-label="One year earlier" onClick={() => nudge(-1)}>
                    ‹
                  </button>
                  <button type="button" aria-label="One year later" onClick={() => nudge(1)}>
                    ›
                  </button>
                </div>
              </div>
            </section>
          </div>

          <aside className="sp-col sp-side" data-reveal>
            <section className="sp-card sp-gaugecard">
              <div>
                <h3 className="sp-sumh">Profile Summary</h3>
                <p className="sp-sump">Builds as you answer.</p>
              </div>
              <div className="sp-gauge">
                <svg viewBox="0 0 170 150" aria-hidden="true">
                  <path className="bgarc" d="M28 128 A70 70 0 1 1 142 128" />
                  <path
                    className="fgarc"
                    d="M28 128 A70 70 0 1 1 142 128"
                    pathLength={100}
                    style={{ strokeDashoffset: 100 - pct }}
                  />
                </svg>
                <div className="val">
                  <b>{pct}</b>
                  <span>
                    <i className={pct === 100 ? 'on' : undefined} />
                    {pct === 100 ? 'Complete' : pct ? `${answered} of 4 answered` : 'Not started'}
                  </span>
                </div>
              </div>
              <p className="sp-gcap">Profile complete, %</p>
            </section>

            <section className="sp-card">
              <h3 className="sp-sumh">Your Context</h3>
              <div className="sp-rows">
                {summaryRow(PERSON_ICON, 'Name', ok.name ? trimmedName : null)}
                {summaryRow(
                  <>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v10M7 12h10" />
                  </>,
                  'Identity',
                  identityLabel
                )}
                {summaryRow(
                  <>
                    <rect x="4" y="5" width="16" height="15" rx="2" />
                    <path d="M4 10h16M9 3v4M15 3v4" />
                  </>,
                  'Born',
                  born
                )}
                {summaryRow(
                  <path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9" />,
                  'Age',
                  age !== null ? `${age} years` : null
                )}
              </div>
            </section>
          </aside>
        </div>

        {error && (
          <p className="sp-error" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Back returns to the step 0 transition screen. */}
      <StepFooter
        onContinue={handleContinue}
        onBack={onBack}
        isLoading={isPending}
        continueDisabled={!canContinue}
      />
    </div>
  )
}
