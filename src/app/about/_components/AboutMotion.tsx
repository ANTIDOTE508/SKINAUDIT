'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Scroll-driven motion for the /about route. The page stays a Server
 * Component; this client island attaches ScrollTrigger by selector so no
 * section component needs to become client.
 *
 * It replaces the comp's `@supports (animation-timeline: scroll(root))`
 * and `view()` blocks, which only ran on Chromium — the field drift, the
 * headline word-reveals and the per-section content rise now happen
 * everywhere (Firefox / Safari included). All motion is transform +
 * opacity only, and `gsap.set()` seeds the from-state at mount, so copy is
 * never stranded invisible if this component fails to run. Mirrors
 * /how-it-works' HowItWorksMotion.
 *
 * AGENTS.md GSAP rules: everything is wrapped in `gsap.context()` scoped
 * to `.page`, and cleanup returns `ctx.revert()`.
 */
export function AboutMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.page')
    if (!root) return

    // The field SVG is ~4200 user-units tall and injected as a raw string;
    // fonts, the poster and images also settle after mount. Each changes the
    // document height *after* ScrollTrigger first measures it, which left the
    // section reveals firing at the wrong scroll positions on a warm load.
    // Re-measure once everything has loaded and once webfonts have swapped.
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    document.fonts?.ready.then(refresh).catch(() => {})

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      // Reduced motion: force the resting state, run no tweens.
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('.section .inner > *, .hero .stack, .hero .accrue', { clearProps: 'all' })
        gsap.set('.hero-lead .wi, .sec-hed .wi', { clearProps: 'all' })
      })

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // ── hero: masked words rise on load, it is already on screen ──
        const heroWords = gsap.utils.toArray<HTMLElement>('.hero-lead .wi')
        if (heroWords.length) {
          gsap.set(heroWords, { yPercent: 112 })
          gsap.to(heroWords, {
            yPercent: 0,
            duration: 1.05,
            ease: 'expo.out',
            stagger: 0.06,
            delay: 0.15,
          })
        }

        // ── section headline words rise as each section arrives ──
        gsap.utils.toArray<HTMLElement>('.section .sec-hed').forEach((heading) => {
          const inner = heading.querySelectorAll<HTMLElement>('.wi')
          if (!inner.length) return
          gsap.set(inner, { yPercent: 112 })
          gsap.to(inner, {
            yPercent: 0,
            duration: 1,
            ease: 'expo.out',
            stagger: 0.06,
            scrollTrigger: {
              trigger: heading,
              start: 'top 82%',
              toggleActions: 'play none none none',
            },
          })
        })

        // ── the rest of each section's inner column rises in ──
        gsap.utils.toArray<HTMLElement>('.section .inner').forEach((inner) => {
          const items = gsap.utils.toArray<HTMLElement>(
            ':scope > *:not(.sec-hed)',
            inner
          ) as HTMLElement[]
          if (!items.length) return
          gsap.set(items, { y: 28, autoAlpha: 0 })
          gsap.to(items, {
            y: 0,
            autoAlpha: 1,
            duration: 1,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: {
              trigger: inner,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          })
        })

        // ── the field plate drifts a little against the whole-page scroll ──
        const field = root.querySelector<HTMLElement>('.field')
        if (field) {
          gsap.fromTo(
            field,
            { yPercent: -3 },
            {
              yPercent: 3,
              ease: 'none',
              scrollTrigger: {
                trigger: root,
                start: 'top top',
                end: 'bottom bottom',
                scrub: true,
              },
            }
          )
        }

        // ── the derivation draws itself out, top to bottom, on load ──
        // Ports the comp's `@supports (animation-timeline: scroll(root block))`
        // block (dropped from about.css). The comp keyed the draw-in to page
        // scroll, so at scroll 0 the hero's tracks sat undrawn and *nothing*
        // moved there until you scrolled — a cache-cold reload (which refreshes
        // ScrollTrigger late, mid-scroll) was the only time the hero showed
        // any of it. Running it as a one-shot on load instead gives the hero
        // the same living, drawing-in field as the sections lower down, on the
        // first paint. The staggered order still reads top-to-bottom, and the
        // perpetual `.pulse` / `.join` / `.solve` CSS keeps it alive after.
        if (field) {
          const strokes = gsap.utils.toArray<Element>(
            '.field .trk path, .field .gly path, .field .gly circle, .field .gly rect, .field .gly polygon'
          )
          if (strokes.length) {
            gsap.set(strokes, { strokeDasharray: 1 })
            gsap.fromTo(
              strokes,
              { strokeDashoffset: 1 },
              {
                strokeDashoffset: 0,
                ease: 'none',
                duration: 1.8,
                stagger: { each: 2 / strokes.length, from: 'start' },
              }
            )
          }
        }
      })
    }, root)

    return () => {
      window.removeEventListener('load', refresh)
      ctx.revert()
    }
  }, [])

  return null
}
