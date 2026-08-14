'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import { useRouter } from 'next/navigation'
import { Check, Activity, CloudSun, TrendingUp, Lock } from 'lucide-react'
import { completeOnboarding } from '@/app/actions/onboarding'

const BULLETS = [
  { icon: Activity, text: 'Your regimen will be analyzed continuously' },
  { icon: CloudSun, text: 'Environmental context will be factored in' },
  { icon: TrendingUp, text: 'Your understanding will grow over time' },
  { icon: Lock, text: 'You stay in control' },
]

const HEXAGON_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'

export function StepCompletion() {
  const badgeRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLDivElement>(null)
  const bulletsRef = useRef<HTMLUListElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const handleEnter = () => {
    startTransition(async () => {
      await completeOnboarding()
      router.push('/studio')
    })
  }

  return (
    <div>
      {/* Background scene — portaled to body so GSAP's transform on ancestor
          content doesn't trap this fixed layer inside the wizard's 680px
          column. The reference image is dark and content-heavy on its left
          side already, so the scrim only needs to reinforce the left edge
          where the text sits and can stay light on the right where the
          image's own dark tones already carry it. */}
      {mounted &&
        createPortal(
          <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none', backgroundColor: 'var(--color-obsidian-950)' }}>
            <Image
              src="/images/onboarding/allset/bg-all-set.webp"
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
                background: 'linear-gradient(90deg, rgba(6,5,5,0.92) 0%, rgba(6,5,5,0.75) 35%, rgba(6,5,5,0.3) 65%, rgba(6,5,5,0.05) 100%)',
              }}
            />
          </div>,
          document.body
        )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '480px' }}>
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
          style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {BULLETS.map(({ icon: Icon, text }) => (
            <li
              key={text}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                fontFamily: 'var(--font-body)',
                fontWeight: 300,
                fontSize: '0.9375rem',
                color: 'var(--color-alabaster-300)',
              }}
            >
              <span
                style={{
                  width: '34px',
                  height: '34px',
                  flexShrink: 0,
                  clipPath: HEXAGON_CLIP,
                  backgroundColor: 'var(--color-accent-subtle)',
                  border: '1px solid var(--color-accent-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={16} strokeWidth={1.5} color="var(--color-sienna-400)" />
              </span>
              {text}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          ref={btnRef}
          onClick={handleEnter}
          disabled={isPending}
          className="btn-primary"
          style={{ width: '100%', minHeight: '56px', opacity: 0 }}
        >
          {isPending ? 'Loading…' : 'Enter Studio'}
        </button>
      </div>
    </div>
  )
}
