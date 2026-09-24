import { notFound } from 'next/navigation'

const DAY_MS = 24 * 60 * 60 * 1000

/** `/dossier/[id]` segment → positive integer id, or a 404. */
export function parseDossierProductId(id: string) {
  const dossierProductId = Number(id)
  if (!Number.isSafeInteger(dossierProductId) || dossierProductId <= 0) notFound()
  return dossierProductId
}

/** "Sep 20, 2026" — the mockups' date format. */
export function formatDossierDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Whole days since the product was added (0 on the day itself). */
export function daysInDossier(addedAt: Date) {
  return Math.max(0, Math.floor((Date.now() - addedAt.getTime()) / DAY_MS))
}

export function formatTimeInDossier(addedAt: Date) {
  const days = daysInDossier(addedAt)
  if (days < 1) return 'Today'
  return days === 1 ? '1 day' : `${days} days`
}
