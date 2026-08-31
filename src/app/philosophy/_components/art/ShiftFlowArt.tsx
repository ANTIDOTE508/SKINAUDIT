/**
 * "The Shift" backdrop: on the left, a grid of discrete points (product
 * literacy). On the right, connected flowing lines (regimen literacy).
 * A horizontal gradient mask fades one into the other. The points drift
 * gently; the flow streams past them, alternate lines travelling in
 * opposite directions (philosophy.css: sh-dots / st-a … st-d).
 */

const VIEW_W = 1440
const VIEW_H = 1000

// ── discrete point grid (masked to the left) ──
const DOT_COLS = 56
const DOT_ROWS = 34

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function DotField() {
  const rand = mulberry32(0x5d07)
  const dots: { x: number; y: number }[] = []
  const dx = VIEW_W / (DOT_COLS - 1)
  const dy = VIEW_H / (DOT_ROWS - 1)
  for (let r = 0; r < DOT_ROWS; r++) {
    for (let c = 0; c < DOT_COLS; c++) {
      // small organic wobble so the grid doesn't read as mechanical
      const x = c * dx + (rand() - 0.5) * 10
      const y = r * dy + Math.sin(c * 0.4 + r * 0.6) * 6 + (rand() - 0.5) * 6
      dots.push({ x, y })
    }
  }
  return (
    <g className="sh-dots" fill="rgb(196,176,154)" fillOpacity="0.55">
      {dots.map(({ x, y }, i) => (
        <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={1.2} />
      ))}
    </g>
  )
}

// ── flowing streams (masked to the right) ──
const STREAM_CLASSES = ['st-a', 'st-b', 'st-c', 'st-d']
const STREAM_ROWS = 9

function buildStream(row: number, rand: () => number) {
  const baseY = (VIEW_H / (STREAM_ROWS + 1)) * (row + 1)
  const p1 = rand() * Math.PI * 2
  const p2 = rand() * Math.PI * 2
  const a1 = 18 + rand() * 12
  const a2 = 6 + rand() * 8
  const pts: string[] = []
  // Draw twice the width so the streamFwd/streamRev translate loops seamlessly.
  for (let x = 0; x <= VIEW_W * 2; x += 6) {
    const t = x / VIEW_W
    const y = baseY + Math.sin(t * 5 + p1) * a1 + Math.sin(t * 13 + p2) * a2
    pts.push(`${x},${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

function StreamField() {
  const rand = mulberry32(0x57ea)
  return (
    <g
      fill="none"
      stroke="rgb(206,188,168)"
      strokeOpacity="0.34"
      strokeWidth={1}
      strokeLinecap="round"
    >
      {Array.from({ length: STREAM_ROWS }, (_, row) => (
        <g key={row} className={STREAM_CLASSES[row % STREAM_CLASSES.length]}>
          <polyline points={buildStream(row, rand)} />
        </g>
      ))}
    </g>
  )
}

export function ShiftFlowArt() {
  return (
    <svg
      className="art"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="philo-shFadeD" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.42" stopColor="#7a7a7a" />
          <stop offset="0.82" stopColor="#0d0d0d" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <linearGradient id="philo-shFadeL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.32" stopColor="#0a0a0a" />
          <stop offset="0.68" stopColor="#8f8f8f" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <mask id="philo-shMaskD" maskUnits="userSpaceOnUse" x="0" y="0" width={VIEW_W} height={VIEW_H}>
          <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#philo-shFadeD)" />
        </mask>
        <mask id="philo-shMaskL" maskUnits="userSpaceOnUse" x="0" y="0" width={VIEW_W} height={VIEW_H}>
          <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#philo-shFadeL)" />
        </mask>
      </defs>

      <g mask="url(#philo-shMaskD)">
        <DotField />
      </g>
      <g mask="url(#philo-shMaskL)">
        <StreamField />
      </g>
    </svg>
  )
}
