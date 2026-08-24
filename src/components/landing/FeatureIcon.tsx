export type FeatureIconVariant = 'person' | 'flower' | 'target' | 'check'

/** Glyph-based variants render a character; shape-based ones are drawn in CSS. */
const GLYPHS: Partial<Record<FeatureIconVariant, string>> = {
  flower: '✣',
  check: '✓',
}

export default function FeatureIcon({ variant }: { variant: FeatureIconVariant }) {
  const glyph = GLYPHS[variant]

  return (
    <div className={`feature-icon ${variant}-icon`} aria-hidden="true">
      {glyph ?? <span />}
    </div>
  )
}
