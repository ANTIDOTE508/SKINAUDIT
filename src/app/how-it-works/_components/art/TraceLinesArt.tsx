import { TRACE_LINES_SVG } from './traceLinesMarkup'

/**
 * Step 05 backdrop: longitudinal traces — the record moving past over
 * time, marks streaming horizontally.
 *
 * Verbatim from the approved comp via dangerouslySetInnerHTML. `.tr-line`
 * / `.tr-mark` ambient animation lives in how-it-works.css.
 */
export function TraceLinesArt() {
  return (
    <div
      className="art-host"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: TRACE_LINES_SVG }}
    />
  )
}
