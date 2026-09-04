'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Scroll-driven motion for the /philosophy route. The page itself stays a
 * Server Component; this client island attaches ScrollTrigger to elements
 * by selector, so none of the section components need to become client.
 *
 * It replaces the CSS `@supports (animation-timeline: view())` block that
 * only ran on Chromium — "The Problem" and everything below it now animate
 * everywhere. All motion is transform + opacity only, and `gsap.set()`
 * seeds the from-state at mount, so copy is never stranded invisible if
 * this component fails to run.
 *
 * AGENTS.md GSAP rules: everything is wrapped in `gsap.context()` scoped to
 * `.page`, and cleanup returns `ctx.revert()`.
 */

/** Groups revealed on scroll-in, one stagger per group. */
const REVEAL_GROUPS = [
  '.sec-problem .inner > *',
  '.sec-context .inner > *',
  '.sec-approach .label',
  '.sec-approach .principle',
  '.sec-shift .inner > *',
  '.sec-closer .inner > *',
]

/** Background SVG hosts that drift a little against the scroll. */
const PARALLAX_ART = ['.sec-problem .art', '.sec-closer .art', '.shift-art-host']

export function PhilosophyMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.page')
    if (!root) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      // Reduced motion: force the resting state, run no tweens.
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(REVEAL_GROUPS.join(', '), { clearProps: 'all' })
      })

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // ── section content reveals ──
        REVEAL_GROUPS.forEach((selector) => {
          const items = gsap.utils.toArray<HTMLElement>(selector)
          if (!items.length) return

          gsap.set(items, { y: 28, autoAlpha: 0 })
          gsap.to(items, {
            y: 0,
            autoAlpha: 1,
            duration: 1,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: {
              trigger: items[0].parentElement,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          })
        })

        // ── the three "Is this...?" questions cascade a touch slower ──
        const questions = gsap.utils.toArray<HTMLElement>('.q-stack .q')
        if (questions.length) {
          gsap.set(questions, { y: 20, autoAlpha: 0 })
          gsap.to(questions, {
            y: 0,
            autoAlpha: 1,
            duration: 0.9,
            ease: 'power2.out',
            stagger: 0.12,
            scrollTrigger: {
              trigger: '.q-stack',
              start: 'top 82%',
              toggleActions: 'play none none none',
            },
          })
        }

        // ── "Skin is not static." parallax across its full traversal ──
        const topoHed = root.querySelector<HTMLElement>('.topo-hed')
        if (topoHed) {
          gsap.fromTo(
            topoHed,
            { yPercent: 12 },
            {
              yPercent: -12,
              ease: 'none',
              scrollTrigger: {
                trigger: '.topo-wrap',
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            }
          )
        }

        // ── background art drifts gently against the scroll ──
        PARALLAX_ART.forEach((selector) => {
          const art = root.querySelector<HTMLElement>(selector)
          if (!art) return
          gsap.fromTo(
            art,
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: 'none',
              scrollTrigger: {
                trigger: art.closest('.section'),
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            }
          )
        })
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return null
}
