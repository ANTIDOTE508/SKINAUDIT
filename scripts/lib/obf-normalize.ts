// scripts/lib/obf-normalize.ts
import type { ProductCategory } from '@prisma/client'

export type ObfRecord = {
  code?: string
  product_name?: string
  brands?: string
  categories_tags?: string[]
  ingredients_text?: string
  quantity?: string
}

export type NormalizedObfProduct = {
  barcode: string
  name: string
  brandName: string
  category: ProductCategory
  sizeLabel: string | null
  ingredientsText: string
}

// Les categories_tags OBF utilisent le préfixe de taxonomie `en:` (ex :
// "en:face-cleansers"), avec une casse incohérente dans le dump réel
// (ex : "en:Cosmetics", "en:Skin care") — d'où la comparaison en
// minuscules ci-dessous. Ce mapping a été calibré à partir de l'inspection
// réelle du dump OBF du 2026-09-16 (98 Mo, 75 112 lignes, 12 528 avec
// code+ingredients_text+brands+categories_tags présents) : les tags
// devinés initialement (en:face-cleansers, en:sunscreens, en:moisturisers,
// etc.) n'apparaissaient pas du tout dans les données réelles. Remplacé
// par les tags effectivement observés (en:cleansers, en:sunscreen,
// en:facial-creams, en:face-masks, etc.) — voir le run de calibration
// dans le plan docs/superpowers/plans/2026-09-15-obf-catalog-sync.md,
// Tâche 3 Étape 5.
const CATEGORY_TAG_MAP: Record<string, ProductCategory> = {
  'en:cleansers': 'CLEANSING',
  'en:face-cleansers': 'CLEANSING',
  'en:make-up-removers': 'CLEANSING',
  'en:liquid-soaps': 'CLEANSING',
  'en:soaps': 'CLEANSING',
  'en:toners': 'PREPARATION',
  'en:face-toners': 'PREPARATION',
  'en:serums': 'TREATMENT',
  'en:face-serums': 'TREATMENT',
  'en:face-masks': 'TREATMENT',
  'en:hair-masks': 'TREATMENT',
  'en:face-treatments': 'TREATMENT',
  'en:anti-aging-face-care-products': 'TREATMENT',
  'en:facial-creams': 'SUPPORT',
  'en:face-creams': 'SUPPORT',
  'en:body-creams': 'SUPPORT',
  'en:hand-creams': 'SUPPORT',
  'en:body-milks': 'SUPPORT',
  'en:body-oils': 'SUPPORT',
  'en:face care': 'SUPPORT',
  'en:skin care': 'SUPPORT',
  'en:sunscreen': 'PROTECTION',
  'en:sunscreens': 'PROTECTION',
  'en:suncare': 'PROTECTION',
  'en:in-sun-protections': 'PROTECTION',
}

export function mapObfCategoryToProductCategory(categoriesTags: string[]): ProductCategory | null {
  for (const tag of categoriesTags) {
    const mapped = CATEGORY_TAG_MAP[tag.toLowerCase()]
    if (mapped) return mapped
  }
  return null
}

export function isSkincareObfRecord(record: ObfRecord): boolean {
  if (!record.code || record.code.trim() === '') return false
  if (!record.ingredients_text || record.ingredients_text.trim() === '') return false
  if (!record.brands || record.brands.trim() === '') return false
  if (!record.categories_tags || record.categories_tags.length === 0) return false
  return mapObfCategoryToProductCategory(record.categories_tags) !== null
}

export function normalizeObfRecord(record: ObfRecord): NormalizedObfProduct | null {
  if (!isSkincareObfRecord(record)) return null

  const category = mapObfCategoryToProductCategory(record.categories_tags!)
  if (!category) return null

  const brandName = record.brands!.split(',')[0].trim()
  if (brandName === '') return null

  return {
    barcode: record.code!.trim(),
    name: (record.product_name ?? '').trim() || `Unnamed product (${record.code})`,
    brandName,
    category,
    sizeLabel: record.quantity?.trim() || null,
    ingredientsText: record.ingredients_text!.trim(),
  }
}
