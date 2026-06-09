'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

type Props = {
  eyebrow?: string
  title: string
  subtitle?: string
}

export function StepHeader({ eyebrow, title, subtitle }: Props) {
  const eyebrowRef = useRef<HTMLSpanElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      if (eyebrowRef.current) {
        tl.fromTo(
          eyebrowRef.current,
          { y: 8, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
        )
      }

      tl.fromTo(
        titleRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
        eyebrow ? '-=0.25' : '0'
      )

      if (subtitleRef.current && subtitle) {
        tl.fromTo(
          subtitleRef.current,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
          '-=0.3'
        )
      }
    })
    return () => ctx.revert()
  }, [eyebrow, subtitle])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
      {eyebrow && (
        <span
          ref={eyebrowRef}
          className="label-caps"
          style={{ color: 'var(--color-sienna-500)' }}
        >
          {eyebrow}
        </span>
      )}
      <h2
        ref={titleRef}
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 300,
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          lineHeight: 1.1,
          color: 'var(--color-alabaster-50)',
          letterSpacing: '-0.01em',
          margin: 0,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          ref={subtitleRef}
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.9375rem',
            lineHeight: 1.65,
            color: 'var(--color-alabaster-400)',
            margin: 0,
            maxWidth: '520px',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
