'use client'

import { useEffect, useRef, type RefObject } from 'react'

/**
 * Adds the `.on` class to an element once it enters the viewport, mirroring
 * the template's IntersectionObserver-driven section reveals (stat rows,
 * feature cards, closer headline, etc). Honors prefers-reduced-motion by
 * applying the class immediately instead of observing.
 *
 * Desktop robustness: on tall viewports a section can be taller than the
 * root or already partially on-screen at mount, and a fractional
 * IntersectionObserver threshold then never resolves — the section stays
 * at opacity 0 and the page shows blank gaps. To avoid that we use
 * `threshold: 0` with a negative-bottom rootMargin, and back it with a
 * scroll/resize check plus a one-shot timeout so the element is revealed
 * the moment any part of it is within the viewport.
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

    let done = false

    const reveal = () => {
      if (done) return
      done = true
      node.classList.add('on')
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      clearTimeout(fallbackId)
    }

    const isInView = () => {
      const rect = node.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      // Any overlap between the element and the viewport, with a small
      // bottom bias so it triggers just before fully entering.
      return rect.top < vh - 40 && rect.bottom > 0
    }

    const onScroll = () => {
      if (isInView()) reveal()
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) reveal()
        }
      },
      { threshold: 0, rootMargin: '0px 0px -10% 0px' }
    )

    observer.observe(node)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    // Catch the case where the element is on-screen at mount (observer
    // callbacks are async and a synchronous check is cheaper insurance).
    if (isInView()) {
      reveal()
    }

    // Last-resort: never leave a section invisible.
    const fallbackId = window.setTimeout(() => {
      if (isInView()) reveal()
    }, 1200)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      clearTimeout(fallbackId)
    }
  }, [])

  return ref
}
