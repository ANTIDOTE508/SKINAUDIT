import { TopographyArt } from './art/TopographyArt'

/**
 * The full-bleed "Skin is not static" band, immediately followed by the
 * context split that carries its point forward.
 */
export function TopographySection() {
  return (
    <>
      <div className="topo-wrap">
        <TopographyArt />
        <div className="topo-veil" />
        <div className="topo-copy">
          <h2 className="topo-hed">
            Skin is
            <br />
            not static.
          </h2>
        </div>
      </div>

      <div className="section sec-context" style={{ borderTop: 'none' }}>
        <div className="inner after-topo">
          <p className="body-copy">
            It responds to repetition, environment, treatments, behavior and time. That means
            understanding a routine requires context.
          </p>

          <div className="ctx-split">
            <div className="ctx-block">
              <span className="ctx-key">Not simply</span>
              <p className="ctx-val" style={{ color: 'var(--dim)' }}>
                What are you using?
              </p>
            </div>
            <div className="ctx-block full">
              <span className="ctx-key">But</span>
              <p className="ctx-val">
                What are you using, together, under what conditions, and what happened next?
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
