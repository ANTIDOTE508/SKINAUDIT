import type { SectionData } from './Section'

/**
 * The four `/about` content sections, verbatim copy from
 * templates/about.html. Kept as data so <Section /> stays one reusable
 * unit. The last section carries a custom `extra` block (the Journal name
 * and CTA) rendered by page.tsx.
 */
export const SECTIONS: SectionData[] = [
  {
    label: 'A Systematic Approach',
    heading: 'Understanding skincare requires more than understanding products.',
    paragraphs: [
      'SkinAudit approaches skincare as a connected system rather than a collection of individual products.',
      'Drawing from skincare, technology, research and consumer behavior, its framework considers multiple layers of information together — translating complexity into guidance that is relevant to the individual.',
    ],
    claim: {
      lead: '',
      text: 'Structured intelligence. Clearer guidance.',
    },
  },
  {
    label: 'Informed by Expertise',
    heading: 'No single perspective is enough to understand something as individual as skin.',
    paragraphs: [
      'SkinAudit is developed with input from professionals across relevant disciplines, whose perspectives inform how the technology approaches products, routines and the broader context surrounding skin.',
      'As knowledge and evidence evolve, so does the framework.',
    ],
    claim: {
      text: 'Evidence informs the system. Expertise strengthens it.',
    },
  },
  {
    label: 'Independent by Design',
    heading: 'Guidance independent of commercial influence.',
    paragraphs: [
      'SkinAudit is built to serve the person using it — not the brands being considered.',
      'No brand can pay to influence how a product is assessed, how it is considered within a routine, or what SkinAudit recommends.',
      'Commercial relationships do not determine the guidance you receive.',
    ],
    claim: { text: 'Independence is part of our standard.' },
  }
]
