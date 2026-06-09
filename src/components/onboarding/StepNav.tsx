'use client'

type Props = {
  onContinue: () => void
  onBack?: () => void
  continueLabel?: string
  isLoading?: boolean
  continueDisabled?: boolean
}

export function StepNav({
  onContinue,
  onBack,
  continueLabel = 'Continue →',
  isLoading = false,
  continueDisabled = false,
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginTop: '2.5rem',
      }}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary"
          style={{ minHeight: '52px', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
          disabled={isLoading}
        >
          ← Back
        </button>
      )}
      <button
        type="button"
        onClick={onContinue}
        disabled={continueDisabled || isLoading}
        className="btn-primary"
        style={{ minHeight: '52px', paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
      >
        {isLoading ? (
          <span className="flex items-center gap-1.5" aria-hidden="true">
            <LoadingDots />
            <span className="sr-only">Saving…</span>
          </span>
        ) : (
          continueLabel
        )}
      </button>
    </div>
  )
}

function LoadingDots() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            animation: `dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes dot-pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  )
}
