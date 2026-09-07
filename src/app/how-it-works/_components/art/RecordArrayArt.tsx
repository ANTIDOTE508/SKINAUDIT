import { RECORD_ARRAY_SVG } from './recordArrayMarkup'

/**
 * Step 01 backdrop: the record array — a field of empty cells that fill in
 * one after another, the dossier being built.
 *
 * Verbatim from the approved comp via dangerouslySetInnerHTML (same
 * approach as /philosophy). `.rec-fill` / `.rec-bar` ambient animation
 * lives in how-it-works.css.
 */
export function RecordArrayArt() {
  return (
    <div
      className="art-host"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: RECORD_ARRAY_SVG }}
    />
  )
}
