import type { ReactNode } from 'react'
import { MaskedWords } from './MaskedWords'

export type SectionData = {
  heading: string
  paragraphs: string[]
  /** Trailing `.claim` line. A `lead` renders as the comp's `.quiet` span
   *  (normal weight, dim) prefixed to the italic accent sentence. */
  claim?: { lead?: string; text: string }
  /** Optional extra block after the paragraphs (e.g. the Journal name + CTA). */
  extra?: ReactNode
}

/**
 * One `/about` content section. Structure and class names are 1:1 with
 * templates/about.html (`.section` → `.inner` (centred) with
 * `.disp.sec-hed` → `.stack` of `.body-copy` → optional `.claim`).
 */
export function Section({ heading, paragraphs, claim, extra }: SectionData) {
  return (
    <div className="section">
      <div className="inner">
        <h2 className="disp sec-hed">
          <MaskedWords text={heading} />
        </h2>

        {paragraphs.length > 0 && (
          <div className="stack">
            {paragraphs.map((p, i) => (
              <p className="body-copy" key={i}>
                {p}
              </p>
            ))}
          </div>
        )}

        {claim && (
          <p className="claim">
            {claim.lead ? <span className="quiet">{claim.lead}</span> : null}
            {claim.text}
          </p>
        )}

        {extra}
      </div>
    </div>
  )
}
