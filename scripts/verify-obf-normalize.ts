// scripts/verify-obf-normalize.ts
// Lancer avec : npx tsx scripts/verify-obf-normalize.ts
import {
  isSkincareObfRecord,
  mapObfCategoryToProductCategory,
  normalizeObfRecord,
  type ObfRecord,
} from './lib/obf-normalize'

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`FAIL: ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

// Cas 1 : un enregistrement skincare valide se mappe proprement
const cleanser: ObfRecord = {
  code: '1234567890123',
  product_name: 'Gentle Foaming Cleanser',
  brands: 'CeraVe,Some Distributor',
  categories_tags: ['en:cosmetics', 'en:face-cleansers'],
  ingredients_text: 'Aqua, Glycerin, Niacinamide',
  quantity: '236 ml',
}
assertEqual(isSkincareObfRecord(cleanser), true, 'cleanser should pass the skincare filter')
assertEqual(mapObfCategoryToProductCategory(cleanser.categories_tags!), 'CLEANSING', 'cleanser category mapping')
assertEqual(
  normalizeObfRecord(cleanser),
  {
    barcode: '1234567890123',
    name: 'Gentle Foaming Cleanser',
    brandName: 'CeraVe',
    category: 'CLEANSING',
    sizeLabel: '236 ml',
    ingredientsText: 'Aqua, Glycerin, Niacinamide',
  },
  'cleanser normalization',
)

// Cas 2 : code-barres manquant rejeté
const noBarcode: ObfRecord = { ...cleanser, code: '' }
assertEqual(isSkincareObfRecord(noBarcode), false, 'record without barcode should be rejected')
assertEqual(normalizeObfRecord(noBarcode), null, 'record without barcode should normalize to null')

// Cas 3 : ingredients_text manquant rejeté
const noIngredients: ObfRecord = { ...cleanser, ingredients_text: '' }
assertEqual(isSkincareObfRecord(noIngredients), false, 'record without ingredients_text should be rejected')

// Cas 4 : brands manquant rejeté
const noBrand: ObfRecord = { ...cleanser, brands: '' }
assertEqual(isSkincareObfRecord(noBrand), false, 'record without brands should be rejected')

// Cas 5 : catégorie non mappée (ex : un produit alimentaire) rejetée
const unmapped: ObfRecord = { ...cleanser, categories_tags: ['en:cosmetics', 'en:shampoos'] }
assertEqual(isSkincareObfRecord(unmapped), false, 'unmapped category should be rejected')
assertEqual(mapObfCategoryToProductCategory(unmapped.categories_tags!), null, 'unmapped category returns null')

// Cas 6 : product_name manquant retombe sur un placeholder plutôt que de planter
const noName: ObfRecord = { ...cleanser, product_name: undefined }
const normalizedNoName = normalizeObfRecord(noName)
assertEqual(normalizedNoName?.name, 'Unnamed product (1234567890123)', 'missing product_name falls back to placeholder')

// Cas 7 : product_name_en préféré quand présent (app cible un public anglophone)
const withEnName: ObfRecord = { ...cleanser, product_name: 'Nettoyant moussant doux', product_name_en: 'Gentle Foaming Cleanser EN' }
const normalizedWithEnName = normalizeObfRecord(withEnName)
assertEqual(normalizedWithEnName?.name, 'Gentle Foaming Cleanser EN', 'product_name_en should be preferred over product_name')

// Cas 8 : product_name_en absent retombe sur product_name
const noEnName: ObfRecord = { ...cleanser, product_name: 'Nettoyant moussant doux', product_name_en: undefined }
const normalizedNoEnName = normalizeObfRecord(noEnName)
assertEqual(normalizedNoEnName?.name, 'Nettoyant moussant doux', 'missing product_name_en falls back to product_name')

console.log('PASS: all OBF normalization assertions succeeded')
