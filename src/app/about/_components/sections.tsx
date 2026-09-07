import type { SectionData } from './Section'

/**
 * The four `/about` content sections, verbatim copy from
 * templates/about.html. Kept as data so <Section /> stays one reusable
 * unit. The last section carries a custom `extra` block (the Journal name
 * and CTA) rendered by page.tsx.
 */
export const SECTIONS: SectionData[] = [
  {
    heading: 'A different starting point.',
    paragraphs: [
      'SkinAudit approaches skincare as a connected system rather than a collection of individual products.',
      'The platform brings together perspectives from skincare, technology, research and consumer behavior to make complex routines easier to understand and more useful in everyday life.',
    ],
    claim: {
      lead: 'The aim is not more skincare.',
      text: 'It is greater clarity about the skincare you use.',
    },
  },
  {
    heading: 'Built with expertise around it.',
    paragraphs: [
      'SkinAudit is developed with input and perspective from professionals across relevant disciplines, helping inform how the platform thinks about products, routines and the broader world surrounding skin.',
      'That work continues as the platform evolves.',
    ],
    claim: {
      text: 'No single perspective is enough to understand something as individual as skin.',
    },
  },
  {
    heading: 'Independent by design.',
    paragraphs: [
      'SkinAudit is built to serve the person using it — not the brands on their shelf.',
      'No brand can pay to influence how a product is assessed, how it is considered within a routine, or what SkinAudit recommends.',
      'Commercial relationships do not determine the guidance you receive.',
    ],
    claim: { text: 'Your routine. Independent perspective.' },
  },
]
