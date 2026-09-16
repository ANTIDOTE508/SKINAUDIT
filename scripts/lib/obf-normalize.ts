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
// "en:face-cleansers"). Ce mapping est un ensemble de départ couvrant les
// tags les plus susceptibles d'apparaître pour le skincare ; l'étendre une
// fois que le premier run à blanc réel (Tâche 3, Étape 5) montre quels tags
// apparaissent réellement dans le dump filtré et passent actuellement à
// travers les mailles (null, donc exclus — voir isSkincareObfRecord).
const CATEGORY_TAG_MAP: Record<string, ProductCategory> = {
  'en:face-cleansers': 'CLEANSING',
  'en:cleansers': 'CLEANSING',
  'en:make-up-removers': 'CLEANSING',
  'en:toners': 'PREPARATION',
  'en:face-toners': 'PREPARATION',
  'en:serums': 'TREATMENT',
  'en:face-serums': 'TREATMENT',
  'en:face-masks': 'TREATMENT',
  'en:face-treatments': 'TREATMENT',
  'en:moisturisers': 'SUPPORT',
  'en:face-moisturisers': 'SUPPORT',
  'en:face-creams': 'SUPPORT',
  'en:face-oils': 'SUPPORT',
  'en:sunscreens': 'PROTECTION',
  'en:sun-protection': 'PROTECTION',
}

export function mapObfCategoryToProductCategory(categoriesTags: string[]): ProductCategory | null {
  for (const tag of categoriesTags) {
    const mapped = CATEGORY_TAG_MAP[tag]
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
