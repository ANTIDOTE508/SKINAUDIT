'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ArrowRight } from 'lucide-react'

/**
 * Full-bleed framing screen with no input and no persistence. Used for:
 *   - onboarding step 0 (the opening screen),
 *   - the interstitial after step 1 ("Let's start with what's yours."),
 *   - the interstitial after step 8 ("Your skin has patterns.").
 * Each passes its own image / copy / CTA label via props.
 *
 * The background image is a full-viewport layer *behind* the copy: a
 * `fixed inset:0` layer portaled to <body> so GSAP's transform on the wizard's
 * 680px content column can't trap it. Same mechanism as StepSunResponse /
 * StepCompletion.
 *
 * In the `template*` variants the *copy* is portaled the same way, because the
 * 680px column would push the text ~280px in from the viewport edge whereas the
 * templates want it hard-left at `clamp(24px, 7vw, 140px)` and vertically
 * centred against the viewport.
 *
 * The single CTA matches the "All set" step's button
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
  /**
   * Visual treatment.
   *  - `'default'`     — the original opening-screen look (copy flows in the
   *    wizard's 680px column).
   *  - `'template'`    — templates/transition_t1.html: lighter single-layer
   *    scrim, no sienna rule, the template's fluid type scale, copy pinned
   *    hard-left and vertically centred against the viewport.
   *  - `'template-t2'` — templates/transition_t2.html: same layout + type
   *    scale as `'template'`, but the two-layer "patterns" scrim (a vertical
   *    base plus a left-darkening layer that ramps in at tablet/desktop).
   * The CTA is unchanged in every case.
   */
  variant?: 'default' | 'template' | 'template-t2'
}

export function StepBaselineTransition({
  onContinue,
  imageSrc,
  eyebrow,
  titleLines,
  body,
  ctaLabel,
  variant = 'default',
}: Props) {
  const isT2 = variant === 'template-t2'
  // Shared template treatment (t1 + t2): type scale, no sienna rule, portaled
  // viewport-anchored copy.
  const isTemplate = variant === 'template' || isT2

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
    // Re-run when the portaled copy mounts, so GSAP targets the real nodes.
  }, [mounted])

  const ctaButton = (
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
        minHeight: isTemplate ? 'clamp(56px, 3.6vw + 42px, 88px)' : '58px',
        paddingInline: '1.5rem',
        marginTop: isTemplate ? 0 : '0.75rem',
        pointerEvents: isTemplate ? 'auto' : undefined,
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
  )

  const copyBlock = (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        // The template's copy column; `default` keeps its original 30rem.
        maxWidth: isTemplate ? 'clamp(20rem, 54vw, 38rem)' : '30rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        // The template drives eyebrow→h1 and h1→description with different
        // gaps (--gap-eyebrow / --gap-body); `default` keeps one even gap.
        gap: isTemplate ? 0 : '1.75rem',
        // The portaled wrapper is pointer-events:none so the background stays
        // inert; the copy itself must take clicks back for the CTA.
        pointerEvents: isTemplate ? 'auto' : undefined,
      }}
    >
      <span
        data-anim
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: isTemplate ? 'clamp(8px, 0.45vw + 7px, 12px)' : '11px',
          fontWeight: isTemplate ? 400 : 300,
          letterSpacing: isTemplate ? '0.38em' : '0.24em',
          textTransform: 'uppercase',
          color: isTemplate
            ? 'var(--color-alabaster-200)'
            : 'var(--color-sienna-300)',
        }}
      >
        {eyebrow}
      </span>

      {!isTemplate && (
        <div
          data-anim-line
          style={{
            width: '56px',
            height: '2px',
            backgroundColor: 'var(--color-sienna-500)',
          }}
        />
      )}

      <h2
        data-anim
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 400,
          fontSize: isTemplate
            ? 'clamp(2.75rem, 6.2vw + 0.4rem, 5.125rem)'
            : 'clamp(2.25rem, 5vw, 3.5rem)',
          lineHeight: isTemplate ? 0.98 : 1.05,
          color: isTemplate
            ? 'var(--color-alabaster-100)'
            : 'var(--color-alabaster-50)',
          letterSpacing: isTemplate ? '-0.035em' : '-0.02em',
          margin: 0,
          // --gap-eyebrow from the template (eyebrow → h1).
          marginTop: isTemplate ? 'clamp(18px, 2.6vh, 30px)' : 0,
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
            fontSize: isTemplate
              ? 'clamp(1rem, 1.1vw + 0.65rem, 1.5625rem)'
              : 'clamp(1rem, 1.5vw, 1.125rem)',
            lineHeight: isTemplate ? 1.55 : 1.6,
            color: isTemplate
              ? 'rgba(239, 231, 222, 0.94)'
              : 'var(--color-alabaster-200)',
            maxWidth: isT2 ? '35rem' : isTemplate ? '36rem' : undefined,
            margin: 0,
            // --gap-body from the template (h1 → description).
            marginTop: isTemplate ? 'clamp(24px, 4vh, 42px)' : 0,
            textShadow: '0 1px 16px rgba(6,5,5,0.6)',
          }}
        >
          {body}
        </p>
      )}

      {/* On `default` the CTA sits directly under the copy. The template
          variants pull it out to a bottom-pinned footer (see the portaled
          layer below), matching transition_t1/t2.html. */}
      {!isTemplate && ctaButton}
    </div>
  )

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
            {isT2 ? (
              // Two-layer "patterns" scrim from transition_t2.html. The
              // horizontal layer darkens the left (where the copy sits, clear
              // of the ribbon) and ramps in at tablet/desktop via --scrim-x.
              <div className="baseline-transition-scrim-t2" />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: isTemplate
                    ? 'linear-gradient(180deg, rgba(5,4,3,0.28) 0%, rgba(5,4,3,0.08) 40%, rgba(5,4,3,0.05) 70%, rgba(5,4,3,0.18) 100%)'
                    : 'linear-gradient(to bottom, rgba(6,5,5,0.62) 0%, rgba(6,5,5,0.30) 38%, rgba(6,5,5,0.34) 68%, rgba(6,5,5,0.82) 100%)',
                }}
              />
            )}
          </div>,
          document.body,
        )}

      {/* Copy block. `default` flows inside the wizard's 680px column. The
          template variants portal it to <body> in a fixed full-viewport layer
          that mirrors transition_t1/t2.html's structure:
            - a header-clearing top inset,
            - a flex:1 content region that vertically centres the copy,
            - a bottom-pinned footer holding the CTA (full width, ~88px tall).
          Both regions share the template's side gutter clamp(24px,7vw,140px)
          so the copy and the button align on the same left edge. */}
      {isTemplate && mounted
        ? createPortal(
            <div
              style={{
                position: 'fixed',
                inset: 0,
                // Above the wizard's <main> (z-index 10), otherwise <main>
                // paints over this layer and swallows every click and text
                // selection meant for the copy and the CTA.
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                // Clear the wizard's top bar (~83px). Slightly under the bar
                // height so the copy centres in the band beneath it at the
                // same offset as the template.
                paddingTop: 'clamp(3.75rem, 7vh, 5rem)',
                // The wrapper itself is inert so the wizard header (sign out)
                // and anything outside the copy/CTA stays reachable; the two
                // regions below opt back in.
                pointerEvents: 'none',
              }}
            >
              {/* Content region — vertically centres the copy, template gutter. */}
              <div
                style={{
                  flex: '1 1 auto',
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  paddingInline: 'clamp(24px, 7vw, 140px)',
                  // Let the copy be selected/copied.
                  pointerEvents: 'auto',
                }}
              >
                {copyBlock}
              </div>

              {/* Footer — CTA pinned near the bottom, matching the template. */}
              <div
                style={{
                  flex: 'none',
                  width: '100%',
                  maxWidth:
                    'calc(clamp(20rem, 60vw, 44rem) + clamp(24px, 7vw, 140px) * 2)',
                  paddingInline: 'clamp(24px, 7vw, 140px)',
                  paddingTop: 'clamp(24px, 4vh, 42px)',
                  paddingBottom: 'clamp(2.25rem, 6vh, 4.75rem)',
                  // Let the CTA be clicked.
                  pointerEvents: 'auto',
                }}
              >
                {ctaButton}
              </div>
            </div>,
            document.body,
          )
        : copyBlock}
    </div>
  )
}
