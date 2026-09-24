'use client'

import { useState, useTransition } from 'react'
import { updateDossierProductNotes } from '@/app/actions/dossier'
import './dossierNotes.css'

const NOTES_MAX_LENGTH = 2000

interface DossierNotesProps {
  dossierProductId: number
  notes: string | null
  /** Mockup 10 shows a "Personal notes" label inside the box; mockup 12 does not. */
  label?: string
  placeholder: string
}

/**
 * Personal notes of a Dossier product, edited in place: the note (or a prompt)
 * is a button that swaps to a textarea with Save / Cancel. Renders the inside
 * of the notes box — the caller owns the box itself.
 */
export function DossierNotes({ dossierProductId, notes, label, placeholder }: DossierNotesProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputId = `dossier-notes-${dossierProductId}`

  const save = () => {
    setError(null)
    startTransition(async () => {
      try {
        await updateDossierProductNotes(dossierProductId, draft)
        setEditing(false)
      } catch {
        setError('Your note could not be saved. Please try again.')
      }
    })
  }

  const cancel = () => {
    setDraft(notes ?? '')
    setError(null)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="dn-display"
        onClick={() => setEditing(true)}
        aria-label={notes ? 'Edit personal notes' : 'Add a personal note'}
      >
        {label && <span className="dn-label">{label}</span>}
        {notes ? (
          <span className="dn-text">{notes}</span>
        ) : (
          <span className="dn-placeholder">{placeholder}</span>
        )}
      </button>
    )
  }

  return (
    <>
      <label htmlFor={inputId} className={label ? 'dn-label' : 'dn-label dn-sr-only'}>
        {label ?? 'Personal notes'}
      </label>
      <textarea
        id={inputId}
        className="dn-input"
        value={draft}
        maxLength={NOTES_MAX_LENGTH}
        rows={4}
        autoFocus
        placeholder="Texture, results, reactions, when you use it…"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation()
            cancel()
          }
        }}
      />
      {error && (
        <p className="dn-error" role="alert">
          {error}
        </p>
      )}
      <div className="dn-actions">
        <button type="button" className="dn-btn" onClick={cancel} disabled={isPending}>
          Cancel
        </button>
        <button type="button" className="dn-btn primary" onClick={save} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </>
  )
}
