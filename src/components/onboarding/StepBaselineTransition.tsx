'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ArrowRight } from 'lucide-react'

/**
 * Full-bleed framing screen with no input and no persistence. Used twice:
 *   - onboarding step 0 (the opening screen), and
 *   - the interstitial right after step 1,
 * each passing its own image / copy / CTA label via props.
 *
 * The image is a full-viewport background *behind* the copy, using the same
 * mechanism as StepSunResponse / StepCompletion: a `fixed inset:0` layer
 * portaled to <body> so GSAP's transform on the 680px content column can't
 * trap it. The single CTA matches the "All set" step's button
 * (btn-primary btn-primary-accent, trailing arrow). There is no Back.
 */

type Props = {
  onContinue: () => void
  /** Public path to the full-bleed background image. */
  imageSrc: string
  /** Small uppercase label above the rule. */
  eyebrow: string
  /** Main framing line — may contain <br /> via an array of lines. */
  titleLines: string[]
  /** Optional supporting line under the title. */
  body?: string
  /** CTA label. */
  ctaLabel: string
}

export function StepBaselineTransition({
  onContinue,
  imageSrc,
  eyebrow,
  titleLines,
  body,
  ctaLabel,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const node = rootRef.current
    if (!node) return

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const ctx = gsap.context(() => {
      const line = node.querySelector('[data-anim-line]')
      const targets = node.querySelectorAll('[data-anim]')
      const tl = gsap.timeline()
      if (line) {
        tl.fromTo(
          line,
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: 0.7, ease: 'power3.out' },
        )
      }
      tl.fromTo(
        targets,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.12 },
        '-=0.3',
      )
    }, node)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={rootRef}>
      {/* Full-viewport background, portaled to <body> so the GSAP transform on
          the wizard's content column doesn't trap this fixed layer inside the
          680px column. Same mechanism as StepSunResponse / StepCompletion. */}
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
              backgroundColor: 'var(--color-obsidian-950)',
            }}
          >
            <Image
              src={imageSrc}
              alt=""
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center center' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to bottom, rgba(6,5,5,0.62) 0%, rgba(6,5,5,0.30) 38%, rgba(6,5,5,0.34) 68%, rgba(6,5,5,0.82) 100%)',
              }}
            />
          </div>,
          document.body,
        )}

      {/* Copy — shares one width so the CTA lines up with the text above it. */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '30rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '1.75rem',
        }}
      >
        <span
          data-anim
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '11px',
            fontWeight: 300,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--color-sienna-300)',
          }}
        >
          {eyebrow}
        </span>

        <div
          data-anim-line
          style={{
            width: '56px',
            height: '2px',
            backgroundColor: 'var(--color-sienna-500)',
          }}
        />

        <h2
          data-anim
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            lineHeight: 1.05,
            color: 'var(--color-alabaster-50)',
            letterSpacing: '-0.02em',
            margin: 0,
            textShadow: '0 1px 24px rgba(6,5,5,0.7)',
          }}
        >
          {titleLines.map((lineText, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {lineText}
            </span>
          ))}
        </h2>

        {body && (
          <p
            data-anim
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
              lineHeight: 1.6,
              color: 'var(--color-alabaster-200)',
              margin: 0,
              textShadow: '0 1px 16px rgba(6,5,5,0.6)',
            }}
          >
            {body}
          </p>
        )}

        {/* Single CTA — same button as the "All set" step. */}
        <button
          data-anim
          type="button"
          onClick={onContinue}
          className="btn-primary btn-primary-accent"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            width: '100%',
            minHeight: '58px',
            paddingInline: '1.5rem',
            marginTop: '0.75rem',
          }}
        >
          {/* Spacer mirrors the arrow so the label stays optically centred */}
          <span aria-hidden="true" style={{ width: 20, flexShrink: 0 }} />
          {ctaLabel}
          <ArrowRight
            size={20}
            strokeWidth={1.5}
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          />
        </button>
      </div>
    </div>
  )
}
