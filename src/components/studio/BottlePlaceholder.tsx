'use client'

/**
 * Bottle silhouette placeholder — drawn entirely with gradients so the row
 * reads as product photography without shipping any image assets. The neck
 * and shoulder are separate blocks so the form stays legible at 90x130.
 *
 * Every dimension is a fixed pixel value and all fills are proportional, so
 * the mobile circular minis reuse this exact DOM under a CSS transform:scale()
 * rather than duplicating the artwork at a second size.
 *
 * `showBadge` is off for the mobile treatment, where the step number sits
 * beneath the circle instead of on the bottle.
 */
export function BottlePlaceholder({
  step,
  showBadge = true,
}: {
  step: number
  showBadge?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        width: '90px',
        height: '130px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      {/* Numbered badge */}
      {showBadge && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            border: '1px solid var(--color-accent-border)',
            backgroundColor: 'var(--color-accent-subtle)',
            color: 'var(--color-sienna-300)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '9px',
            lineHeight: '16px',
            textAlign: 'center',
            letterSpacing: '0',
          }}
        >
          {step}
        </span>
      )}

      {/* Cap */}
      <div
        style={{
          width: '22px',
          height: '16px',
          borderRadius: '2px 2px 0 0',
          background:
            'linear-gradient(180deg, var(--color-obsidian-700) 0%, var(--color-obsidian-800) 100%)',
        }}
      />
      {/* Neck */}
      <div
        style={{
          width: '30px',
          height: '8px',
          background:
            'linear-gradient(180deg, var(--color-obsidian-800) 0%, var(--color-obsidian-700) 100%)',
        }}
      />
      {/* Body */}
      <div
        style={{
          width: '58px',
          height: '86px',
          borderRadius: '4px 4px 6px 6px',
          background:
            'linear-gradient(180deg, rgba(212,169,106,0.10) 0%, rgba(184,134,61,0.05) 45%, var(--color-obsidian-800) 100%)',
          border: '1px solid var(--color-obsidian-700)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Specular highlight — the detail that sells it as glass */}
        <div
          style={{
            position: 'absolute',
            left: '9px',
            top: '10px',
            width: '5px',
            height: '46px',
            borderRadius: '3px',
            background:
              'linear-gradient(180deg, rgba(250,250,248,0.14) 0%, rgba(250,250,248,0) 100%)',
          }}
        />
        {/* Label band */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '22px',
            height: '20px',
            backgroundColor: 'rgba(250,250,248,0.04)',
            borderTop: '1px solid rgba(250,250,248,0.05)',
            borderBottom: '1px solid rgba(250,250,248,0.05)',
          }}
        />
      </div>
    </div>
  )
}
