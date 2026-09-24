import type { DossierProductStatus } from '@prisma/client'
import type { TimelineEntry } from '@/lib/dossier-history'
import { DossierNotes } from './DossierNotes'
import { DossierTopbar } from './DossierTopbar'
import { STATUS_LABELS } from './dossierListing'
import './productHistory.css'

interface ProductHistoryProps {
  dossierProductId: number
  brandName: string | null
  productName: string
  status: DossierProductStatus
  daysInDossier: number
  notes: string | null
  /** Oldest first, as the mockup reads. */
  timeline: TimelineEntry[]
}

/** Dossier product history — mockup 12 (templates/buildDossier/screen12.html). */
export function ProductHistory({
  dossierProductId,
  brandName,
  productName,
  status,
  daysInDossier,
  notes,
  timeline,
}: ProductHistoryProps) {
  return (
    <div className="ph-page">
      <DossierTopbar
        title="History"
        backHref={`/dossier/${dossierProductId}`}
        backLabel="Back to product"
        product={{ brandName, productName }}
      />

      <div className="ph-body">
        <section aria-labelledby="ph-glance">
          <h2 id="ph-glance" className="ph-section-label">
            At a Glance
          </h2>
          <dl className="ph-summary">
            <div className="ph-summary-cell">
              <dt className="ph-summary-key">{daysInDossier === 1 ? 'Day' : 'Days'} in Dossier</dt>
              <dd className="ph-summary-val">{daysInDossier}</dd>
            </div>
            <div className="ph-summary-cell">
              <dt className="ph-summary-key">Times Used</dt>
              {/* Usage is not tracked yet. */}
              <dd className="ph-summary-val">—</dd>
            </div>
            <div className="ph-summary-cell">
              <dt className="ph-summary-key">Current Status</dt>
              <dd className="ph-summary-val">{STATUS_LABELS[status]}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="ph-timeline">
          <h2 id="ph-timeline" className="ph-section-label">
            Timeline
          </h2>
          {timeline.length === 0 ? (
            <p className="ph-empty">No history recorded yet.</p>
          ) : (
            <ol className="ph-timeline">
              {timeline.map((entry) => (
                <li key={entry.id} className="ph-item">
                  <div className="ph-left" aria-hidden="true">
                    <span className={`ph-dot ${entry.dot}`} />
                  </div>
                  <div className="ph-right">
                    <p className="ph-date">{entry.dateLabel}</p>
                    <p className="ph-event">{entry.title}</p>
                    {entry.detail && <p className="ph-detail">{entry.detail}</p>}
                    {entry.badge && (
                      <span className="ph-badge">
                        <span className={`ph-badge-dot ${entry.badge.toLowerCase()}`} />
                        {STATUS_LABELS[entry.badge]}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="ph-notes">
          <h2 id="ph-notes" className="ph-section-label">
            Your Notes
          </h2>
          <div className="ph-notes-area">
            <DossierNotes
              dossierProductId={dossierProductId}
              notes={notes}
              placeholder="Add a note about this product — observations, reactions, anything worth remembering…"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
