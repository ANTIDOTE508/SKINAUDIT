'use client'

import { useRef, useEffect, useState, useTransition, type KeyboardEvent } from 'react'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { saveExperienceLevel } from '@/app/actions/onboarding'
import type { SkincareExperience } from '@prisma/client'
import './stepExperience.css'

// Screen 8 — experience level, as a four-stop journey scale
// (templates/stepXpWithSkinCare). The live card below shows what the chosen
// level means and how results will read; an optional term check suggests a
// level for people who aren't sure.

const LEVELS: {
  value: SkincareExperience
  name: string
  quote: string
  def: string
  sample: string
  icon: React.ReactNode
}[] = [
  {
    value: 'NEW',
    name: 'New to skincare',
    quote: '“I wash my face and use whatever moisturizer is around.”',
    def: 'Beginning to build habits or explore products.',
    sample: 'Your skin could use more moisture. Use a gentle moisturizer every morning and night.',
    icon: (
      <>
        <path d="M12 21v-9" />
        <path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6z" />
        <path d="M12 14c0-3-2-5-6-5 0 3 2 5 6 5z" />
      </>
    ),
  },
  {
    value: 'SOMEWHAT_EXPERIENCED',
    name: 'Somewhat experienced',
    quote: '“I have a routine most days and a few products I trust.”',
    def: 'Basic understanding, some routine consistency.',
    sample:
      'Your skin barrier looks dry. Add a hydrating serum before your moisturizer, and keep it gentle for a couple of weeks.',
    icon: (
      <>
        <path d="M4 5.5C6.5 4 9.5 4 12 5.5v14C9.5 18 6.5 18 4 19.5z" />
        <path d="M20 5.5C17.5 4 14.5 4 12 5.5v14c2.5-1.5 5.5-1.5 8 0z" />
      </>
    ),
  },
  {
    value: 'EXPERIENCED',
    name: 'Experienced',
    quote: '“I read ingredient lists and know what my actives do.”',
    def: 'Understand ingredients, actives, and how routines work.',
    sample:
      'Signs of a weakened barrier. Look for ceramides and a humectant like glycerin, and pause strong exfoliating acids for a week.',
    icon: (
      <>
        <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" />
        <path d="M7.5 15h9" />
      </>
    ),
  },
  {
    value: 'OBSESSIVE',
    name: 'Skincare obsessive',
    quote: '“I track my skin and fine-tune my routine every week.”',
    def: 'Skincare is a passion; enjoy continuous refinement and tracking.',
    sample:
      'Barrier stress is up versus your baseline. Pair a ceramide–cholesterol moisturizer with a humectant serum, and drop retinoid nights to two a week until it settles.',
    icon: (
      <>
        <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
        <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
      </>
    ),
  },
]

// Quick check: the more terms someone can explain, the further along the
// scale they likely are.
const TERMS = [
  'Cleanser',
  'SPF',
  'Serum',
  'Skin barrier',
  'Niacinamide',
  'Retinol',
  'AHA / BHA',
  'Purging',
  'pH',
  'Slugging',
]
const suggest = (n: number) => (n <= 3 ? 0 : n <= 5 ? 1 : n <= 8 ? 2 : 3)

type Props = {
  value: SkincareExperience | null
  onChange: (v: SkincareExperience) => void
  onContinue: () => void
  onBack: () => void
}

export function StepExperienceLevel({ value, onChange, onContinue, onBack }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const stopsRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [checkOpen, setCheckOpen] = useState(false)
  const [known, setKnown] = useState<string[]>([])
  // Bumped on each user pick so the card remounts and replays its swap
  // animation; stays 0 for a value restored on resume (no animation).
  const [swapKey, setSwapKey] = useState(0)

  const index = value ? LEVELS.findIndex((l) => l.value === value) : -1
  const level = index >= 0 ? LEVELS[index] : null
  const suggested = LEVELS[suggest(known.length)]

  useEffect(() => {
    const node = rootRef.current
    if (!node) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: 'power3.out', delay: 0.15 }
      )
    }, node)
    return () => ctx.revert()
  }, [])

  const pick = (i: number) => {
    onChange(LEVELS[i].value)
    setSwapKey((k) => k + 1)
    setError(null)
  }

  /** Arrow keys move along the scale and select as they go (WAI-ARIA
   *  radiogroup). Clamped at both ends, like the template. */
  const handleKeyDown = (e: KeyboardEvent) => {
    const d =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0
    if (d === 0) return
    e.preventDefault()
    const next = Math.max(0, Math.min(LEVELS.length - 1, index + d))
    if (next === index) return
    pick(next)
    stopsRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus()
  }

  const toggleTerm = (t: string) =>
    setKnown((k) => (k.includes(t) ? k.filter((x) => x !== t) : [...k, t]))

  const useSuggestion = () => {
    pick(suggest(known.length))
    setCheckOpen(false)
    cardRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  const handleContinue = () => {
    if (!value) {
      setError('Please choose the description closest to your experience.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveExperienceLevel(value)
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef}>
      <div className="sx-root">
        <div data-reveal>
          <h2 className="sx-title">How would you describe your experience with skincare?</h2>
          <p className="sx-sub">
            This shapes how we present your results. Pick the one that sounds most like you.
          </p>
        </div>

        <div className="sx-journey" data-reveal>
          <div className="sx-rail" aria-hidden="true">
            <i style={{ width: index < 0 ? '0' : `${(index / (LEVELS.length - 1)) * 100}%` }} />
          </div>
          <div
            ref={stopsRef}
            className="sx-stops"
            role="radiogroup"
            aria-label="Your experience with skincare"
            aria-required="true"
            onKeyDown={handleKeyDown}
          >
            {LEVELS.map((l, i) => (
              <button
                key={l.value}
                type="button"
                role="radio"
                aria-checked={i === index}
                tabIndex={(index < 0 ? 0 : index) === i ? 0 : -1}
                className={`sx-stop${index >= 0 && i < index ? ' past' : ''}`}
                onClick={() => pick(i)}
              >
                <span className="sx-ic">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {l.icon}
                  </svg>
                </span>
                <span className="sx-lb">{l.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stable live region: the card inside remounts on each pick to
            replay its swap animation, which screen readers announce poorly. */}
        <div aria-live="polite" data-reveal>
          <section
            key={swapKey}
            ref={cardRef}
            className={level ? `sx-card${swapKey ? ' swap' : ''}` : 'sx-card empty'}
          >
            {level ? (
              <>
                <h3 className="sx-lvl">{level.name}</h3>
                <p className="sx-quote">{level.quote}</p>
                <p className="sx-def">{level.def}</p>
                <div className="sx-preview">
                  <span className="sx-eyebrow">How your results could read</span>
                  <p>{level.sample}</p>
                </div>
              </>
            ) : (
              <>
                <b>Where are you on the journey?</b>
                <span>Tap a stop above to see what it means and how your results could read.</span>
              </>
            )}
          </section>
        </div>

        <section className={`sx-check${checkOpen ? ' open' : ''}`} data-reveal>
          <button
            type="button"
            className="sx-checkhead"
            aria-expanded={checkOpen}
            aria-controls="sx-checkbody"
            onClick={() => setCheckOpen((o) => !o)}
          >
            <span>
              <b>Not sure?</b> <span className="sx-hint">Take a 10-second check</span>
            </span>
            <span className="sx-arrow">{checkOpen ? 'Close' : 'Start'}</span>
          </button>
          <div id="sx-checkbody" hidden={!checkOpen}>
            <p className="sx-def" style={{ marginBottom: 12 }}>
              Tap every term you could explain to a friend.
            </p>
            <div className="sx-terms">
              {TERMS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="sx-term"
                  aria-pressed={known.includes(t)}
                  onClick={() => toggleTerm(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="sx-verdict">
              <span className="sx-v">
                {known.length ? (
                  <>
                    {known.length} of {TERMS.length} · sounds like <b>{suggested.name}</b>
                  </>
                ) : (
                  "Nothing tapped yet? That's fine. It points to New to skincare."
                )}
              </span>
              <button type="button" className="sx-use" onClick={useSuggestion}>
                Use {suggested.name}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <p className="sx-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <StepFooter
        onContinue={handleContinue}
        onBack={onBack}
        isLoading={isPending}
        continueDisabled={!value}
      />
    </div>
  )
}
