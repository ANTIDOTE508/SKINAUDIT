'use client'

import { useRef, useEffect, useState, useTransition, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import { useRouter } from 'next/navigation'
import { completeProfile } from '@/app/actions/onboarding'
import { jost } from '@/components/landing/fonts'
import { OnboardingSignOut } from './OnboardingSignOut'

type Props = {
  onBack: () => void
}

const noopSubscribe = () => () => {}

/**
 * Last onboarding screen — matches templates/fillMyDossier.html, minus the
 * step counter (the counter ends on step 21). It owns the whole viewport:
 * portaled to <body> as a full-page layer with its own top bar, so it covers
 * the wizard's header and escapes the 680px content column's transform.
 * The CTA completes the profile and hands off to /dashboard.
 */
export function StepDossierIntro({ onBack }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // createPortal needs a real <body> — only available after mount.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
  const router = useRouter()

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
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out', delay: 0.15 }
      )
    }, node)
    return () => ctx.revert()
  }, [mounted])

  const handleContinue = () => {
    setError(null)
    startTransition(async () => {
      try {
        await completeProfile()
        router.push('/dashboard')
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  if (!mounted) return null

  return createPortal(
    <div ref={rootRef} className={`${jost.variable} fmd-root`}>
      <div className="fmd-bg" aria-hidden="true">
        <Image
          src="/images/onboarding/fillMyDossier/bg-fill-my-dossier-cabinet.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="fmd-bg-image"
        />
      </div>

      <div className="fmd-page">
        <header className="fmd-topbar">
          <span className="fmd-wordmark">Skin Audit</span>
          <OnboardingSignOut className="fmd-sign-out" label="Sign Out" />
        </header>

        <main className="fmd-content">
          <h1 data-reveal className="fmd-heading">
            Let&apos;s begin with a few products you already own.
          </h1>
          <p data-reveal className="fmd-subhead">
            Skin Audit evaluates routines using what is already in your cabinet.
          </p>

          {error && (
            <p role="alert" className="fmd-error">
              {error}
            </p>
          )}

          <div data-reveal>
            <button type="button" onClick={handleContinue} disabled={isPending} className="fmd-cta">
              <span>{isPending ? 'Loading…' : 'Fill My Dossier'}</span>
              <span className="fmd-cta-arrow" aria-hidden="true">
                →
              </span>
            </button>

            <button type="button" onClick={onBack} disabled={isPending} className="fmd-back">
              <span aria-hidden="true">←</span> Back
            </button>
          </div>
        </main>
      </div>

      <style>{`
        .fmd-root {
          --fmd-bg: #060504;
          --fmd-border: rgba(255,255,255,0.10);
          --fmd-text: #fafaf8;
          --fmd-muted: rgba(250,250,248,0.45);
          --fmd-cta: #c4b09a;
          --fmd-cta-hover: #d0bcaa;
          --fmd-cta-text: #09080a;
          position: fixed;
          inset: 0;
          z-index: 50;
          overflow-y: auto;
          background: var(--fmd-bg);
          color: var(--fmd-text);
          font-family: var(--font-jost), 'Jost', system-ui, sans-serif;
          font-weight: 300;
          -webkit-font-smoothing: antialiased;
        }
        .fmd-root *, .fmd-root *::before, .fmd-root *::after { box-sizing: border-box; }

        /* ── Background image + overlays ── */
        .fmd-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
        }
        .fmd-bg-image {
          object-fit: cover;
          object-position: center top;
        }
        /* Dark vignette — heavy left/bottom, lighter right where products are */
        .fmd-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to right,  rgba(6,5,4,0.82) 0%, rgba(6,5,4,0.55) 55%, rgba(6,5,4,0.30) 100%),
            linear-gradient(to bottom, rgba(6,5,4,0.55) 0%, rgba(6,5,4,0.10) 40%, rgba(6,5,4,0.72) 100%);
        }

        /* ── Page ── */
        .fmd-page {
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* ── Top bar ── */
        .fmd-topbar {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          padding: 0 48px;
          height: 64px;
          flex-shrink: 0;
          border-bottom: 1px solid var(--fmd-border);
          gap: 24px;
        }
        .fmd-wordmark {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.30em;
          text-transform: uppercase;
          color: var(--fmd-text);
          opacity: 0.9;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .fmd-sign-out {
          margin-left: auto;
          font-family: inherit;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: var(--fmd-muted);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          appearance: none;
          -webkit-appearance: none;
          white-space: nowrap;
          flex-shrink: 0;
          transition: color 0.15s;
        }
        .fmd-sign-out:hover { color: var(--fmd-text); }
        .fmd-sign-out:disabled { cursor: default; }
        .fmd-sign-out:focus-visible { outline: 2px solid var(--fmd-cta); outline-offset: 3px; }

        /* ── Main content ── */
        .fmd-content {
          position: relative;
          z-index: 10;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 48px 80px;
          max-width: 760px;
        }
        .fmd-heading {
          font-family: var(--font-cormorant), 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(36px, 5vw, 58px);
          font-weight: 300;
          color: var(--fmd-text);
          letter-spacing: 0.01em;
          line-height: 1.12;
          margin: 0 0 20px;
          max-width: 580px;
          text-wrap: balance;
        }
        .fmd-subhead {
          font-size: 14px;
          font-weight: 300;
          color: var(--fmd-text);
          opacity: 0.55;
          letter-spacing: 0.03em;
          line-height: 1.6;
          margin: 0 0 52px;
          max-width: 420px;
        }
        .fmd-error {
          font-size: 13px;
          color: var(--color-blush-500);
          margin: -32px 0 20px;
        }

        /* ── CTA button ── */
        .fmd-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 460px;
          height: 64px;
          background: var(--fmd-cta);
          color: var(--fmd-cta-text);
          font-family: inherit;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          border: none;
          border-radius: 0;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          padding: 0 28px;
          transition: background 0.18s;
          flex-shrink: 0;
        }
        .fmd-cta:hover { background: var(--fmd-cta-hover); }
        .fmd-cta:disabled { cursor: default; }
        .fmd-cta:focus-visible { outline: 2px solid var(--fmd-cta); outline-offset: 3px; }
        .fmd-cta-arrow {
          font-size: 18px;
          font-weight: 300;
          line-height: 1;
        }

        /* ── Back link ── */
        .fmd-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--fmd-muted);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          appearance: none;
          -webkit-appearance: none;
          transition: color 0.15s;
        }
        .fmd-back:hover { color: var(--fmd-text); }
        .fmd-back:disabled { cursor: default; }
        .fmd-back:focus-visible { outline: 2px solid var(--fmd-cta); outline-offset: 3px; }

        /* ── Mobile ── */
        @media (max-width: 600px) {
          .fmd-topbar { padding: 0 20px; height: 56px; }
          .fmd-content { padding: 48px 24px 64px; }
          .fmd-cta { max-width: 100%; height: 56px; }
          .fmd-heading { font-size: clamp(30px, 8vw, 44px); }
        }
      `}</style>
    </div>,
    document.body
  )
}
