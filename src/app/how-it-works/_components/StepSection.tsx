import type { ReactNode } from 'react'
import { MaskedWords } from './MaskedWords'

export type StepNote = { text: string; hi?: boolean }

export type StepData = {
  num: string
  /** 'left' → art enters from the left; 'right' adds the `.right` modifier. */
  side: 'left' | 'right'
  /** Section ground class from the comp: 's-1' … 's-5'. */
  ground: string
  title: string
  lead: string
  body: string
  notes: StepNote[]
  art: ReactNode
}

/**
 * One "How It Works" step. Structure and class names are 1:1 with
 * templates/how_it_works.html (`.section.step[.right].s-N` → art → veil →
 * `.inner` with `.step-head` / `.step-title` / `.step-lead` / `.body-copy`
 * / `.step-note`).
 */
export function StepSection({ num, side, ground, title, lead, body, notes, art }: StepData) {
  return (
    <div className={`section step${side === 'right' ? ' right' : ''} ${ground}`}>
      {art}
      <div className="art-veil" />
      <div className="inner">
        <div className="step-head">
          <span className="step-num">{num}</span>
          <span className="step-rule" />
        </div>
        <h2 className="step-title">
          <MaskedWords text={title} />
        </h2>
        <p className="step-lead">{lead}</p>
        <p className="body-copy">{body}</p>
        <div className="step-note">
          {notes.map((note, i) => (
            <p className={note.hi ? 'hi' : undefined} key={i}>
              {note.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
