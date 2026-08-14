'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { getInitials, getDisplayName } from '@/lib/user-display'

interface SignOutButtonProps {
  name: string | null
  email: string
}

export function SignOutButton({ name, email }: SignOutButtonProps) {
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

  const initials = getInitials(name, email)
  const displayName = getDisplayName(name, email)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      {/* Avatar */}
      <div
        aria-hidden="true"
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-obsidian-800)',
          border: '1px solid var(--color-sienna-500)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontFamily: 'var(--font-mono, "DM Mono", monospace)',
          fontSize: '10px',
          letterSpacing: '0.05em',
          color: 'var(--color-alabaster-50)',
          userSelect: 'none',
        }}
      >
        {initials}
      </div>

      {/* Name — hidden on small screens */}
      <span
        className="hide-on-mobile"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          fontWeight: 400,
          color: 'var(--color-alabaster-300)',
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        {displayName}
      </span>

      {/* Separator — hidden on small screens */}
      <span
        className="hide-on-mobile"
        aria-hidden="true"
        style={{
          color: 'var(--color-obsidian-700)',
          fontSize: '14px',
          fontWeight: 300,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        |
      </span>

      {/* Sign out link */}
      <button
        onClick={handleSignOut}
        disabled={isPending}
        aria-label="Sign out of your account"
        style={{
          background: 'none',
          border: 'none',
          padding: '2px 0',
          cursor: isPending ? 'default' : 'pointer',
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          fontWeight: 400,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: isPending ? 'var(--color-obsidian-700)' : 'var(--color-alabaster-400)',
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
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-alabaster-400)'
          }
        }}
      >
        {isPending ? (
          <span
            aria-label="Signing out…"
            style={{
              display: 'inline-block',
              animation: 'signout-pulse 900ms ease-in-out infinite',
            }}
          >
            ·
          </span>
        ) : (
          'Sign out'
        )}
      </button>

      <style>{`
        @keyframes signout-pulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.4); }
        }
        @media (max-width: 639px) {
          .hide-on-mobile { display: none !important; }
        }
      `}</style>
    </div>
  )
}
