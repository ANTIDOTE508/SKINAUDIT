'use client'

type Props = {
  onContinue: () => void
  onBack?: () => void
  continueLabel?: string
  isLoading?: boolean
  continueDisabled?: boolean
}

/**
 * Step navigation: Back on the left, Next on the right. Sits in the normal
 * flow directly below the step content rather than pinned to the viewport.
 * Each arrow lives inside its button so the whole label + arrow pair is one
 * click target. Replaces StepNav's centred button pair — StepNav itself is
 * kept for other uses.
 */
export function StepFooter({
  onContinue,
  onBack,
  continueLabel = 'Next',
  isLoading = false,
  continueDisabled = false,
}: Props) {
  return (
    <div className="screen-footer">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="text-button text-button-back"
          disabled={isLoading}
        >
          <span className="arrow" aria-hidden="true">
            ←
          </span>
          Back
        </button>
      ) : (
        // Holds the left slot so `space-between` keeps Next on the right for
        // the steps that have no Back action.
        <span />
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={continueDisabled || isLoading}
        className="text-button text-button-next"
      >
        {isLoading ? 'Saving…' : continueLabel}
        <span className="arrow" aria-hidden="true">
          →
        </span>
      </button>
    </div>
  )
}
