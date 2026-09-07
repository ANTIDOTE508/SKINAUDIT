import { ABOUT_FIELD_SVG } from './aboutFieldMarkup'

/**
 * The whole-page backdrop for /about: one derivation — many separate terms
 * at the top, routed down orthogonal tracks, merging at junctions and
 * resolving into a single solution at the foot.
 *
 * Rendered verbatim from the approved comp (aboutFieldMarkup.ts) via
 * dangerouslySetInnerHTML, exactly like /philosophy's TopographyArt, so the
 * artwork stays pixel-identical. The injected <svg> keeps its `field` class
 * so about.css keeps driving the `.pulse` / `.join` / `.solve` ambient
 * animation and the `xMidYMid slice` positioning; <AboutMotion /> adds the
 * scroll-linked drift and track draw-in.
 */
export function AboutField() {
  return (
    <div
      className="field-wrap"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ABOUT_FIELD_SVG }}
    />
  )
}
