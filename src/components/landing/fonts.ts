import { Inter } from 'next/font/google'

/**
 * Inter is used only by the landing page, so it is instantiated here rather
 * than in the root layout — that keeps the font off every other route.
 */
export const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
})
