type Props = {
  size?: 'sm' | 'md' | 'lg'
}

const DIMENSIONS: Record<NonNullable<Props['size']>, { width: number; height: number }> = {
  sm: { width: 44, height: 64 },
  md: { width: 64, height: 92 },
  lg: { width: 96, height: 138 },
}

/**
 * Stand-in for a product photo until Product gains a real image field.
 * Renders a simple gradient bottle silhouette via inline SVG.
 */
export function ProductImagePlaceholder({ size = 'md' }: Props) {
  const { width, height } = DIMENSIONS[size]

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 92"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="bottle-placeholder-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-alabaster-400)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-alabaster-400)" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      <rect x="24" y="4" width="16" height="10" rx="2" fill="url(#bottle-placeholder-gradient)" />
      <rect x="14" y="16" width="36" height="72" rx="6" fill="url(#bottle-placeholder-gradient)" />
    </svg>
  )
}
