import Link from 'next/link'
import LandingNav from './LandingNav'

export default function LandingHero() {
  return (
    <section className="hero-section">
      <LandingNav />

      <div className="hero-content">
        <h1>
          Skincare
          <br />
          intelligence.
          <br />
          Finally.
        </h1>

        <p className="hero-description">
          SkinAudit helps you understand how your
          <br />
          skincare regimen works together, so you
          <br />
          can make more informed choices.
        </p>

        <Link className="audit-button" href="/onboarding">
          <span>Start Your Audit</span>
          <span className="button-arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </section>
  )
}
