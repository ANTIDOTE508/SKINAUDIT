import { Jost } from 'next/font/google'

/**
 * Jost is used only by the landing page (nav, body copy, labels, CTAs), so
 * it is instantiated here rather than in the root layout — that keeps the
 * font off every other route. Cormorant Garamond is NOT re-instantiated
 * here: it is already loaded globally in `app/layout.tsx` as
 * `--font-cormorant` and used site-wide, so the landing page simply reuses
 * that existing variable for its display type.
 */
export const jost = Jost({
  variable: '--font-jost',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
})
