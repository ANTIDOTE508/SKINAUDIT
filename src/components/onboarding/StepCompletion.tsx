'use client'

import { useRef, useEffect, useTransition } from 'react'
import { gsap } from 'gsap'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from '@/app/actions/onboarding'

const BULLETS = [
  'Your regimen will be analysed continuously',
  'Environmental context will be factored in',
  'You\'ll build understanding over time',
  'You stay in control',
]

export function StepCompletion() {
  const lineRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLDivElement>(null)
  const bulletsRef = useRef<HTMLUListElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const line = lineRef.current
    const headline = headlineRef.current
    const bullets = bulletsRef.current?.querySelectorAll('li')
    const btn = btnRef.current

    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      tl.fromTo(line, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 0.7, ease: 'power3.out' })
        .fromTo(headline, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, '-=0.3')
        .fromTo(bullets ?? [], { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.12, ease: 'power2.out' }, '-=0.3')
        .fromTo(btn, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }, '-=0.1')
    })

    return () => ctx.revert()
  }, [])

  const handleEnter = () => {
    startTransition(async () => {
      await completeOnboarding()
      router.push('/dashboard')
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '520px' }}>
      {/* Gold line */}
      <div
        ref={lineRef}
        style={{ width: '56px', height: '2px', backgroundColor: 'var(--color-sienna-500)' }}
      />

      {/* Headline */}
      <div ref={headlineRef}>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
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

      <hr className="divider-subtle" />

      {/* Bullets */}
      <ul
        ref={bulletsRef}
        style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
      >
        {BULLETS.map((b) => (
          <li
            key={b}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.875rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '0.9375rem',
              color: 'var(--color-alabaster-300)',
            }}
          >
            <span style={{ color: 'var(--color-sienna-400)', flexShrink: 0 }}>✦</span>
            {b}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        ref={btnRef}
        onClick={handleEnter}
        disabled={isPending}
        className="btn-primary"
        style={{ width: '100%', minHeight: '52px', opacity: 0 }}
      >
        {isPending ? 'Loading…' : 'Enter Studio →'}
      </button>
    </div>
  )
}
