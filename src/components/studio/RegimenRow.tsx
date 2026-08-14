'use client'

import { useRef, useEffect, useState, Fragment } from 'react'
import { gsap } from 'gsap'
import { BottlePlaceholder } from './BottlePlaceholder'

export type RegimenStep = {
  step: number
  name: string
  descriptor: string
}

export const REGIMEN: RegimenStep[] = [
  { step: 1, name: 'Cleanser', descriptor: 'Gentle' },
  { step: 2, name: 'Essence', descriptor: 'Hydrating' },
  { step: 3, name: 'Serum', descriptor: 'Antioxidant' },
  { step: 4, name: 'Treatment', descriptor: 'Retinoid' },
  { step: 5, name: 'Moisturizer', descriptor: 'Barrier Support' },
  { step: 6, name: 'SPF', descriptor: 'Protection' },
]

function ProductCard({ item }: { item: RegimenStep }) {
  const [hovered, setHovered] = useState(false)

  return (
    <article
      data-regimen-card
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: '1 1 0',
        minWidth: '128px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        padding: '1.5rem 1rem',
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${hovered ? 'var(--color-accent-border)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-card)',
        transition: 'border-color var(--duration-micro) var(--ease-luxury)',
      }}
    >
      <BottlePlaceholder step={item.step} />

      <div style={{ textAlign: 'center' }}>
        <h3
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 400,
            fontSize: '1.125rem',
            lineHeight: 1.2,
            color: 'var(--color-alabaster-50)',
            margin: '0 0 0.25rem',
            letterSpacing: '0.01em',
          }}
        >
          {item.name}
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            margin: 0,
          }}
        >
          {item.descriptor}
        </p>
      </div>
    </article>
  )
}

export function RegimenRow() {
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = rowRef.current
    if (!node) return

    // Respect reduced-motion: no entrance choreography, content is already visible.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const cards = node.querySelectorAll('[data-regimen-card]')

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { y: 14, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.07,
          ease: 'power2.out',
        }
      )
    }, node)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={rowRef}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '0.5rem',
        marginBottom: '2rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem',
      }}
    >
      {REGIMEN.map((item, i) => (
        <Fragment key={item.step}>
          <ProductCard item={item} />
          {i < REGIMEN.length - 1 && (
            <span
              aria-hidden="true"
              style={{
                alignSelf: 'center',
                flexShrink: 0,
                color: 'var(--color-obsidian-700)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: 300,
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              &rsaquo;
            </span>
          )}
        </Fragment>
      ))}
    </div>
  )
}
