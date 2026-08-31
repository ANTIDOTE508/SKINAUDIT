/**
 * "Skin is not static" backdrop: stacked topographic contour lines. Skin
 * read as terrain — it responds to repetition, environment, treatments,
 * behaviour and time.
 *
 * The original was a hand-drawn contour field. Here the ridgelines are
 * generated from layered sine bands with a seeded jitter so the layout is
 * stable across renders (no hydration mismatch). The whole group drifts
 * slowly (philo-topo-drift in philosophy.css).
 */

const VIEW_W = 1600
const VIEW_H = 900
const LINES = 44 // contour count
const STEP = 18 // horizontal sampling resolution in px

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildLine(index: number, rand: () => number) {
  const baseY = (VIEW_H / (LINES - 1)) * index - VIEW_H * 0.05
  // Each contour gets its own phase offsets so lines don't run parallel.
  const p1 = rand() * Math.PI * 2
  const p2 = rand() * Math.PI * 2
  const p3 = rand() * Math.PI * 2
  const a1 = 26 + rand() * 14
  const a2 = 10 + rand() * 10
  const a3 = 4 + rand() * 6

  const pts: string[] = []
  for (let x = 0; x <= VIEW_W; x += STEP) {
    const t = x / VIEW_W
    const y =
      baseY +
      Math.sin(t * 7 + p1) * a1 +
      Math.sin(t * 17 + p2) * a2 +
      Math.sin(t * 41 + p3) * a3 +
      // gentle downhill drift toward the right so bands feel like terrain
      t * 34 * (0.4 + index / LINES)
    pts.push(`${x},${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

export function TopographyArt() {
  const rand = mulberry32(0x70b0)
  const lines = Array.from({ length: LINES }, (_, i) => buildLine(i, rand))

  return (
    <svg
      className="art topo-art"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {lines.map((points, i) => {
        // Deeper lines read slightly heavier / warmer.
        const depth = i / (LINES - 1)
        const opacity = (0.16 + depth * 0.42).toFixed(3)
        const width = (0.7 + depth * 1.15).toFixed(2)
        const g = Math.round(156 + depth * 22)
        return (
          <polyline
            key={i}
            points={points}
            fill="none"
            stroke={`rgb(${173 + Math.round(depth * 23)},${g},${138 + Math.round(depth * 16)})`}
            strokeOpacity={opacity}
            strokeWidth={width}
            strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}
