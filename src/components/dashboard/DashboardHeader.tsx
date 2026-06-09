import { SignOutButton } from './SignOutButton'

interface DashboardHeaderProps {
  user: {
    name: string | null
    email: string
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: '60px',
        backgroundColor: 'var(--color-obsidian-900)',
        borderBottom: '1px solid var(--color-obsidian-700)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingInline: 'clamp(1.25rem, 4vw, 2.5rem)',
      }}
    >
      {/* Wordmark */}
      <a
        href="/dashboard"
        aria-label="SkinAudit — return to dashboard"
        style={{
          fontFamily: 'var(--font-heading)',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: 'clamp(1.125rem, 2vw, 1.375rem)',
          letterSpacing: '0.04em',
          color: 'var(--color-sienna-500)',
          textDecoration: 'none',
          lineHeight: 1,
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        SkinAudit
      </a>

      {/* Right cluster */}
      <SignOutButton name={user.name} email={user.email} />
    </header>
  )
}
