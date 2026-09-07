import { MaskedWords } from './MaskedWords'

/**
 * The closing "Beyond the platform." section — its own component because
 * the body is bespoke: a lead line, the italic Journal name, a second
 * paragraph and an external CTA (opens the Substack in a new tab), rather
 * than the `.stack` + `.claim` shape the other sections share.
 */
export function JournalSection() {
  return (
    <div className="section">
      <div className="inner">
        <h2 className="disp sec-hed">
          <MaskedWords text="Beyond the platform." />
        </h2>

        <p className="body-copy">
          SkinAudit&apos;s thinking continues through its independent editorial publication,
        </p>

        <p className="journal-name">The Skin Audit</p>

        <p className="body-copy">
          Through essays, interviews, field observations and cultural analysis, the Journal examines
          skin beyond the routine — and the changing ideas, technologies and behaviors surrounding
          it.
        </p>

        <a
          className="cta"
          href="https://theskinaudit.substack.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Explore the Journal &nbsp;↗
        </a>
      </div>
    </div>
  )
}
