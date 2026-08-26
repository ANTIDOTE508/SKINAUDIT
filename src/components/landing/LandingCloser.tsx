'use client'

import Link from 'next/link'
import { useScrollReveal } from './useScrollReveal'

const HEADLINE_WORDS = 'Make more informed choices.'.split(' ')

export default function LandingCloser() {
  const eyebrowRef = useScrollReveal<HTMLParagraphElement>()
  const headlineRef = useScrollReveal<HTMLParagraphElement>()
  const ctaRef = useScrollReveal<HTMLDivElement>()

  return (
    <section className="closer" id="closerSection">
      <p className="closer-eyebrow" ref={eyebrowRef}>
        The next step
      </p>

      <p className="closer-hl" ref={headlineRef}>
        {HEADLINE_WORDS.map((word, i) => (
          <span className="word" key={`${word}-${i}`}>
            <span className="inner" style={{ transitionDelay: `${i * 0.07}s` }}>
              {word}
            </span>
          </span>
        ))}
      </p>

      <div className="closer-cta-row" ref={ctaRef}>
        <Link className="cta" href="/onboarding">
          Start Your Audit <span aria-hidden="true">→</span>
        </Link>
        <a className="link" href="#how-it-works">
          Learn how it works
        </a>
      </div>
    </section>
  )
}
