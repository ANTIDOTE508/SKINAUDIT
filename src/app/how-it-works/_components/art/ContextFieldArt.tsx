import { CONTEXT_FIELD_SVG } from './contextFieldMarkup'

/**
 * Step 03 backdrop: the surrounding field — context circling and feeding
 * inward toward the routine.
 *
 * Verbatim from the approved comp via dangerouslySetInnerHTML. `.ctx-ring`
 * / `.ctx-spoke` / `.ctx-sat` ambient animation lives in how-it-works.css.
 */
export function ContextFieldArt() {
  return (
    <div
      className="art-host"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: CONTEXT_FIELD_SVG }}
    />
  )
}
