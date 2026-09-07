import { RITUAL_TRACKS_SVG } from './ritualTracksMarkup'

/**
 * Step 02 backdrop: morning and evening tracks — two ordered sequences
 * read left to right, the ritual as a whole.
 *
 * Verbatim from the approved comp via dangerouslySetInnerHTML. `.trk-link`
 * / `.trk-node` ambient animation lives in how-it-works.css.
 */
export function RitualTracksArt() {
  return (
    <div
      className="art-host"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: RITUAL_TRACKS_SVG }}
    />
  )
}
