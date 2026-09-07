import Link from 'next/link'
import { MaskedWords } from './MaskedWords'

export function CloserSection() {
  return (
    <div className="section sec-closer">
      <div className="inner">
        <p className="label">Begin</p>
        <h2 className="closer-hl">
          <MaskedWords text="Ready to see your routine differently?" />
        </h2>
        <div className="closer-actions">
          <Link href="/signup" className="cta">
            Start Your Audit &nbsp;→
          </Link>
          <Link href="/philosophy" className="link-2">
            Read the Philosophy
          </Link>
        </div>
      </div>
    </div>
  )
}
