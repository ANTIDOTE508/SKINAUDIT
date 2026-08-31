import Link from 'next/link'

/**
 * Local nav for the /philosophy route. Mirrors the landing nav's look but
 * marks Philosophy as the current section. No mobile burger — the two
 * secondary links simply hide under 760px (see philosophy.css).
 */
export function PhilosophyNav() {
  return (
    <div className="nav">
      <Link className="nav-brand" href="/">
        SkinAudit
      </Link>
      <div className="nav-links">
        <Link className="here" href="/philosophy" aria-current="page">
          Philosophy
        </Link>
        <Link href="/#how-it-works">How It Works</Link>
        <Link href="/#journal">Journal</Link>
        <Link className="sign-in" href="/signin">
          Sign In
        </Link>
      </div>
    </div>
  )
}
