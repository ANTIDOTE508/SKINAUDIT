import { HeroLatticeArt } from './art/HeroLatticeArt'
import { MaskedWords } from './MaskedWords'

export function HeroSection() {
  return (
    <div className="hero">
      <HeroLatticeArt />
      <div className="art-veil" />
      <div className="inner hero-inner">
        <p className="label">How It Works</p>

        <h1 className="hero-lead">
          <MaskedWords text="Your routine, understood in context." />
        </h1>

        <div className="hero-cols">
          <p className="body-copy">
            SkinAudit brings the different parts of your skincare routine into one place, helping
            you see how they work together and how your regimen evolves over time.
          </p>
          <div className="hero-claim">
            <p>You bring the routine.</p>
            <p className="hi">SkinAudit brings the perspective.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
