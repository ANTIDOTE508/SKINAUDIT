import type { DossierProductStatus, ProductCategory } from '@prisma/client'

export type DossierListItem = {
  id: number
  status: DossierProductStatus
  productName: string
  brandName: string | null
  category: ProductCategory
  /** ISO timestamp — serialisable across the server/client boundary. */
  addedAt: string
}

/** Ordered as the mockups list them (sort by category follows this order). */
export const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'CLEANSING', label: 'Cleansing' },
  { value: 'PREPARATION', label: 'Preparation' },
  { value: 'TREATMENT', label: 'Treatment' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'PROTECTION', label: 'Protection' },
]

/** Ordered Active · Seasonal · Archived (sort by status follows this order). */
export const STATUSES: { value: DossierProductStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SEASONAL', label: 'Seasonal' },
  { value: 'ARCHIVED', label: 'Archived' },
]

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
) as Record<ProductCategory, string>

export const STATUS_LABELS = Object.fromEntries(STATUSES.map((s) => [s.value, s.label])) as Record<
  DossierProductStatus,
  string
>

/** Chips selected in the filter sheet. An empty group does not filter. */
export type DossierFilter = {
  categories: ProductCategory[]
  statuses: DossierProductStatus[]
}

export const EMPTY_FILTER: DossierFilter = { categories: [], statuses: [] }

export function filterCount(filter: DossierFilter) {
  return filter.categories.length + filter.statuses.length
}

/** OR within a group, AND across groups. */
export function applyFilter(items: DossierListItem[], filter: DossierFilter) {
  return items.filter(
    (item) =>
      (filter.categories.length === 0 || filter.categories.includes(item.category)) &&
      (filter.statuses.length === 0 || filter.statuses.includes(item.status))
  )
}

export type DossierSort = 'date-desc' | 'date-asc' | 'brand' | 'category' | 'status' | 'name'

export const SORT_OPTIONS: { value: DossierSort; label: string; desc: string; dir?: string }[] = [
  { value: 'date-desc', label: 'Date added', desc: 'Newest first', dir: '↓' },
  { value: 'date-asc', label: 'Date added', desc: 'Oldest first', dir: '↑' },
  { value: 'brand', label: 'Brand', desc: 'A → Z' },
  { value: 'category', label: 'Category', desc: 'Cleansing → Protection' },
  { value: 'status', label: 'Status', desc: 'Active · Seasonal · Archived' },
  { value: 'name', label: 'Product name', desc: 'A → Z' },
]

const CATEGORY_RANK = new Map(CATEGORIES.map((c, i) => [c.value, i]))
const STATUS_RANK = new Map(STATUSES.map((s, i) => [s.value, i]))

const byText = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' })
const byNewest = (a: DossierListItem, b: DossierListItem) => b.addedAt.localeCompare(a.addedAt)

/** Returns a new array; ties fall back to newest first. */
export function applySort(items: DossierListItem[], sort: DossierSort) {
  const sorted = [...items]
  switch (sort) {
    case 'date-desc':
      return sorted.sort(byNewest)
    case 'date-asc':
      return sorted.sort((a, b) => byNewest(b, a))
    case 'brand':
      // Products without a brand go last.
      return sorted.sort((a, b) => {
        if (a.brandName === null || b.brandName === null) {
          return a.brandName === b.brandName ? byNewest(a, b) : a.brandName === null ? 1 : -1
        }
        return byText(a.brandName, b.brandName) || byNewest(a, b)
      })
    case 'category':
      return sorted.sort(
        (a, b) => CATEGORY_RANK.get(a.category)! - CATEGORY_RANK.get(b.category)! || byNewest(a, b)
      )
    case 'status':
      return sorted.sort(
        (a, b) => STATUS_RANK.get(a.status)! - STATUS_RANK.get(b.status)! || byNewest(a, b)
      )
    case 'name':
      return sorted.sort((a, b) => byText(a.productName, b.productName) || byNewest(a, b))
  }
}
