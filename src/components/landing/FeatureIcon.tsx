export type FeatureIconVariant = 'system' | 'context' | 'evolution' | 'decisions'

/**
 * Line-art SVG icons, ported verbatim from the template's 44×44 viewBox
 * glyphs — interconnected nodes, concentric rings, an ascending spiral, and
 * a branching path with a chosen route.
 */
export default function FeatureIcon({ variant }: { variant: FeatureIconVariant }) {
  return (
    <svg
      className="feat-icon"
      viewBox="0 0 44 44"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {variant === 'system' && (
        <>
          <circle cx="22" cy="7" r="2.5" />
          <circle cx="7" cy="34" r="2.5" />
          <circle cx="37" cy="34" r="2.5" />
          <circle cx="22" cy="22" r="2" />
          <line x1="22" y1="9.5" x2="22" y2="20" />
          <line x1="8.8" y1="32.2" x2="20.6" y2="23.3" />
          <line x1="35.2" y1="32.2" x2="23.4" y2="23.3" />
          <path d="M9.5 33 Q22 42 34.5 33" strokeDasharray="2 3" />
          <circle cx="14" cy="15" r="1.2" fill="currentColor" stroke="none" opacity="0.4" />
          <circle cx="30" cy="15" r="1.2" fill="currentColor" stroke="none" opacity="0.4" />
          <circle cx="22" cy="38" r="1.2" fill="currentColor" stroke="none" opacity="0.4" />
          <line x1="14" y1="15" x2="20.2" y2="21" opacity="0.4" />
          <line x1="30" y1="15" x2="23.8" y2="21" opacity="0.4" />
        </>
      )}

      {variant === 'context' && (
        <>
          <circle cx="22" cy="22" r="3" />
          <circle cx="22" cy="22" r="9" strokeDasharray="1 3.5" />
          <circle cx="22" cy="22" r="16" opacity="0.5" strokeDasharray="1 4" />
          <line x1="22" y1="4" x2="22" y2="7" opacity="0.4" />
          <line x1="22" y1="37" x2="22" y2="40" opacity="0.4" />
          <line x1="4" y1="22" x2="7" y2="22" opacity="0.4" />
          <line x1="37" y1="22" x2="40" y2="22" opacity="0.4" />
          <circle cx="22" cy="22" r="1.5" fill="currentColor" stroke="none" />
        </>
      )}

      {variant === 'evolution' && (
        <>
          <path d="M22 38 C14 38 9 34 9 28 C9 21 15 18 22 18 C29 18 35 21 35 27 C35 32 31 35 26 35 C21 35 17 32 17 27 C17 23 20 21 23 21" />
          <polyline points="20,16 23,21 26,16" />
        </>
      )}

      {variant === 'decisions' && (
        <>
          <line x1="22" y1="38" x2="22" y2="24" />
          <path d="M22 24 Q14 18 10 10" opacity="0.25" />
          <path d="M22 24 Q30 18 34 10" opacity="0.25" />
          <line x1="22" y1="24" x2="22" y2="8" />
          <polyline points="19,11 22,7 25,11" />
          <circle cx="22" cy="24" r="2" fill="currentColor" stroke="none" />
          <circle cx="10" cy="10" r="1.5" opacity="0.25" />
          <circle cx="34" cy="10" r="1.5" opacity="0.25" />
        </>
      )}
    </svg>
  )
}
