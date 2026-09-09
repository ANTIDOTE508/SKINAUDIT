import { MaskedWords } from './MaskedWords'

export function HeroSection() {
  return (
    <div className="hero">
      <div className="inner">
        <p className="label">About</p>

        <h1 className="disp hero-lead">
          <MaskedWords text="Advancing a more informed understanding of skincare." />
        </h1>

        <div className="stack">
          {/* <p className="body-copy">
            Advancing a 
            more informed
            understanding 
            of skincare.
          </p> */}
          <p className="body-copy">
            SkinAudit is an independent skincare intelligence organization dedicated to improving how
            people understand the products they use, the routines they build, and the decisions they
            make about their skin.
          </p>
        </div>

        <div className="accrue">
          <p>The aim is not more skincare.</p>
          <p className="turn">It is greater clarity about the skincare you use.</p>
        </div>
      </div>
    </div>
  )
}
