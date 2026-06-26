import { SignOutButton } from './SignOutButton'
import SkinauditLogo from '@/components/ui/SkinauditLogo'

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
      <a href="/dashboard" aria-label="SkinAudit — return to dashboard" style={{ textDecoration: 'none' }}>
        <SkinauditLogo />
      </a>

      {/* Right cluster */}
      <SignOutButton name={user.name} email={user.email} />
    </header>
  )
}
