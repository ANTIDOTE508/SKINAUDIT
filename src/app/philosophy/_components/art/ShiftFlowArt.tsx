import { SHIFT_FLOW_SVG } from './shiftFlowMarkup'

/**
 * Background art for the sec-shift section ("From product literacy to
 * regimen literacy"): stacked flow lines + dot grid, faded left/right via
 * SVG masks. Renders the exact hand-authored markup from the approved
 * design source, kept verbatim in shiftFlowMarkup.ts as a raw SVG string
 * so the artwork is pixel-identical to the comp.
 */
export function ShiftFlowArt() {
  return (
    <div
      className="shift-art-host"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: SHIFT_FLOW_SVG }}
    />
  )
}
