'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function OnboardingSignOut() {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  async function handleSignOut() {
    if (isPending) return
    setIsPending(true)
    try {
      await authClient.signOut()
      router.push('/signin')
    } catch {
      setIsPending(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      aria-label="Sign out of your account"
      style={{
        marginLeft: 'auto',
        flexShrink: 0,
        background: 'none',
        border: 'none',
        padding: '2px 0',
        cursor: isPending ? 'default' : 'pointer',
        fontFamily: 'var(--font-heading)',
        fontSize: '10px',
        fontWeight: 300,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: isPending ? 'var(--color-obsidian-700)' : 'var(--color-alabaster-500)',
        transition: 'color 200ms ease',
        whiteSpace: 'nowrap',
        lineHeight: 1,
      }}
      onMouseEnter={(e) => {
        if (!isPending) {
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-sienna-400)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isPending) {
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-alabaster-500)'
        }
      }}
    >
      {isPending ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
