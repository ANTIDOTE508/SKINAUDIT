import { PRINCIPLE_RESOLVE_SVG } from './principleResolveMarkup'

/**
 * "The Principle" backdrop: noise resolving into signal — a dust field
 * settling as a clean line draws itself through it.
 *
 * Verbatim from the approved comp via dangerouslySetInnerHTML. `.res-dust`
 * / `.res-line` ambient animation lives in how-it-works.css.
 */
export function PrincipleResolveArt() {
  return (
    <div
      className="art-host"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: PRINCIPLE_RESOLVE_SVG }}
    />
  )
}
