'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { gsap } from 'gsap'
import { Check, ArrowRight } from 'lucide-react'
import { acknowledgeAllSet } from '@/app/actions/onboarding'

/**
 * The four assurance icons are the hairline SVGs from templates/allSet.html —
 * a spectral trace over a baseline, a graduated meter, a plotted curve with
 * observations, and an aperture. 1px round-capped strokes, no fills, no badge.
 */
const BULLETS: { text: string; icon: React.ReactNode }[] = [
  {
    text: 'Your regimen will be analyzed continuously',
    icon: (
      <>
        <path d="M2 20.5h20" opacity="0.5" />
        <path d="M2.5 17.5h2.5l1.5-4.5 1.5 4.5h1l2-11.5 2 11.5h1.5l1.5-6 1.5 6h3" />
      </>
    ),
  },
  {
    text: 'Environmental context will be factored in',
    icon: (
      <>
        <path d="M3.6 17.5a8.4 8.4 0 0 1 16.8 0" />
        <path
          d="M2 17.5h1.7M5.1 10.5l1.2 1.2M12 7.4V9.1M18.9 10.5l-1.2 1.2M20.4 17.5H22"
          opacity="0.65"
        />
        <path d="M12 17.5l4-5" />
        <circle cx="12" cy="17.5" r="1.1" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    text: 'Your understanding will grow over time',
    icon: (
      <>
        <path d="M3.5 3v18h18" opacity="0.5" />
        <path d="M6 18c2.5 0 4-4.5 6-8s4-4.8 7-5.2" />
        <circle cx="8.6" cy="16.2" r="1.15" fill="currentColor" stroke="none" />
        <circle cx="13.2" cy="8.9" r="1.15" fill="currentColor" stroke="none" />
        <circle cx="19" cy="4.9" r="1.15" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    text: 'You stay in control',
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4 7.5 11.8M20 12H10.9M16.5 19.1 12 11.3" />
      </>
    ),
  },
]

type Props = {
  onContinue: () => void
  onBack: () => void
}

/**
 * Milestone screen closing the questionnaire portion of onboarding. It is
 * NOT the final step — the dossier-building steps follow — so it advances
 * the resume marker and hands control back to the wizard rather than
 * completing onboarding and redirecting to the Studio.
 */
export function StepCompletion({ onContinue, onBack }: Props) {
  const badgeRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLDivElement>(null)
  const bulletsRef = useRef<HTMLUListElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const badge = badgeRef.current
    const headline = headlineRef.current
    const bullets = bulletsRef.current?.querySelectorAll('li')
    const btn = btnRef.current

    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      tl.fromTo(badge, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.6)' })
        .fromTo(headline, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, '-=0.25')
        .fromTo(bullets ?? [], { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.12, ease: 'power2.out' }, '-=0.25')
        .fromTo(btn, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }, '-=0.1')
    })

    return () => ctx.revert()
  }, [])

  const handleContinue = () => {
    setError(null)
    startTransition(async () => {
      try {
        await acknowledgeAllSet()
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div>
      {/* No background image on this screen — templates/allSet.html carries the
          warmth in the ground itself (a warm near-black). */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
          width: '100%',
          maxWidth: '480px',
          marginInline: 'auto',
          textAlign: 'center',
        }}
      >
        {/* Checkmark badge */}
        <div
          ref={badgeRef}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: '1.5px solid var(--color-sienna-400)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={24} strokeWidth={1.5} color="var(--color-sienna-400)" />
        </div>

        {/* Headline */}
        <div ref={headlineRef}>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 300,
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              lineHeight: 1.1,
              color: 'var(--color-alabaster-50)',
              margin: '0 0 0.5rem',
            }}
          >
            All set.
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '1rem',
              color: 'var(--color-alabaster-400)',
              margin: 0,
            }}
          >
            Your SkinAudit is ready.
          </p>
        </div>

        {/* Bullets */}
        <ul
          ref={bulletsRef}
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            /* The list is centred as a block while each row stays left-aligned,
               so the icons form a single column as in the reference. */
            alignSelf: 'center',
            textAlign: 'left',
          }}
        >
          {BULLETS.map(({ icon, text }) => (
            <li
              key={text}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                fontFamily: 'var(--font-body)',
                fontWeight: 300,
                fontSize: '0.9375rem',
                color: 'var(--color-alabaster-300)',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="30"
                height="30"
                fill="none"
                stroke="var(--color-sienna-400)"
                strokeWidth={1.1}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              >
                {icon}
              </svg>
              {text}
            </li>
          ))}
        </ul>

        {error && (
          <p
            role="alert"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: 'var(--color-blush-500)',
              margin: 0,
            }}
          >
            {error}
          </p>
        )}

        {/* CTA */}
        <button
          ref={btnRef}
          type="button"
          onClick={handleContinue}
          disabled={isPending}
          className="btn-primary btn-primary-accent"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            width: '100%',
            minHeight: '58px',
            paddingInline: '1.5rem',
            opacity: 0,
          }}
        >
          {/* Spacer mirrors the arrow so the label stays optically centred */}
          <span aria-hidden="true" style={{ width: 20, flexShrink: 0 }} />
          {isPending ? 'Loading…' : 'Continue to Dossier'}
          <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" style={{ flexShrink: 0 }} />
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px 0',
            cursor: isPending ? 'default' : 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            fontWeight: 400,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-alabaster-400)',
            transition: 'color 200ms ease',
          }}
          onMouseEnter={(e) => {
            if (!isPending) {
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-sienna-400)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isPending) {
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-alabaster-400)'
            }
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
