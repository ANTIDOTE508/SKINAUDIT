import type { StepData } from './StepSection'
import { RecordArrayArt } from './art/RecordArrayArt'
import { RitualTracksArt } from './art/RitualTracksArt'
import { ContextFieldArt } from './art/ContextFieldArt'
import { RelationGraphArt } from './art/RelationGraphArt'
import { TraceLinesArt } from './art/TraceLinesArt'

/**
 * The five steps, verbatim copy from templates/how_it_works.html. Kept as
 * data so <StepSection /> stays a single reusable unit.
 */
export const STEPS: StepData[] = [
  {
    num: '01',
    side: 'left',
    ground: 's-1',
    title: 'Build your Dossier.',
    lead: 'Start with what you already use.',
    body: 'Add your skincare products, tools and treatments to create a structured picture of your current routine.',
    notes: [
      { text: 'No need to start over.' },
      { text: 'No need to buy something new.' },
      { text: 'Your existing regimen is the starting point.', hi: true },
    ],
    art: <RecordArrayArt />,
  },
  {
    num: '02',
    side: 'right',
    ground: 's-2',
    title: 'Map your Ritual.',
    lead: "Skincare isn't only about what you use.",
    body: 'How a routine comes together can change the picture. Organize your morning and evening rituals so SkinAudit can understand your regimen as a whole.',
    notes: [{ text: 'Because the routine matters as much as the product.', hi: true }],
    art: <RitualTracksArt />,
  },
  {
    num: '03',
    side: 'left',
    ground: 's-3',
    title: 'Add Context.',
    lead: 'There is always more happening around a routine than what sits on the shelf.',
    body: 'SkinAudit brings that wider picture into view.',
    notes: [
      { text: "Because what surrounds a routine can matter as much as what's in it.", hi: true },
    ],
    art: <ContextFieldArt />,
  },
  {
    num: '04',
    side: 'right',
    ground: 's-4',
    title: 'See your Audit.',
    lead: 'Once the picture comes together, SkinAudit surfaces insights across your regimen.',
    body: 'See areas worth paying attention to, understand where your routine may deserve a closer look, and gain a clearer view of how its different parts relate.',
    notes: [
      { text: 'Not another product rating.' },
      { text: 'A view of the system around it.', hi: true },
    ],
    art: <RelationGraphArt />,
  },
  {
    num: '05',
    side: 'left',
    ground: 's-5',
    title: 'Follow what changes.',
    lead: 'A routine is not a one-time decision.',
    body: 'Products change. Routines evolve. Treatments happen. Your skin responds. SkinAudit lets you check in over time, creating a record that makes it easier to recognize what has changed alongside your regimen.',
    notes: [
      { text: 'One audit gives you a snapshot.' },
      { text: 'Time gives it meaning.', hi: true },
    ],
    art: <TraceLinesArt />,
  },
]
