import { HeroLensesArt } from './art/HeroLensesArt'

export function HeroSection() {
  return (
    <div className="hero">
      <HeroLensesArt />
      <div className="art-veil" />
      <div className="inner hero-inner">
        <p className="label">Philosophy</p>

        <h1 className="disp hero-lead">Skincare was never just a list of products.</h1>

        <p className="hero-system">Your skin experiences a routine as a system.</p>

        <div className="hero-cols">
          <p className="body-copy">
            Products overlap. Ingredients interact. Treatments intervene. Weather changes. Habits
            shift. And what worked six months ago may not make sense today.
          </p>
          <div className="hero-idea">
            <span className="idea-tag">SkinAudit was built around a simple idea:</span>
            <p className="idea-line">
              Understanding the relationship between these things matters as much as understanding
              the things themselves.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
