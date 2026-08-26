'use client'

import { useEffect, useRef } from 'react'

const QUOTE_WORDS = 'Most routines fail silently. The ingredients are fine. The sequence is not.'.split(
  ' '
)

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

export default function LandingQuote() {
  const sectionRef = useRef<HTMLElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const attrRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const attr = attrRef.current
    if (!section || !attr) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReducedMotion) {
      attr.classList.add('on')
      wordRefs.current.forEach((word) => word?.classList.add('on'))
      return
    }

    let winH = window.innerHeight
    let ticking = false

    const update = () => {
      const rect = section.getBoundingClientRect()
      const totalRange = winH * 0.7
      const progress = clamp((winH - rect.top) / totalRange, 0, 1)

      const total = wordRefs.current.length
      wordRefs.current.forEach((word, i) => {
        if (!word) return
        const threshold = i / (total + 4)
        const wordP = clamp((progress - threshold) / 0.12, 0, 1)
        const ease = wordP * (2 - wordP)
        word.style.opacity = String(ease)
        word.style.transform = `translateY(${(1 - ease) * 18}px)`
      })

      if (progress > 0.75) {
        attr.classList.add('on')
      }

      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update)
        ticking = true
      }
    }
    const onResize = () => {
      winH = window.innerHeight
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <section className="quote" id="quoteSection" ref={sectionRef}>
      <blockquote className="q-text">
        <span className="q-mark">&ldquo;</span>
        {QUOTE_WORDS.map((word, i) => (
          <span
            className="word"
            key={`${word}-${i}`}
            ref={(el) => {
              wordRefs.current[i] = el
            }}
          >
            {word}
          </span>
        ))}
        <span className="q-mark">&rdquo;</span>
      </blockquote>
      <p className="q-attr" ref={attrRef}>
        — Formulation Science
      </p>
    </section>
  )
}
