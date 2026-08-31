import Link from 'next/link'
import { EmergenceArt } from './art/EmergenceArt'

export function CloserSection() {
  return (
    <div className="section sec-closer">
      <EmergenceArt />
      <div className="art-veil" />
      <div className="inner">
        <p className="label">The Next Step</p>

        <h2 className="closer-hl">
          Your routine is already producing information. <em>SkinAudit helps you see it.</em>
        </h2>

        <div className="closer-actions">
          <Link className="cta" href="/signin">
            Start Your Audit &nbsp;→
          </Link>
          <Link className="link-2" href="/#how-it-works">
            See How It Works
          </Link>
        </div>
      </div>
    </div>
  )
}
