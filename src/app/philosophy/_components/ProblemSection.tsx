import { InterferenceArt } from './art/InterferenceArt'

export function ProblemSection() {
  return (
    <div className="section sec-problem">
      <InterferenceArt />
      <div className="art-veil" />
      <div className="inner">
        <p className="label">The Problem</p>

        <h2
          className="disp"
          style={{
            fontSize: 'clamp(1.875rem, 4.4vw, 4rem)',
            maxWidth: '19ch',
            margin: 'clamp(2rem, 5vh, 3.25rem) 0 clamp(2.5rem, 6vh, 3.75rem)',
          }}
        >
          We have more skincare information than ever. And less clarity about what to do with it.
        </h2>

        <p className="body-copy">Most skincare tools begin with a product.</p>

        <div className="q-stack">
          <p className="q">Is this ingredient good?</p>
          <p className="q">Is this product compatible with my skin type?</p>
          <p className="q">What should I buy next?</p>
        </div>

        <p className="pivot">SkinAudit begins somewhere else:</p>
        <p className="pivot-q">What is already happening in your regimen?</p>

        <p className="body-copy" style={{ marginTop: 'clamp(2.5rem, 6vh, 3.5rem)' }}>
          Because a product can make sense on its own and still make less sense within the system
          surrounding it.
        </p>
      </div>
    </div>
  )
}
