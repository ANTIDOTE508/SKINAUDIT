import { TOPOGRAPHY_SVG } from './topographyMarkup'

/**
 * "Skin is not static" backdrop: stacked topographic contour lines. Skin
 * read as terrain — it responds to repetition, environment, treatments,
 * behaviour and time.
 *
 * This renders the exact hand-authored contour field from the approved
 * design source, kept verbatim in topographyMarkup.ts as a raw SVG
 * string so the artwork is pixel-identical to the comp. The inner <svg>
 * keeps the `art topo-art` classes so philosophy.css keeps driving the
 * slow philo-topo-drift animation and the `xMidYMid slice` positioning.
 */
export function TopographyArt() {
  return (
    <div
      className="topo-art-host"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: TOPOGRAPHY_SVG }}
    />
  )
}
