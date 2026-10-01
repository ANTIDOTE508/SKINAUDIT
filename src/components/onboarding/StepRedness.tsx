'use client'

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from 'react'
import { StepFooter } from './StepFooter'
import { saveRedness } from '@/app/actions/onboarding'
import type { RednessPattern, FlushFadeSpeed } from '@prisma/client'
import './stepRedness.css'

// Screen 16 — redness, as question cards (templates/stepRedness). One card is
// open at a time; answered ones fold into summaries above it with an Edit
// link. Any answer but "No" asks where the redness shows; everyone answers
// the flushing triggers; the fade speed is skipped for "None of the above".

const PERSIST: { value: RednessPattern; label: string }[] = [
  { value: 'PERSISTENT', label: "Yes — it's there consistently" },
  { value: 'INTERMITTENT', label: 'Yes — but it comes and goes' },
  { value: 'OCCASIONAL', label: 'Occasionally' },
  { value: 'NONE', label: 'No' },
]

// Free-form multi-select — the option list is a UI concern, so no enum.
const AREAS: { value: string; label: string }[] = [
  { value: 'cheeks', label: 'Cheeks' },
  { value: 'nose', label: 'Nose' },
  { value: 'chin', label: 'Chin' },
  { value: 'forehead', label: 'Forehead' },
]
const areaLabel = (v: string) => AREAS.find((a) => a.value === v)?.label ?? v

// Stored values are unchanged from the previous version of this screen.
const TRIGGERS: { value: string; label: string; sub?: string; icon: React.ReactNode }[] = [
  {
    value: 'heat',
    label: 'Heat',
    sub: 'Warm rooms, hot drinks, hot showers',
    icon: (
      <>
        <path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0z" />
        <path d="M12 11v5" />
      </>
    ),
  },
  { value: 'exercise', label: 'Exercise', icon: <path d="M3 12h4l2-5 4 10 2-5h6" /> },
  {
    value: 'alcohol',
    label: 'Alcohol',
    icon: <path d="M8 3h8l-1 7a3 3 0 0 1-6 0L8 3zM12 13v7M8 20h8" />,
  },
  {
    value: 'spicy_food',
    label: 'Spicy food',
    icon: <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1 1 2 2 3 4 0-3-1-5 0-7z" />,
  },
  {
    value: 'cold_wind',
    label: 'Cold or wind',
    icon: <path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h8" />,
  },
  {
    value: 'stress_emotion',
    label: 'Stress',
    sub: 'Or strong emotions',
    icon: <path d="M13 3L6 13h5l-1 8 7-10h-5l1-8z" />,
  },
  {
    value: 'stinging_products',
    label: 'Skincare that stings',
    sub: 'Products that sting or burn',
    icon: <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />,
  },
]
const NONE = 'none'

const FADE: { value: FlushFadeSpeed; full: string; short: string; sub: string }[] = [
  { value: 'MINUTES', full: 'Within a few minutes', short: 'Minutes', sub: 'Gone quickly' },
  {
    value: 'UP_TO_HOUR',
    full: 'Within 30–60 minutes',
    short: 'Within the hour',
    sub: '30–60 minutes',
  },
  {
    value: 'HOURS_OR_MORE',
    full: 'It takes hours, or lingers into the next day',
    short: 'Hours or longer',
    sub: 'Lingers, maybe into the next day',
  },
]

type Key = 'persist' | 'areas' | 'triggers' | 'fade'
const SHORT: Record<Key, string> = {
  persist: 'Persistent redness',
  areas: 'Where it shows',
  triggers: 'What makes you flush',
  fade: 'How fast flushing fades',
}

type Props = {
  pattern: RednessPattern | null
  areas: string[]
  flushTriggers: string[]
  flushFadeSpeed: FlushFadeSpeed | null
  onPatternChange: (v: RednessPattern) => void
  onAreasChange: (v: string[]) => void
  onFlushTriggersChange: (v: string[]) => void
  onFlushFadeSpeedChange: (v: FlushFadeSpeed) => void
  onContinue: () => void
  onBack: () => void
}

export function StepRedness({
  pattern,
  areas,
  flushTriggers,
  flushFadeSpeed,
  onPatternChange,
  onAreasChange,
  onFlushTriggersChange,
  onFlushFadeSpeedChange,
  onContinue,
  onBack,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // Multi-selects are confirmed with their card's Continue button. On resume,
  // answers already on file count as confirmed.
  const [areasOk, setAreasOk] = useState(areas.length > 0)
  const [trigOk, setTrigOk] = useState(flushTriggers.length > 0)
  const [editing, setEditing] = useState<Key | null>(null)
  // After a multi-select Continue, the card stays open ~260ms before the
  // next one rises in (template timing); undefined = follow `active`.
  const [shown, setShown] = useState<Key | null | undefined>(undefined)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
  }, [])

  const none = flushTriggers.includes(NONE)
  const pickedTriggers = flushTriggers.filter((t) => t !== NONE)

  // The question list, with "?" placeholders for questions that may or may
  // not be asked yet — they count towards "Question n of N" only.
  const steps: string[] = [
    'persist',
    ...(pattern === null ? ['areas?'] : pattern !== 'NONE' ? ['areas'] : []),
    'triggers',
    ...(trigOk && !none ? ['fade'] : trigOk ? [] : ['fade?']),
  ]
  const realSteps = steps.filter((k) => !k.endsWith('?')) as Key[]
  const isDone = (k: Key) =>
    k === 'persist'
      ? pattern !== null
      : k === 'areas'
        ? areasOk && areas.length > 0
        : k === 'triggers'
          ? trigOk
          : flushFadeSpeed !== null
  const active: Key | null = editing ?? realSteps.find((k) => !isDone(k)) ?? null
  const open = shown === undefined ? active : shown

  const answer = (k: Key) =>
    k === 'persist'
      ? (PERSIST.find((p) => p.value === pattern)?.label ?? '')
      : k === 'areas'
        ? areas.map(areaLabel).join(', ')
        : k === 'triggers'
          ? none
            ? 'None of the above'
            : pickedTriggers.map((t) => TRIGGERS.find((x) => x.value === t)?.label ?? t).join(', ')
          : (FADE.find((f) => f.value === flushFadeSpeed)?.full ?? '')

  /**
   * Template timing: a pick re-renders at once (while editing, the edited
   * card stays open showing the new answer); a Continue holds the card. Then
   * after 260ms editing ends and the next open card rises in.
   */
  const advance = (hold: boolean) => {
    if (hold) setShown(open)
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(() => {
      setShown(undefined)
      setEditing(null)
      // On phones the next card can land below the fold.
      if (innerWidth < 1024) {
        requestAnimationFrame(() =>
          rootRef.current
            ?.querySelector('.sr-card')
            ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
        )
      }
    }, 260)
  }

  /* ---------- answers ---------- */

  const pickPersist = (v: RednessPattern) => {
    onPatternChange(v)
    if (v === 'NONE') {
      if (areas.length) onAreasChange([])
      setAreasOk(false)
    }
    advance(false)
  }

  const toggleArea = (v: string) =>
    onAreasChange(areas.includes(v) ? areas.filter((a) => a !== v) : [...areas, v])

  const toggleTrigger = (v: string) =>
    onFlushTriggersChange(
      pickedTriggers.includes(v) ? pickedTriggers.filter((t) => t !== v) : [...pickedTriggers, v],
    )

  const toggleNone = () => onFlushTriggersChange(none ? [] : [NONE])

  const confirmAreas = () => {
    setAreasOk(true)
    advance(true)
  }

  const confirmTriggers = () => {
    setTrigOk(true)
    if (none && flushFadeSpeed !== null) onFlushFadeSpeedChange(null as unknown as FlushFadeSpeed)
    advance(true)
  }

  const pickFade = (v: FlushFadeSpeed) => {
    onFlushFadeSpeedChange(v)
    advance(false)
  }

  const edit = (k: Key) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    setShown(undefined)
    setEditing(k)
    if (k === 'triggers') setTrigOk(false)
    if (k === 'areas') setAreasOk(false)
  }

  /** Arrow keys move focus through a radiogroup; Enter / Space picks. Picking
   *  on arrow would fold the card at the first key press. */
  const radioKeys = (e: KeyboardEvent<HTMLButtonElement>, i: number, count: number) => {
    const d =
      e.key === 'ArrowDown' || e.key === 'ArrowRight'
        ? 1
        : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
          ? -1
          : 0
    if (!d) return
    e.preventDefault()
    const next = (i + d + count) % count
    const radios = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    radios?.forEach((r, j) => (r.tabIndex = j === next ? 0 : -1))
    radios?.[next]?.focus()
  }

  /* ---------- next ---------- */

  const handleContinue = () => {
    if (active !== null || pattern === null) return
    setError(null)
    startTransition(async () => {
      try {
        await saveRedness({
          rednessPattern: pattern,
          rednessAreas: pattern !== 'NONE' ? areas : [],
          flushTriggers,
          flushFadeSpeed: none ? null : flushFadeSpeed,
        })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  /* ---------- cards ---------- */

  const head = (k: Key, q: string, hint?: string) => (
    <>
      <span className="sr-count">
        Question {steps.indexOf(k) + 1} of {steps.length}
      </span>
      <div>
        <h2>{q}</h2>
        {hint && <p className="sr-hint">{hint}</p>}
      </div>
    </>
  )

  const zoneProps = (k: string) => {
    const on = areas.includes(k)
    return {
      className: `sr-zone${on ? ' on' : ''}`,
      tabIndex: 0,
      role: 'checkbox',
      'aria-checked': on,
      'aria-label': areaLabel(k),
      onClick: () => toggleArea(k),
      onKeyDown: (e: KeyboardEvent<SVGGElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggleArea(k)
        }
      },
    }
  }

  const card = (k: Key) => {
    if (k === 'persist')
      return (
        <>
          {head(
            k,
            "Do you notice redness on your cheeks, nose, or chin that's there most of the time?",
            'Not related to a breakout, exercise, or heat.',
          )}
          <div className="sr-opts" role="radiogroup" aria-label={SHORT.persist}>
            {PERSIST.map((p, i) => {
              const on = pattern === p.value
              return (
                <button
                  key={p.value}
                  type="button"
                  className="sr-opt"
                  role="radio"
                  aria-checked={on}
                  tabIndex={on || (pattern === null && i === 0) ? 0 : -1}
                  onClick={() => pickPersist(p.value)}
                  onKeyDown={(e) => radioKeys(e, i, PERSIST.length)}
                >
                  <span className="dot" />
                  {p.label}
                </button>
              )
            })}
          </div>
        </>
      )

    if (k === 'areas')
      return (
        <>
          {head(k, 'Where is the redness most noticeable?', 'Tap the face or the names. Select all that apply.')}
          <div className="sr-face-wrap">
            <svg className="sr-face" viewBox="0 0 200 240" role="group" aria-label="Face areas">
              <path
                className="sr-face-outline"
                d="M100 18C152 18 170 60 167 112C164 162 148 204 100 222C52 204 36 162 33 112C30 60 48 18 100 18Z"
              />
              <path className="sr-face-deco" d="M60 104q12-7 24 0M116 104q12-7 24 0M88 176q12 7 24 0" />
              <g {...zoneProps('forehead')}>
                <ellipse cx="100" cy="62" rx="50" ry="22" />
              </g>
              <g {...zoneProps('nose')}>
                <ellipse cx="100" cy="136" rx="12" ry="24" />
              </g>
              <g {...zoneProps('cheeks')}>
                <ellipse cx="62" cy="150" rx="20" ry="22" />
                <ellipse cx="138" cy="150" rx="20" ry="22" />
              </g>
              <g {...zoneProps('chin')}>
                <ellipse cx="100" cy="203" rx="19" ry="10" />
              </g>
            </svg>
            <div>
              <div className="sr-zchips">
                {AREAS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    className="sr-zchip"
                    aria-pressed={areas.includes(a.value)}
                    onClick={() => toggleArea(a.value)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <p className="sr-sidehint">
                {areas.length ? `${areas.length} selected` : 'Nothing selected yet'}
              </p>
            </div>
          </div>
          <div className="sr-row-actions">
            <button type="button" className="sr-cont" disabled={!areas.length} onClick={confirmAreas}>
              Continue
            </button>
          </div>
        </>
      )

    if (k === 'triggers')
      return (
        <>
          {head(k, 'Does your face flush or turn red easily with any of these?', 'Select all that apply.')}
          <div className="sr-trig">
            {TRIGGERS.map((t) => (
              <button
                key={t.value}
                type="button"
                className="sr-tile"
                aria-pressed={pickedTriggers.includes(t.value)}
                onClick={() => toggleTrigger(t.value)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {t.icon}
                </svg>
                <b>{t.label}</b>
                {t.sub && <small>{t.sub}</small>}
              </button>
            ))}
            <button type="button" className="sr-tile none" aria-pressed={none} onClick={toggleNone}>
              <b>None of the above</b>
              <small>Doesn&apos;t flush easily</small>
            </button>
          </div>
          <div className="sr-row-actions">
            <span>
              {none
                ? 'No triggers'
                : pickedTriggers.length
                  ? `${pickedTriggers.length} selected`
                  : 'Pick at least one, or none'}
            </span>
            <button
              type="button"
              className="sr-cont"
              disabled={!none && !pickedTriggers.length}
              onClick={confirmTriggers}
            >
              Continue
            </button>
          </div>
        </>
      )

    const fi = FADE.findIndex((f) => f.value === flushFadeSpeed)
    return (
      <>
        {head(k, 'When flushing happens, how quickly does the redness usually fade?')}
        <div className="sr-fade">
          <div className="rail">
            <div className="fill" style={{ width: `${fi < 0 ? 0 : fi * 50}%` }} />
          </div>
          <div className="sr-stops" role="radiogroup" aria-label={SHORT.fade}>
            {FADE.map((f, i) => {
              const on = flushFadeSpeed === f.value
              return (
                <button
                  key={f.value}
                  type="button"
                  className="sr-stop"
                  role="radio"
                  aria-checked={on}
                  aria-label={f.full}
                  tabIndex={on || (fi < 0 && i === 0) ? 0 : -1}
                  onClick={() => pickFade(f.value)}
                  onKeyDown={(e) => radioKeys(e, i, FADE.length)}
                >
                  <span className="pt" />
                  <b>{f.short}</b>
                  <small>{f.sub}</small>
                </button>
              )
            })}
          </div>
        </div>
      </>
    )
  }

  const items: React.ReactNode[] = []
  for (const k of realSteps) {
    if (k === open) {
      items.push(
        <section key={k} className="sr-card sr-glass" aria-label={SHORT[k]}>
          {card(k)}
        </section>,
      )
      continue
    }
    if (!isDone(k)) break // later questions stay hidden until they're reached
    items.push(
      <div key={k} className="sr-done sr-glass">
        <span className="sr-tick" aria-hidden="true">
          ✓
        </span>
        <div className="txt">
          <div className="q">{SHORT[k]}</div>
          <div className="a">{answer(k)}</div>
        </div>
        <button type="button" className="sr-edit" aria-label={`Edit ${SHORT[k]}`} onClick={() => edit(k)}>
          Edit
        </button>
      </div>,
    )
  }

  return (
    <div ref={rootRef}>
      <div className="sr-root" aria-live="polite">
        {items}
        {!open && (
          <div className="sr-allset sr-glass">
            <span className="sr-tick" aria-hidden="true">
              ✓
            </span>
            <span>That&apos;s everything on redness. Tap Next to continue.</span>
          </div>
        )}
        {error && (
          <p className="sr-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <StepFooter
        onContinue={handleContinue}
        onBack={onBack}
        isLoading={isPending}
        continueDisabled={active !== null}
      />
    </div>
  )
}
