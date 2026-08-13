'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { Camera, Search } from 'lucide-react'
import { StepHeader } from './StepHeader'

type Props = {
  onBack: () => void
  onComplete?: () => Promise<void>
}

export function StepProducts({ onBack, onComplete }: Props) {
  const router = useRouter()
  const actionsRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)

  const [isFinishing, setIsFinishing] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (actionsRef.current) {
        gsap.fromTo(
          actionsRef.current,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', delay: 0.25 }
        )
      }
      if (navRef.current) {
        gsap.fromTo(
          navRef.current,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.45 }
        )
      }
    })
    return () => ctx.revert()
  }, [])

  const handleFinish = async () => {
    setIsFinishing(true)
    setFinishError(null)
    try {
      if (onComplete) await onComplete()
      router.refresh()
    } catch {
      setFinishError('Something went wrong. Please try again.')
      setIsFinishing(false)
    }
  }

  return (
    <div>
      <StepHeader
        eyebrow="08 / 08"
        title="Add a few products you're currently using."
        subtitle="This builds your Skincare Dossier. You can add the rest later."
      />

      {/* Scan / search actions */}
      <div
        ref={actionsRef}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.875rem',
          marginBottom: '2rem',
        }}
      >
        <button
          type="button"
          disabled
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.625rem',
            padding: '1.75rem 1rem',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            cursor: 'not-allowed',
            opacity: 0.6,
          }}
        >
          <Camera size={22} strokeWidth={1.5} color="var(--color-alabaster-300)" />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              fontSize: '0.875rem',
              color: 'var(--color-alabaster-300)',
            }}
          >
            Scan products
          </span>
        </button>

        <button
          type="button"
          disabled
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.625rem',
            padding: '1.75rem 1rem',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            cursor: 'not-allowed',
            opacity: 0.6,
          }}
        >
          <Search size={22} strokeWidth={1.5} color="var(--color-alabaster-300)" />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              fontSize: '0.875rem',
              color: 'var(--color-alabaster-300)',
            }}
          >
            Search manually
          </span>
        </button>
      </div>

      {finishError && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.8125rem',
          color: 'var(--color-blush-500)',
          marginBottom: '1rem',
        }}>
          {finishError}
        </p>
      )}

      <div ref={navRef} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary"
          style={{ minHeight: '52px' }}
          disabled={isFinishing}
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={handleFinish}
          className="btn-primary"
          style={{ minHeight: '52px', flex: 1, minWidth: '200px' }}
          disabled={isFinishing}
        >
          {isFinishing ? 'Setting up your space…' : 'Continue to Studio'}
        </button>
      </div>
    </div>
  )
}
