import { HERO_LATTICE_SVG } from './heroLatticeMarkup'

/**
 * Hero backdrop for /how-it-works: the signal lattice coming online — a
 * grid of tick marks with routed paths and pulsing nodes.
 *
 * Rendered verbatim from the approved comp (heroLatticeMarkup.ts) via
 * dangerouslySetInnerHTML, exactly like /philosophy's TopographyArt, so
 * the artwork stays pixel-identical. The injected <svg> keeps its `art`
 * class so how-it-works.css keeps driving the `.lat-flow` / `.lat-node`
 * ambient animation and the `xMidYMid slice` positioning.
 */
export function HeroLatticeArt() {
  return (
    <div
      className="art-host"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: HERO_LATTICE_SVG }}
    />
  )
}
