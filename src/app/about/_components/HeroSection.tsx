import { MaskedWords } from './MaskedWords'

export function HeroSection() {
  return (
    <div className="hero">
      <div className="inner">
        <p className="label">About</p>

        <h1 className="disp hero-lead">
          <MaskedWords text="Built for a more informed relationship with skincare." />
        </h1>

        <div className="stack">
          <p className="body-copy">
            SkinAudit is an independent skincare intelligence platform created to help people better
            understand the routines they already have — and make more informed choices about what
            belongs in them.
          </p>
          <p className="body-copy">
            It began with a simple observation: skincare has become increasingly sophisticated, but
            understanding how everything fits together has not.
          </p>
        </div>

        <div className="accrue">
          <p>More products.</p>
          <p>More ingredients.</p>
          <p>More treatments.</p>
          <p>More information.</p>
          <p className="turn">Not necessarily more clarity.</p>
        </div>
      </div>
    </div>
  )
}
