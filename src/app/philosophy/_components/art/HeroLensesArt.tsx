/**
 * Hero backdrop: overlapping translucent "lens" fields (screen-blended
 * fills) with matching outline rings. Products overlap, ingredients
 * interact. The six groups orbit at different rates (philosophy.css) so
 * their intersections keep re-forming.
 */

// Tint per gradient — small hue drift so the overlaps don't read as flat.
const TINTS = [
  'rgb(188,169,148)', 'rgb(184,166,146)', 'rgb(185,167,147)', 'rgb(192,173,152)',
  'rgb(188,170,149)', 'rgb(178,161,142)', 'rgb(192,173,151)', 'rgb(186,167,147)',
  'rgb(188,170,149)', 'rgb(190,171,150)', 'rgb(186,168,147)', 'rgb(179,162,142)',
  'rgb(182,164,144)', 'rgb(187,169,148)', 'rgb(179,162,142)', 'rgb(192,173,151)',
  'rgb(184,166,146)', 'rgb(192,173,151)', 'rgb(188,170,149)', 'rgb(189,170,149)',
  'rgb(183,165,145)', 'rgb(187,168,147)', 'rgb(188,169,148)', 'rgb(195,175,153)',
  'rgb(188,169,148)', 'rgb(188,170,149)',
]

type Lens = { cx: number; cy: number; r: number; g: number }

// Fill groups (screen-blended). `g` is the gradient index used for fill.
const FILL_A: Lens[] = [
  { cx: 615, cy: 811.8, r: 212.2, g: 0 }, { cx: 955.5, cy: 138.4, r: 225.7, g: 3 },
  { cx: 459.1, cy: 574.7, r: 137.5, g: 6 }, { cx: 862.5, cy: 873.9, r: 264.1, g: 9 },
  { cx: 556.1, cy: 777.5, r: 201.9, g: 12 }, { cx: 1407.4, cy: 308.4, r: 238.7, g: 15 },
  { cx: 837.5, cy: 692.7, r: 170.1, g: 18 }, { cx: 265, cy: 684.3, r: 232.7, g: 21 },
  { cx: 453.7, cy: 431, r: 296.5, g: 24 },
]
const FILL_B: Lens[] = [
  { cx: 1078.9, cy: 410.4, r: 193.4, g: 1 }, { cx: 536.3, cy: 760.9, r: 127.2, g: 4 },
  { cx: 877.6, cy: 217.5, r: 152.1, g: 7 }, { cx: 357.6, cy: 482.8, r: 144.6, g: 10 },
  { cx: 812.8, cy: 145.5, r: 305.8, g: 13 }, { cx: 735, cy: 416.7, r: 391.6, g: 16 },
  { cx: 778, cy: 409.6, r: 152, g: 19 }, { cx: 1032.4, cy: 582.4, r: 143.9, g: 22 },
  { cx: 876.3, cy: 342.5, r: 143, g: 25 },
]
const FILL_C: Lens[] = [
  { cx: 1155.5, cy: 399.1, r: 268.7, g: 2 }, { cx: 605.3, cy: 826.1, r: 155, g: 5 },
  { cx: 1082.5, cy: 371, r: 209.4, g: 8 }, { cx: 1161.5, cy: 158.2, r: 215.4, g: 11 },
  { cx: 330.7, cy: 442.4, r: 168, g: 14 }, { cx: 800, cy: 622.9, r: 199.5, g: 17 },
  { cx: 526.8, cy: 263.9, r: 403.1, g: 20 }, { cx: 1128.7, cy: 514.6, r: 226.8, g: 23 },
]

// Ring groups (outline only). Opacity cycles 0.15 → 0.255.
const RING_OPACITIES = [0.15, 0.255, 0.22, 0.185]
function ringOpacity(i: number) {
  return RING_OPACITIES[i % RING_OPACITIES.length]
}

function FillGroup({ lenses, className }: { lenses: Lens[]; className: string }) {
  return (
    <g className={className} style={{ mixBlendMode: 'screen' }}>
      {lenses.map(({ cx, cy, r, g }, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={`url(#philo-hl${g})`} />
      ))}
    </g>
  )
}

function RingGroup({ lenses, className }: { lenses: Lens[]; className: string }) {
  return (
    <g className={className}>
      {lenses.map(({ cx, cy, r }, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgb(196,176,154)"
          strokeOpacity={ringOpacity(i)}
          strokeWidth={1}
        />
      ))}
    </g>
  )
}

export function HeroLensesArt() {
  return (
    <svg
      className="art"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        {TINTS.map((tint, i) => (
          <radialGradient key={i} id={`philo-hl${i}`}>
            <stop offset="0" stopColor={tint} stopOpacity="0.26" />
            <stop offset="0.45" stopColor={tint} stopOpacity="0.1" />
            <stop offset="1" stopColor={tint} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      <FillGroup lenses={FILL_A} className="hl-a" />
      <FillGroup lenses={FILL_B} className="hl-b" />
      <FillGroup lenses={FILL_C} className="hl-c" />
      <RingGroup lenses={FILL_A} className="hr-a" />
      <RingGroup lenses={FILL_B} className="hr-b" />
      <RingGroup lenses={FILL_C} className="hr-c" />
    </svg>
  )
}
