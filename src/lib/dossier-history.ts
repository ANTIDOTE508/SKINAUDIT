import type {
  DossierEventType,
  DossierProductStatus,
  Prisma,
  ProductCategory,
} from '@prisma/client'
import { CATEGORY_LABELS, STATUS_LABELS } from '@/components/dossier/dossierListing'
import { formatDossierDate } from './dossier-product'

export type TimelineDot = 'added' | 'active' | 'seasonal' | 'archived' | 'note'

/** One row of the History timeline (mockup 12), ready to render. */
export type TimelineEntry = {
  id: number
  dateLabel: string
  dot: TimelineDot
  title: string
  detail: string | null
  /** Status reached, shown as an inline badge (status changes only). */
  badge: DossierProductStatus | null
}

const STATUSES = new Set<string>(['ACTIVE', 'SEASONAL', 'ARCHIVED'])
const RITUAL_LABELS: Record<string, string> = {
  AM: 'AM ritual',
  PM: 'PM ritual',
  BOTH: 'AM & PM ritual',
}

/** Event metadata is free-form JSON: read one field without trusting its shape. */
function field(metadata: Prisma.JsonValue, key: string) {
  if (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined
  return metadata[key]
}

function statusField(metadata: Prisma.JsonValue, key: string) {
  const value = field(metadata, key)
  return typeof value === 'string' && STATUSES.has(value) ? (value as DossierProductStatus) : null
}

function stringField(metadata: Prisma.JsonValue, key: string) {
  const value = field(metadata, key)
  return typeof value === 'string' ? value : null
}

export function toTimelineEntry(
  event: { id: number; type: DossierEventType; metadata: Prisma.JsonValue; occurredAt: Date },
  /** Category shown on "Added" events recorded before they stored it. */
  fallbackCategory: ProductCategory
): TimelineEntry {
  const base = { id: event.id, dateLabel: formatDossierDate(event.occurredAt), badge: null }
  const { metadata } = event

  switch (event.type) {
    case 'ADDED_TO_DOSSIER': {
      const category =
        (stringField(metadata, 'category') as ProductCategory | null) ?? fallbackCategory
      const status = statusField(metadata, 'status')
      const saved = [CATEGORY_LABELS[category], status && STATUS_LABELS[status]].filter(Boolean)
      return {
        ...base,
        dot: 'added',
        title: 'Added to Dossier',
        detail: `Saved as ${saved.join(' · ')}`,
      }
    }

    case 'STATUS_CHANGED': {
      const from = statusField(metadata, 'from')
      const to = statusField(metadata, 'to')
      return {
        ...base,
        dot: to ? (to.toLowerCase() as TimelineDot) : 'note',
        title: from === 'ARCHIVED' ? 'Restored from archive' : 'Status changed',
        detail: from && to ? `${STATUS_LABELS[from]} → ${STATUS_LABELS[to]}` : null,
        badge: to,
      }
    }

    case 'EDITED': {
      if (stringField(metadata, 'field') !== 'notes') {
        return { ...base, dot: 'note', title: 'Product edited', detail: null }
      }
      const change = stringField(metadata, 'change')
      const text = stringField(metadata, 'text')
      const title =
        change === 'added' ? 'Note added' : change === 'removed' ? 'Note removed' : 'Note updated'
      return { ...base, dot: 'note', title, detail: text ? `“${text}”` : null }
    }

    case 'ADDED_TO_RITUAL':
    case 'REMOVED_FROM_RITUAL': {
      const timeOfDay = stringField(metadata, 'timeOfDay')
      return {
        ...base,
        dot: 'note',
        title: event.type === 'ADDED_TO_RITUAL' ? 'Added to ritual' : 'Removed from ritual',
        detail: timeOfDay ? (RITUAL_LABELS[timeOfDay] ?? null) : null,
      }
    }
  }
}
