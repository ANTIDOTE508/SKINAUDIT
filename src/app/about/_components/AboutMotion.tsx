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

        // ── the derivation draws itself out down the page as it is read ──
        // Ports the comp's `@supports (animation-timeline: scroll(root block))`
        // block (dropped from about.css): each numbered band's tracks — then,
        // slightly later, the terms they reach — stroke on as the page scrolls,
        // so the field is visibly in motion from the hero onward, not a still.
        // One timeline scrubbed over the whole page; each band tween is placed
        // at the comp's `animation-range` fractions via the position parameter.
        if (field) {
          // [bandSuffix, startPct, endPct] — the comp's animation-range values.
          // Tracks in the markup run b-1…b-10; glyphs b-0…b-10.
          const TRACK_BANDS: [number, number, number][] = [
            [1, 0, 16], [2, 0, 25], [3, 0, 33], [4, 0, 41], [5, 0, 50],
            [6, 0, 58], [7, 0, 66], [8, 0, 75], [9, 0, 83], [10, 0, 91],
          ]
          const GLYPH_BANDS: [number, number, number][] = [
            [0, 3, 11], [1, 7, 19], [2, 11, 28], [3, 15, 36], [4, 19, 45], [5, 24, 53],
            [6, 28, 62], [7, 32, 70], [8, 36, 79], [9, 40, 87], [10, 44, 95],
          ]

          const draw = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: root,
              start: 'top top',
              end: 'bottom bottom',
              scrub: true,
            },
          })

          const addBand = (
            selector: string,
            startPct: number,
            endPct: number
          ) => {
            const els = gsap.utils.toArray<Element>(selector)
            if (!els.length) return
            gsap.set(els, { strokeDasharray: 1, strokeDashoffset: 1 })
            // timeline spans 100 "seconds"; 1s == 1% of page scroll.
            draw.to(
              els,
              { strokeDashoffset: 0, duration: Math.max(endPct - startPct, 0.001) },
              startPct
            )
          }

          TRACK_BANDS.forEach(([n, s, e]) =>
            addBand(`.field .trk.b-${n} path`, s, e)
          )
          GLYPH_BANDS.forEach(([n, s, e]) =>
            addBand(
              `.field .gly.b-${n} path, .field .gly.b-${n} circle, .field .gly.b-${n} rect, .field .gly.b-${n} polygon`,
              s,
              e
            )
          )
        }
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return null
}
