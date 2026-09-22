import type { searchProducts } from '@/app/actions/dossier'

/**
 * The product shape every build screen renders — derived from the search action
 * so the screens can never drift from what the server actually returns.
 */
export type DossierProductSummary = Awaited<ReturnType<typeof searchProducts>>[number]
