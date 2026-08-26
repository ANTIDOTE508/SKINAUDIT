'use client'

import { useEffect, useRef, type RefObject } from 'react'

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

export interface HeroParallaxRefs {
  line1: RefObject<HTMLSpanElement | null>
  line2: RefObject<HTMLSpanElement | null>
  finally_: RefObject<HTMLSpanElement | null>
  subRow: RefObject<HTMLDivElement | null>
}

/**
 * Mirrors the template's `updateHero()` scroll handler: each headline
 * element drifts/fades independently as the user scrolls the first
 * viewport height. Runs inside a rAF-throttled scroll listener and is a
 * no-op under prefers-reduced-motion.
 */
export function useHeroParallax(): HeroParallaxRefs {
  const line1 = useRef<HTMLSpanElement>(null)
  const line2 = useRef<HTMLSpanElement>(null)
  const finally_ = useRef<HTMLSpanElement>(null)
  const subRow = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReducedMotion) return

    const hed1 = line1.current
    const hed2 = line2.current
    const hedFin = finally_.current
    const heroSubRow = subRow.current
    if (!hed1 || !hed2 || !hedFin || !heroSubRow) return

    let winH = window.innerHeight
    let ticking = false

    const update = () => {
      const p = clamp(window.scrollY / winH, 0, 1)
      const ease = p * p

      hed1.style.transform = `translateX(${-ease * 90}px) translateY(${-ease * 20}px)`
      hed1.style.opacity = String(1 - clamp(p * 2.2, 0, 1))

      hed2.style.transform = `translateX(${ease * 60}px) translateY(${-ease * 35}px)`
      hed2.style.opacity = String(1 - clamp(p * 1.8, 0, 1))

      hedFin.style.transform = `translateY(${-ease * 80}px) translateX(${ease * 20}px)`
      hedFin.style.opacity = String(1 - clamp(p * 2.8, 0, 1))

      heroSubRow.style.transform = `translateY(${-p * 30}px)`
      heroSubRow.style.opacity = String(1 - clamp(p * 3, 0, 1))

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

  return { line1, line2, finally_, subRow }
}
