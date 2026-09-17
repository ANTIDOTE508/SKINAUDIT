'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

type Props = {
  userName: string | null
}

export function DossierGate({ userName }: Props) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: 'var(--color-obsidian-950)',
      }}
    >
      <div style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            color: 'var(--color-alabaster-50)',
            margin: '0 0 0.75rem',
          }}
        >
          Welcome back{userName ? `, ${userName}` : ''}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.9375rem',
            color: 'var(--color-alabaster-300)',
            margin: '0 0 2.5rem',
          }}
        >
          Where would you like to go?
        </p>

        <Link
          href="/onboarding?dossier=1"
          className="btn-primary btn-primary-accent"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            width: '100%',
            minHeight: '58px',
            paddingInline: '1.5rem',
            marginBottom: '0.875rem',
            textDecoration: 'none',
          }}
        >
          <span aria-hidden="true" style={{ width: 20, flexShrink: 0 }} />
          Go to Dossier
          <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" style={{ flexShrink: 0 }} />
        </Link>

        <Link
          href="/studio?skipGate=1"
          style={{
            display: 'block',
            width: '100%',
            minHeight: '52px',
            lineHeight: '52px',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-accent-border)',
            color: 'var(--color-alabaster-200)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            textDecoration: 'none',
          }}
        >
          Go to Studio
        </Link>
      </div>
    </div>
  )
}
