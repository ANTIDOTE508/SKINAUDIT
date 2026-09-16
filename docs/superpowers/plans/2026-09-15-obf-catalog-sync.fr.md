# Plan d'implémentation — Sync catalogue OBF

> **Pour les exécutants agentiques :** SOUS-SKILL REQUIS : utiliser superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes utilisent la syntaxe case à cocher (`- [ ]`) pour le suivi.

**Objectif :** Construire un script Node autonome qui télécharge le dump nocturne JSONL.gz d'Open Beauty Facts (OBF), le filtre sur les produits skincare avec un code-barres exploitable, et les upsert dans le catalogue `Product`/`Brand` avec `source = CATALOG_SEED`, exécuté via un cron GitHub Actions hebdomadaire.

**Architecture :** Un pipeline de streaming unique (`scripts/sync-obf.ts`) — flux de téléchargement → flux de décompression → parsing JSONL ligne par ligne → filtrage → normalisation → upsert par lots — avec un garde-fou de comptage post-filtre strict qui interrompt le script avant toute écriture si le compte filtré semble anormalement bas (le mode d'échec documenté d'incomplétude des dumps OBF). Pas de polling API, pas de Vercel Cron/Function — un pur script Node déclenché par GitHub Actions `schedule` + `workflow_dispatch`.

**Stack technique :** Streams Node.js (`zlib.createGunzip`, `readline`), `fetch` natif pour le flux de téléchargement, Prisma Client (`$transaction` par lots), GitHub Actions.

**Spec :** `docs/superpowers/specs/2026-09-14-obf-catalog-sync-design.md`

## Contraintes globales

- **Dépendance bloquante :** ce plan nécessite que `Product.barcode`, `Product.sizeLabel`, `Product.source`, `Product.createdByUserId`, et l'enum `ProductCategory` à 5 valeurs existent déjà en base. Ceux-ci sont construits dans `docs/superpowers/plans/2026-09-15-dossier-product-database.md` (Tâches 1–3). **Ne pas démarrer la Tâche 1 de ce plan avant que le SQL de la Tâche 3 de ce plan-là ait été appliqué par le développeur et que `pnpm db:generate` de sa Tâche 4 ait été exécuté** — sinon le Prisma Client utilisé ici n'aura pas les champs `barcode`/`source`.
- **Ne jamais lancer `prisma migrate dev/deploy`** — ce plan n'introduit aucun nouveau schéma, il ne devrait donc nécessiter aucune migration ; si une tâche ici semble nécessiter une migration, s'arrêter et revérifier par rapport au plan Dossier plutôt que d'écrire un nouveau schéma.
- Pas de Vercel Cron/Function pour le sync réel — anti-pattern confirmé selon la spec (limites de payload/durée/mémoire incompatibles avec le streaming d'un dump de plusieurs centaines de Mo). GitHub Actions uniquement.
- Aucun test runner configuré dans ce dépôt (pas de vitest/jest dans `package.json`). La vérification utilise `pnpm type-check`, un petit script Node basé sur des fixtures exécuté via `npx tsx`, et un vrai run à blanc (rate-limité, petit) contre OBF pour la vérification d'intégration finale.
- Attribution de licence : toute UI affichant un produit `source = CATALOG_SEED` doit montrer une attribution à Open Beauty Facts (ODbL) — ce plan ne construit que le sync ; le câblage de la chaîne d'attribution dans l'UI de détail produit est hors périmètre ici (suivi dans le plan Dossier / futur travail front) mais la donnée nécessaire pour cela (le champ `source`) est ce que ce pipeline renseigne.

---

## Structure des fichiers

- `scripts/sync-obf.ts` — créer : le point d'entrée du pipeline (téléchargement → décompression → parsing → filtrage → normalisation → upsert → vérification → logs). Fichier unique, car le pipeline est un flux linéaire unique et la spec le traite comme un seul script — pas de découpage prématuré.
- `scripts/lib/obf-normalize.ts` — créer : fonctions pures mappant un enregistrement JSONL OBF brut vers la forme d'upsert `Product`/`Brand`, et le mapping tag de catégorie → `ProductCategory`. Séparé de `sync-obf.ts` car c'est la partie avec de la vraie logique de branchement qui mérite d'être testée isolément, contrairement à la plomberie de flux qui ne le mérite pas.
- `scripts/verify-obf-normalize.ts` — créer : script Node d'assertions autonome exerçant `obf-normalize.ts` contre des enregistrements fixtures (substitut de framework de test, même pattern que la Tâche 7 du plan Dossier).
- `.github/workflows/sync-obf.yml` — créer : déclencheur cron hebdomadaire + dispatch manuel.

## Séquencement des tâches

Les Tâches 1–2 (logique de normalisation + sa vérification) n'ont aucune dépendance base de données ou réseau et peuvent être écrites et vérifiées isolément en premier. La Tâche 3 (le pipeline de streaming) dépend du normaliseur de la Tâche 1 et du fait que les champs de schéma du plan Dossier soient live en base. La Tâche 4 (GitHub Actions) dépend du fait que la Tâche 3 soit exécutable.

---

### Tâche 1 : Normalisation des enregistrements OBF (mapping de catégorie, extraction de champs)

**Fichiers :**
- Créer : `scripts/lib/obf-normalize.ts`

**Interfaces :**
- Consomme : rien (fonctions pures, aucun I/O).
- Produit : `type ObfRecord = { code: string; product_name?: string; brands?: string; categories_tags?: string[]; ingredients_text?: string; quantity?: string }`, `function mapObfCategoryToProductCategory(categoriesTags: string[]): ProductCategory | null`, `function isSkincareObfRecord(record: ObfRecord): boolean`, `function normalizeObfRecord(record: ObfRecord): NormalizedObfProduct | null` où `NormalizedObfProduct = { barcode: string; name: string; brandName: string; category: ProductCategory; sizeLabel: string | null; ingredientsText: string }`. Consommé par la Tâche 2 (vérification) et la Tâche 3 (pipeline).

- [ ] **Étape 1 : Définir les types et le mapping de catégorie skincare**

```typescript
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
```

- [ ] **Étape 2 : Ajouter le filtre skincare et le normaliseur complet**

```typescript
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
```

- [ ] **Étape 3 : Type-check**

Lancer : `pnpm type-check`
Attendu : aucune erreur. (Ceci nécessite que les valeurs de l'enum `ProductCategory` du plan Dossier — `SUPPORT`/`PREPARATION`/etc. — soient déjà générées dans `@prisma/client` ; en cas d'échec avec "Type '\"CLEANSING\"' is not assignable to type 'ProductCategory'", le `pnpm db:generate` de la Tâche 4 du plan Dossier n'a pas encore été exécuté dans cet environnement.)

- [ ] **Étape 4 : Commit**

```bash
git add scripts/lib/obf-normalize.ts
git commit -m "feat: add OBF record normalization and category mapping"
```

---

### Tâche 2 : Script de vérification pour la logique de normalisation

**Fichiers :**
- Créer : `scripts/verify-obf-normalize.ts`

**Interfaces :**
- Consomme : `mapObfCategoryToProductCategory`, `isSkincareObfRecord`, `normalizeObfRecord` depuis `./lib/obf-normalize` (Tâche 1).
- Produit : rien consommé par des tâches ultérieures — c'est un script de vérification feuille, conservé car il n'y a pas de framework de test dans ce dépôt (voir Contraintes globales).

- [ ] **Étape 1 : Écrire les assertions basées sur des fixtures**

```typescript
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

console.log('PASS: all OBF normalization assertions succeeded')
```

- [ ] **Étape 2 : Lancer**

Lancer : `npx tsx scripts/verify-obf-normalize.ts`
Attendu : `PASS: all OBF normalization assertions succeeded`

- [ ] **Étape 3 : Commit**

```bash
git add scripts/verify-obf-normalize.ts
git commit -m "test: add standalone verification script for OBF normalization"
```

---

### Tâche 3 : Pipeline de sync en streaming avec garde-fou de comptage post-filtre

**Fichiers :**
- Créer : `scripts/sync-obf.ts`

**Interfaces :**
- Consomme : `normalizeObfRecord` depuis `./lib/obf-normalize` (Tâche 1), `prisma` depuis `../src/lib/prisma`.
- Produit : un script exécutable (`npx tsx scripts/sync-obf.ts`) sans interface exportée — c'est le point d'entrée du pipeline, consommé uniquement par le workflow GitHub Actions de la Tâche 4.

- [ ] **Étape 1 : Écrire le pipeline téléchargement → décompression → parsing**

```typescript
// scripts/sync-obf.ts
// Lancer avec : npx tsx scripts/sync-obf.ts
// Nécessite DATABASE_URL. Télécharge et streame le dump JSONL.gz complet
// d'OBF (peut faire plusieurs centaines de Mo compressé) — ne pas lancer
// ceci contre une base locale/dev à laquelle vous tenez sans comprendre le
// comportement d'upsert ci-dessous (Étape 4).

import { createGunzip } from 'node:zlib'
import { createInterface } from 'node:readline'
import { Readable } from 'node:stream'
import { prisma } from '../src/lib/prisma'
import { normalizeObfRecord, type NormalizedObfProduct, type ObfRecord } from './lib/obf-normalize'

const OBF_DUMP_URL = 'https://static.openbeautyfacts.org/data/openbeautyfacts-products.jsonl.gz'

// Calibré après le premier run réel (Tâche 3, Étape 5) — démarrer prudent et
// resserrer une fois les vrais chiffres de comptage filtré connus. Ceci
// existe spécifiquement pour attraper l'incident documenté d'incomplétude
// du dump OBF (voir
// docs/superpowers/specs/2026-09-14-obf-catalog-sync-design.md).
const MINIMUM_EXPECTED_UPSERTS = 500

type SyncStats = {
  linesRead: number
  parseErrors: number
  filteredOut: number
  normalized: number
  upserted: number
  upsertErrors: number
}

async function fetchDumpStream(): Promise<NodeJS.ReadableStream> {
  const response = await fetch(OBF_DUMP_URL)
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download OBF dump: HTTP ${response.status}`)
  }
  return Readable.fromWeb(response.body as unknown as import('stream/web').ReadableStream)
}

async function collectNormalizedProducts(): Promise<{ products: NormalizedObfProduct[]; stats: SyncStats }> {
  const stats: SyncStats = {
    linesRead: 0,
    parseErrors: 0,
    filteredOut: 0,
    normalized: 0,
    upserted: 0,
    upsertErrors: 0,
  }

  const rawStream = await fetchDumpStream()
  const gunzip = createGunzip()
  rawStream.pipe(gunzip)
  const lines = createInterface({ input: gunzip, crlfDelay: Infinity })

  const products: NormalizedObfProduct[] = []

  for await (const line of lines) {
    if (line.trim() === '') continue
    stats.linesRead++

    let record: ObfRecord
    try {
      record = JSON.parse(line)
    } catch {
      stats.parseErrors++
      continue
    }

    const normalized = normalizeObfRecord(record)
    if (!normalized) {
      stats.filteredOut++
      continue
    }

    stats.normalized++
    products.push(normalized)
  }

  return { products, stats }
}
```

- [ ] **Étape 2 : Ajouter l'upsert par lots (Brand puis Product, par code-barres)**

```typescript
const UPSERT_BATCH_SIZE = 500

async function upsertBatch(batch: NormalizedObfProduct[], stats: SyncStats) {
  for (const item of batch) {
    try {
      const brand = await prisma.brand.upsert({
        where: { name: item.brandName },
        update: {},
        create: {
          name: item.brandName,
          slug: slugify(item.brandName),
        },
      })

      await prisma.product.upsert({
        where: { barcode: item.barcode },
        update: {
          name: item.name,
          brandId: brand.id,
          category: item.category,
          sizeLabel: item.sizeLabel,
        },
        create: {
          name: item.name,
          slug: slugify(`${item.brandName}-${item.name}-${item.barcode}`),
          barcode: item.barcode,
          brandId: brand.id,
          category: item.category,
          sizeLabel: item.sizeLabel,
          source: 'CATALOG_SEED',
        },
      })

      stats.upserted++
    } catch (err) {
      stats.upsertErrors++
      console.error(`Upsert failed for barcode ${item.barcode}:`, err)
    }
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 200)
}
```

Note : `Brand.name` est la clé d'upsert ici, correspondant à la contrainte `@unique` existante sur `Brand.name` (`prisma/schema.prisma:618`) — cela signifie qu'un nom de marque OBF qui diffère en casse/espacement d'une marque déjà saisie manuellement créera une `Brand` en doublon plutôt que de fusionner. C'est accepté comme dette de déduplication documentée selon la section "hors périmètre" de la spec (la déduplication inter-source est un chantier futur) — ne pas tenter de matching flou de marques dans cette tâche.

- [ ] **Étape 3 : Ajouter le garde-fou de comptage, l'orchestration et les logs**

```typescript
async function main() {
  console.log(`[sync-obf] Starting OBF sync at ${new Date().toISOString()}`)

  const { products, stats } = await collectNormalizedProducts()

  console.log(
    `[sync-obf] Parsed dump: ${stats.linesRead} lines read, ${stats.parseErrors} parse errors, ` +
      `${stats.filteredOut} filtered out, ${stats.normalized} normalized.`,
  )

  if (products.length < MINIMUM_EXPECTED_UPSERTS) {
    console.error(
      `[sync-obf] ABORTING: only ${products.length} products passed filtering, below the minimum ` +
        `expected threshold of ${MINIMUM_EXPECTED_UPSERTS}. This matches the documented OBF dump-` +
        `incompleteness failure mode (see spec) — refusing to upsert a partial/corrupt dump. ` +
        `No database writes were made.`,
    )
    process.exit(1)
  }

  for (let i = 0; i < products.length; i += UPSERT_BATCH_SIZE) {
    const batch = products.slice(i, i + UPSERT_BATCH_SIZE)
    await upsertBatch(batch, stats)
    console.log(`[sync-obf] Upserted batch ${i / UPSERT_BATCH_SIZE + 1}: ${stats.upserted} total so far.`)
  }

  console.log(
    `[sync-obf] Done. ${stats.upserted} upserted, ${stats.upsertErrors} upsert errors, ` +
      `${stats.parseErrors} parse errors.`,
  )

  if (stats.upsertErrors > 0) {
    console.error(`[sync-obf] Completed with ${stats.upsertErrors} upsert errors — check logs above.`)
    process.exit(1)
  }
}

main()
  .catch((err) => {
    console.error('[sync-obf] Fatal error:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
```

- [ ] **Étape 4 : Type-check**

Lancer : `pnpm type-check`
Attendu : aucune erreur.

- [ ] **Étape 5 : Run à blanc contre les données OBF réelles avec une base jetable/dev**

Cette étape télécharge le vrai dump OBF complet (peut faire plusieurs centaines de Mo compressé) et écrit vers quel que soit le `DATABASE_URL` défini. **Confirmer avec le développeur quelle base est ciblée avant de lancer** — ne pas exécuter contre la production sans son accord explicite.

Lancer : `npx tsx scripts/sync-obf.ts`
Attendu : sortie de log se terminant par `[sync-obf] Done. N upserted, 0 upsert errors, M parse errors.` En cas d'interruption par le garde-fou `MINIMUM_EXPECTED_UPSERTS`, noter le compte réel `stats.normalized` du log et le rapporter au développeur — c'est le vrai point de calibration réclamé par la spec ; ne pas simplement baisser le seuil pour faire passer le test sans en discuter d'abord avec lui.

- [ ] **Étape 6 : Commit**

```bash
git add scripts/sync-obf.ts
git commit -m "feat: add OBF catalog sync pipeline with streaming download and count-guard"
```

---

### Tâche 4 : Cron GitHub Actions hebdomadaire

**Fichiers :**
- Créer : `.github/workflows/sync-obf.yml`

**Interfaces :**
- Consomme : `scripts/sync-obf.ts` (Tâche 3), le secret de dépôt `DATABASE_URL` (doit déjà exister ou être ajouté par le développeur — cette tâche ne crée pas de secrets).
- Produit : rien consommé par d'autres tâches — c'est le point d'intégration final.

- [ ] **Étape 1 : Écrire le fichier de workflow**

```yaml
name: Sync OBF Catalog

on:
  schedule:
    - cron: '0 3 * * 1' # tous les lundis à 03:00 UTC
  workflow_dispatch: {}

jobs:
  sync:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm db:generate

      - run: npx tsx scripts/sync-obf.ts
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

- [ ] **Étape 2 : Valider la syntaxe YAML**

Lancer : `npx -y js-yaml .github/workflows/sync-obf.yml > /dev/null && echo "valid YAML"`
Attendu : `valid YAML`

- [ ] **Étape 3 : Commit**

```bash
git add .github/workflows/sync-obf.yml
git commit -m "ci: add weekly GitHub Actions cron for OBF catalog sync"
```

- [ ] **Étape 4 : Passation au développeur**

Dire directement à l'utilisateur : "Workflow GitHub Actions ajouté dans `.github/workflows/sync-obf.yml`, planifié hebdomadairement (lundis 03:00 UTC) avec un déclencheur manuel `workflow_dispatch` pour les tests. Il a besoin d'un secret de dépôt `DATABASE_URL` pointant vers la base cible — merci de confirmer que ce secret existe (ou de l'ajouter) avant le premier run planifié, et de considérer un déclenchement manuel une première fois pour observer les vrais logs et confirmer que le seuil `MINIMUM_EXPECTED_UPSERTS` (actuellement `500`, défini dans `scripts/sync-obf.ts`) est correctement calibré par rapport aux données de production."

---

## Notes d'auto-relecture

- **Couverture de la spec :** téléchargement/décompression/parsing en streaming ✓ (Tâche 3, Étape 1), filtre (barcode/ingredients_text/brands/category non vides) ✓ (Tâche 1), table de mapping de champs (`code`→`barcode`, `product_name`→`name`, `brands`→`Brand.name`, `categories_tags`→`category`, `ingredients_text` stocké tel quel, `quantity`→`sizeLabel`, `source=CATALOG_SEED` fixe) ✓ (Tâche 1 + Tâche 3 Étape 2), upsert par lots par code-barres ✓ (Tâche 3, `UPSERT_BATCH_SIZE`), garde-fou de comptage post-filtre avec échec explicite plutôt qu'import partiel silencieux ✓ (Tâche 3, Étape 3), cron GitHub Actions hebdomadaire + dispatch manuel ✓ (Tâche 4). Les éléments hors périmètre de la spec (matching de texte d'ingrédients vers `CanonicalIngredient`, réhébergement d'images R2, validation juridique formelle ODbL/DBCL, déduplication inter-source) ne sont explicitement pas traités ici, conformément à la section "hors périmètre" de la spec.
- **Détection de placeholders :** aucun TBD/TODO ; la seule valeur de calibration ouverte (`MINIMUM_EXPECTED_UPSERTS = 500`) est signalée comme valeur de départ à confirmer contre des données réelles à la Tâche 3 Étape 5, conformément à l'affirmation de la spec elle-même selon laquelle la volumétrie réelle "n'est pas connue à l'avance" — c'est une inconnue délibérée et reconnue par la spec, pas une lacune du plan.
- **Cohérence des types :** `NormalizedObfProduct` défini une seule fois dans `obf-normalize.ts` (Tâche 1) et importé sans changement dans la Tâche 2 et la Tâche 3. Les valeurs `ProductCategory` utilisées (`CLEANSING`/`PREPARATION`/`TREATMENT`/`SUPPORT`/`PROTECTION`) correspondent exactement à l'enum défini dans la Tâche 2 du plan Dossier — aucune dérive.
- **Dépendance de séquencement rendue explicite :** les Contraintes globales et l'en-tête de la Tâche indiquent tous deux que ce plan ne peut pas s'exécuter contre une base de données live avant que les champs de schéma du plan Dossier existent, conformément à la section "Dépendance bloquante" de la spec, reprise mot pour mot.
