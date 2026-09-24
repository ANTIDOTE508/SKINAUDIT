/**
 * Raw INCI text (Open Beauty Facts `ingredients_text`, user entry, OCR) →
 * ordered ingredient list, with known key actives recognised from a small
 * glossary. Structured CanonicalIngredient data takes over once populated.
 */

export type KeyActive = {
  /** Display name on the Key Actives card. */
  name: string
  /** Short tag on the ingredient row. */
  badge: string
  role: string
}

export type ParsedIngredient = {
  position: number
  name: string
  /** One-line function, when the glossary knows the ingredient. */
  common: string | null
  active: KeyActive | null
}

type GlossaryEntry = {
  /** Lower-case fragments; an ingredient matches when it contains one. */
  match: string[]
  common: string
  active?: KeyActive
}

const GLOSSARY: GlossaryEntry[] = [
  // ── Key actives ──
  {
    match: ['salicylic acid'],
    common: 'BHA exfoliant',
    active: {
      name: 'Salicylic Acid',
      badge: 'BHA',
      role: 'BHA exfoliant — unclogs pores, smooths texture, reduces blackheads',
    },
  },
  {
    match: ['glycolic acid'],
    common: 'AHA exfoliant',
    active: {
      name: 'Glycolic Acid',
      badge: 'AHA',
      role: 'AHA exfoliant — resurfaces, evens tone and texture',
    },
  },
  {
    match: ['lactic acid'],
    common: 'AHA exfoliant, humectant',
    active: {
      name: 'Lactic Acid',
      badge: 'AHA',
      role: 'Gentle AHA exfoliant — smooths while it hydrates',
    },
  },
  {
    match: ['mandelic acid'],
    common: 'AHA exfoliant',
    active: {
      name: 'Mandelic Acid',
      badge: 'AHA',
      role: 'Slow-penetrating AHA — exfoliates with less irritation',
    },
  },
  {
    match: ['azelaic acid'],
    common: 'Anti-redness, anti-blemish',
    active: {
      name: 'Azelaic Acid',
      badge: 'Active',
      role: 'Calms redness, targets blemishes and uneven tone',
    },
  },
  {
    match: ['niacinamide'],
    common: 'Vitamin B3',
    active: {
      name: 'Niacinamide',
      badge: 'Vitamin B3',
      role: 'Strengthens the barrier, refines pores, evens tone',
    },
  },
  {
    match: ['retinol', 'retinal', 'retinyl'],
    common: 'Vitamin A derivative',
    active: {
      name: 'Retinoid',
      badge: 'Retinoid',
      role: 'Vitamin A — renews cells, softens lines, refines texture',
    },
  },
  {
    match: ['bakuchiol'],
    common: 'Plant-based retinol alternative',
    active: {
      name: 'Bakuchiol',
      badge: 'Active',
      role: 'Retinol alternative — smooths and firms with less irritation',
    },
  },
  {
    match: ['ascorbic acid', 'ascorbyl', 'ascorbate'],
    common: 'Vitamin C',
    active: {
      name: 'Vitamin C',
      badge: 'Vitamin C',
      role: 'Antioxidant — brightens and protects against environmental stress',
    },
  },
  {
    match: ['tocopherol', 'tocopheryl'],
    common: 'Vitamin E — antioxidant',
    active: {
      name: 'Vitamin E',
      badge: 'Antioxidant',
      role: 'Antioxidant — protects lipids and supports the barrier',
    },
  },
  {
    match: ['hyaluronic acid', 'sodium hyaluronate', 'hyaluronate'],
    common: 'Humectant',
    active: {
      name: 'Hyaluronic Acid',
      badge: 'Hydrator',
      role: 'Humectant — draws water into the skin for plumpness',
    },
  },
  {
    match: ['ceramide'],
    common: 'Barrier lipid',
    active: {
      name: 'Ceramides',
      badge: 'Barrier',
      role: 'Barrier lipids — reinforce and repair the moisture barrier',
    },
  },
  {
    match: ['panthenol'],
    common: 'Pro-vitamin B5',
    active: {
      name: 'Panthenol',
      badge: 'Soothing',
      role: 'Pro-vitamin B5 — soothes and supports barrier repair',
    },
  },
  {
    match: ['allantoin'],
    common: 'Soothing agent',
    active: {
      name: 'Allantoin',
      badge: 'Soothing',
      role: 'Soothes irritation and softens the skin',
    },
  },
  {
    match: ['centella asiatica', 'madecassoside', 'asiaticoside'],
    common: 'Cica — soothing botanical',
    active: {
      name: 'Centella Asiatica',
      badge: 'Soothing',
      role: 'Cica — calms redness and supports repair',
    },
  },
  {
    match: ['camellia sinensis', 'camellia oleifera'],
    common: 'Green tea — antioxidant',
    active: {
      name: 'Green Tea Extract',
      badge: 'Antioxidant',
      role: 'Antioxidant — soothes irritation, protects against environmental stress',
    },
  },
  {
    match: ['glycyrrhiza glabra'],
    common: 'Licorice root — brightening',
    active: {
      name: 'Licorice Root Extract',
      badge: 'Brightening',
      role: 'Brightens and calms — helps fade uneven tone',
    },
  },
  {
    match: ['arbutin'],
    common: 'Brightening agent',
    active: {
      name: 'Arbutin',
      badge: 'Brightening',
      role: 'Targets dark spots and uneven pigmentation',
    },
  },
  {
    match: ['tranexamic acid'],
    common: 'Brightening agent',
    active: {
      name: 'Tranexamic Acid',
      badge: 'Brightening',
      role: 'Targets discoloration and post-blemish marks',
    },
  },
  {
    match: ['peptide', 'palmitoyl'],
    common: 'Peptide',
    active: {
      name: 'Peptides',
      badge: 'Peptide',
      role: 'Signal molecules — support firmness and elasticity',
    },
  },
  {
    match: ['zinc oxide'],
    common: 'Mineral UV filter',
    active: {
      name: 'Zinc Oxide',
      badge: 'UV filter',
      role: 'Mineral sunscreen — broad-spectrum UVA/UVB protection',
    },
  },
  {
    match: ['titanium dioxide'],
    common: 'Mineral UV filter, pigment',
    active: {
      name: 'Titanium Dioxide',
      badge: 'UV filter',
      role: 'Mineral sunscreen — reflects UVB and short UVA',
    },
  },
  {
    match: ['butyl methoxydibenzoylmethane'],
    common: 'Avobenzone — UVA filter',
    active: {
      name: 'Avobenzone',
      badge: 'UV filter',
      role: 'Chemical UVA filter — guards against photo-ageing',
    },
  },
  {
    match: ['octocrylene', 'ethylhexyl methoxycinnamate', 'ethylhexyl salicylate', 'homosalate'],
    common: 'UVB filter',
    active: {
      name: 'UVB Filters',
      badge: 'UV filter',
      role: 'Chemical sunscreen — absorbs UVB to prevent burning',
    },
  },

  // ── Common formulation ingredients (no card, just a function line) ──
  { match: ['aqua', 'water', 'eau'], common: 'Solvent base' },
  { match: ['glycerin'], common: 'Humectant' },
  {
    match: ['butylene glycol', 'propylene glycol', 'pentylene glycol', 'hexylene glycol'],
    common: 'Humectant, texture agent',
  },
  { match: ['methylpropanediol'], common: 'Humectant, penetration enhancer' },
  { match: ['caprylyl glycol', 'ethylhexylglycerin'], common: 'Humectant, preservative booster' },
  {
    match: [
      'phenoxyethanol',
      'chlorphenesin',
      'sorbic acid',
      'potassium sorbate',
      'sodium benzoate',
    ],
    common: 'Preservative',
  },
  {
    match: ['tetrasodium edta', 'disodium edta', 'tetrasodium glutamate diacetate'],
    common: 'Chelating agent',
  },
  { match: ['sodium hydroxide', 'citric acid'], common: 'pH adjuster' },
  { match: ['xanthan gum', 'sclerotium gum', 'carbomer'], common: 'Thickener' },
  {
    match: ['cetearyl alcohol', 'cetyl alcohol', 'behenyl alcohol', 'stearyl alcohol'],
    common: 'Fatty alcohol — emollient',
  },
  { match: ['caprylic/capric triglyceride'], common: 'Emollient' },
  { match: ['dimethicone', 'cyclopentasiloxane'], common: 'Silicone — slip, smooth finish' },
  { match: ['squalane'], common: 'Emollient' },
  { match: ['butyrospermum parkii'], common: 'Shea butter — emollient' },
  { match: ['glyceryl stearate', 'polysorbate'], common: 'Emulsifier' },
  { match: ['parfum', 'fragrance'], common: 'Fragrance' },
  {
    match: [
      'limonene',
      'linalool',
      'citronellol',
      'geraniol',
      'hexyl cinnamal',
      'benzyl salicylate',
      'alpha-isomethyl ionone',
      'butylphenyl methylpropional',
    ],
    common: 'Fragrance allergen',
  },
  { match: ['alcohol denat', 'alcohol'], common: 'Solvent' },
]

function lookup(normalized: string) {
  return GLOSSARY.find((entry) =>
    entry.match.some((fragment) =>
      // Short words (aqua, eau…) must match a whole word, not a substring.
      fragment.length <= 5
        ? new RegExp(`(^|[^a-z])${fragment}([^a-z]|$)`).test(normalized)
        : normalized.includes(fragment)
    )
  )
}

/** Splits on commas / semicolons / sentence dots, never inside parentheses. */
function splitInci(text: string) {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '(' || char === '[') depth++
    if ((char === ')' || char === ']') && depth > 0) depth--
    // A dot followed by a space separates items in some OBF entries
    // ("TRIGLYCERIDE. BUTYROSPERMUM"); decimal dots (0.5%) do not.
    const isSeparator =
      depth === 0 &&
      (char === ',' || char === ';' || (char === '.' && /\s/.test(text[i + 1] ?? '')))
    if (isSeparator) {
      parts.push(current)
      current = ''
    } else {
      current += char
    }
  }
  parts.push(current)
  return parts.map((part) =>
    part
      .replace(/\s+/g, ' ')
      .replace(/^[\s*.•-]+|[\s*.]+$/g, '')
      .trim()
  )
}

const KEEP_UPPER = /^(ci|bht|bha|aha|edta|peg|ppg|dmdm|pvp|spf|uv|uva|uvb|dna|q10)$/i

/** "BUTYLENE GLYCOL" → "Butylene Glycol"; keeps codes like CI 77891, PEG-40, C12-15. */
function toDisplayCase(name: string) {
  if (name !== name.toUpperCase()) return name
  return name
    .toLowerCase()
    .replace(/[a-z0-9]+/g, (word) =>
      KEEP_UPPER.test(word) || /\d/.test(word)
        ? word.toUpperCase()
        : word[0].toUpperCase() + word.slice(1)
    )
}

export function parseInci(text: string | null): ParsedIngredient[] {
  if (!text) return []
  return splitInci(text)
    .filter((name) => name.length > 0)
    .map((raw, index) => {
      const entry = lookup(raw.toLowerCase())
      return {
        position: index + 1,
        name: toDisplayCase(raw),
        common: entry?.common ?? null,
        active: entry?.active ?? null,
      }
    })
}

/** Distinct key actives in list order (one card per glossary entry). */
export function keyActivesOf(ingredients: ParsedIngredient[]) {
  const seen = new Set<string>()
  return ingredients.flatMap((ingredient) => {
    if (!ingredient.active || seen.has(ingredient.active.name)) return []
    seen.add(ingredient.active.name)
    return [ingredient.active]
  })
}
