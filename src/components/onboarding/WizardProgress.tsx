'use client'

type Props = {
  steps: string[]
  currentIndex: number
}

export function WizardProgress({ steps, currentIndex }: Props) {
  return (
    <nav aria-label="Onboarding progress" className="hidden md:flex items-center gap-0">
      {steps.map((label, i) => {
        const isDone = i < currentIndex
        const isActive = i === currentIndex
        const isLast = i === steps.length - 1

        return (
          <div key={label} className="flex items-center">
            {/* Step dot + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                style={{
                  width: isActive ? '8px' : '6px',
                  height: isActive ? '8px' : '6px',
                  borderRadius: '50%',
                  backgroundColor: isDone
                    ? 'var(--color-sienna-500)'
                    : isActive
                    ? 'var(--color-sienna-400)'
                    : 'var(--color-obsidian-700)',
                  border: isActive
                    ? '1.5px solid var(--color-sienna-300)'
                    : isDone
                    ? 'none'
                    : '1px solid var(--color-obsidian-700)',
                  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  boxShadow: isActive
                    ? '0 0 8px rgba(184,134,61,0.4)'
                    : 'none',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '9px',
                  fontWeight: isActive ? 500 : 400,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: isDone
                    ? 'var(--color-sienna-500)'
                    : isActive
                    ? 'var(--color-alabaster-300)'
                    : 'var(--color-obsidian-700)',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.4s ease',
                }}
              >
                {label}
              </span>
            </div>

            {/* Connecting line */}
            {!isLast && (
              <div
                style={{
                  width: '32px',
                  height: '1px',
                  marginBottom: '18px',
                  backgroundColor: isDone
                    ? 'var(--color-sienna-500)'
                    : 'var(--color-obsidian-700)',
                  transition: 'background-color 0.4s ease',
                }}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
