'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Scroll-driven motion for the /how-it-works route. The page stays a
 * Server Component; this client island attaches ScrollTrigger by selector
 * so no section component needs to become client.
 *
 * It replaces the comp's `@supports (animation-timeline: view())` block,
 * which only ran on Chromium — the steps, the principle and the closer now
 * animate everywhere (Firefox / Safari included). All motion is transform
 * + opacity only, and `gsap.set()` seeds the from-state at mount, so copy
 * is never stranded invisible if this component fails to run. Mirrors
 * /philosophy's PhilosophyMotion.
 *
 * AGENTS.md GSAP rules: everything is wrapped in `gsap.context()` scoped
 * to `.page`, and cleanup returns `ctx.revert()`.
 */

/** Groups revealed on scroll-in, one stagger per group. */
const REVEAL_GROUPS = [
  '.step.s-1 .inner > *',
  '.step.s-2 .inner > *',
  '.step.s-3 .inner > *',
  '.step.s-4 .inner > *',
  '.step.s-5 .inner > *',
  '.sec-principle .inner > *',
  '.sec-closer .inner > *',
]

export function HowItWorksMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.page')
    if (!root) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      // Reduced motion: force the resting state, run no tweens.
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(REVEAL_GROUPS.join(', '), { clearProps: 'all' })
        gsap.set('.hero-lead .wi, .step-title .wi, .pr-hed .wi, .closer-hl .wi', {
          clearProps: 'all',
        })
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

        // ── section-title masked words rise as each block enters ──
        gsap.utils.toArray<HTMLElement>('.step-title, .pr-hed, .closer-hl').forEach((heading) => {
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

        // ── step number + rule track the pass; art drifts against scroll ──
        gsap.utils.toArray<HTMLElement>('.section.step').forEach((section) => {
          const num = section.querySelector<HTMLElement>('.step-num')
          if (num) {
            gsap.fromTo(
              num,
              { yPercent: 40 },
              {
                yPercent: -40,
                ease: 'none',
                scrollTrigger: {
                  trigger: section,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              }
            )
          }

          const rule = section.querySelector<HTMLElement>('.step-rule')
          if (rule) {
            gsap.fromTo(
              rule,
              { scaleX: 0.12, transformOrigin: 'left center' },
              {
                scaleX: 1,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: section,
                  start: 'top 78%',
                  toggleActions: 'play none none none',
                },
              }
            )
          }

          const art = section.querySelector<HTMLElement>('.art-host')
          if (art) {
            gsap.fromTo(
              art,
              { yPercent: -6 },
              {
                yPercent: 6,
                ease: 'none',
                scrollTrigger: {
                  trigger: section,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              }
            )
          }
        })

        // ── principle art drifts too ──
        const principleArt = root.querySelector<HTMLElement>('.sec-principle .art-host')
        if (principleArt) {
          gsap.fromTo(
            principleArt,
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: 'none',
              scrollTrigger: {
                trigger: '.sec-principle',
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            }
          )
        }
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return null
}
