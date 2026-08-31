/**
 * Closing backdrop: a point cloud that thickens toward the lower-right,
 * where the density buckets (em-0 … em-7) breathe out of phase and each
 * point "ignites" in turn — a piece of information coming to light.
 *
 * The original was a one-off scatter; here the clusters are regenerated
 * deterministically so the file stays small. A tiny seeded PRNG keeps the
 * layout stable between renders (no hydration mismatch).
 */

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Bucket = {
  className: string
  count: number
  opacity: number
  r: [number, number]
  // centre bias — later buckets crowd the lower-right hotspot
  cx: [number, number]
  cy: [number, number]
  delayBase: number
}

const BUCKETS: Bucket[] = [
  { className: 'em-g em-0', count: 138, opacity: 0.05, r: [0.7, 0.8], cx: [40, 1446], cy: [4, 807], delayBase: 12.7 },
  { className: 'em-g em-1', count: 54, opacity: 0.101, r: [0.8, 1.0], cx: [480, 1447], cy: [58, 808], delayBase: 9.03 },
  { className: 'em-g em-2', count: 57, opacity: 0.153, r: [1.0, 1.1], cx: [655, 1448], cy: [200, 808], delayBase: 5.16 },
  { className: 'em-g em-3', count: 26, opacity: 0.204, r: [1.1, 1.3], cx: [768, 1380], cy: [287, 727], delayBase: 3.4 },
  { className: 'em-g em-4', count: 21, opacity: 0.256, r: [1.3, 1.5], cx: [847, 1290], cy: [345, 671], delayBase: 1.97 },
  { className: 'em-g em-5', count: 15, opacity: 0.307, r: [1.5, 1.7], cx: [915, 1214], cy: [372, 594], delayBase: 0.95 },
  { className: 'em-g em-6', count: 7, opacity: 0.359, r: [1.8, 2.0], cx: [961, 1167], cy: [464, 573], delayBase: 0.48 },
  { className: 'em-g em-7', count: 7, opacity: 0.41, r: [2.0, 2.1], cx: [1050, 1085], cy: [465, 524], delayBase: 0 },
]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function EmergenceArt() {
  const rand = mulberry32(0x5c1a)

  return (
    <svg
      className="art"
      viewBox="0 0 1440 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {BUCKETS.map((b) => (
        <g key={b.className} className={b.className} fill="rgb(212,194,174)" fillOpacity={b.opacity}>
          {Array.from({ length: b.count }, (_, i) => {
            const cx = lerp(b.cx[0], b.cx[1], rand())
            const cy = lerp(b.cy[0], b.cy[1], rand())
            const r = lerp(b.r[0], b.r[1], rand())
            const delay = (b.delayBase + i * 0.067).toFixed(2)
            return <circle key={i} cx={cx.toFixed(1)} cy={cy.toFixed(1)} r={r.toFixed(1)} style={{ animationDelay: `${delay}s` }} />
          })}
        </g>
      ))}
    </svg>
  )
}
