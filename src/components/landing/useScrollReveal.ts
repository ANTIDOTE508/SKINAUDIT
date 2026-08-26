'use client'

import { useEffect, useRef, type RefObject } from 'react'

/**
 * Adds the `.on` class to an element once it enters the viewport, mirroring
 * the template's IntersectionObserver-driven section reveals (stat rows,
 * feature cards, closer headline, etc). Honors prefers-reduced-motion by
 * applying the class immediately instead of observing.
 */
export function useScrollReveal<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (prefersReducedMotion) {
      node.classList.add('on')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('on')
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [])

  return ref
}
