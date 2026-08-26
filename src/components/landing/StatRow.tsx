'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

interface StatRowProps {
  label: ReactNode
  target: number
  suffix: string
  display: string
  transitionDelay?: string
}

/**
 * Slides in on scroll (IntersectionObserver) and counts the number up from
 * zero once visible, matching the template's stat-row + count-up behavior.
 */
export default function StatRow({ label, target, suffix, display, transitionDelay }: StatRowProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)
  const [value, setValue] = useState<string>(display)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (prefersReducedMotion) {
      setOn(true)
      setValue(display)
      return
    }

    const isDecimal = target % 1 !== 0
    let rafId = 0

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          setOn(true)

          const duration = 1400
          const start = performance.now()

          const tick = (now: number) => {
            const elapsed = now - start
            const p = clamp(elapsed / duration, 0, 1)
            const ease = 1 - Math.pow(1 - p, 3)
            const current = isDecimal
              ? (ease * target).toFixed(1)
              : Math.round(ease * target).toLocaleString()
            setValue(current + suffix)
            if (p < 1) rafId = requestAnimationFrame(tick)
          }
          rafId = requestAnimationFrame(tick)

          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafId)
    }
  }, [target, suffix, display])

  return (
    <div
      className={`s-row stat-row${on ? ' on' : ''}`}
      ref={ref}
      style={transitionDelay ? { transitionDelay } : undefined}
    >
      <span className="s-label">{label}</span>
      <span className="s-num" suppressHydrationWarning>
        {value}
      </span>
    </div>
  )
}
