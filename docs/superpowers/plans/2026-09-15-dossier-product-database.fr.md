# Plan d'implémentation — Base de produits pour le Dossier

> **Pour les exécutants agentiques :** SOUS-SKILL REQUIS : utiliser superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes utilisent la syntaxe case à cocher (`- [ ]`) pour le suivi.

**Objectif :** Étendre le schéma Prisma et les server actions pour que le mockup "Dossier" (12 écrans : ajouter un produit via recherche/scan/saisie manuelle, catégoriser, suivre le statut, consulter l'historique) dispose d'une couche de données fonctionnelle.

**Architecture :** Modifications additives du schéma Prisma (nouveaux champs sur `Product`, remplacement de l'enum `ProductCategory`, nouvelle table `DossierProductEvent`) plus un ensemble de server actions `'use server'` dans `src/app/actions/dossier.ts` qui lisent/écrivent ces modèles. Aucune UI n'est construite dans ce plan — il produit la couche de données et les server actions que les écrans front appelleront.

**Stack technique :** Server actions Next.js 15 App Router, Prisma 7 (multi-schema, schéma `app`), PostgreSQL (Neon), Better Auth (`auth.api.getSession`).

**Spec :** `docs/superpowers/specs/2026-09-14-dossier-product-database-design.md`

## Contraintes globales

- **Ne jamais lancer `prisma migrate dev`, `prisma migrate deploy`, ou toute commande de migration.** Les changements de schéma dans `prisma/schema.prisma` restent conceptuels tant que le développeur n'a pas appliqué le SQL équivalent manuellement. La Tâche 1 de ce plan se termine en affichant, dans un unique bloc de code SQL à l'intérieur du plan (pas un fichier écrit sur disque), l'ensemble des requêtes couvrant tous les changements de schéma — le développeur les copie-colle et les exécute lui-même — aucun agent ne les exécute contre la base.
- Après tout changement de schéma Prisma : lancer `pnpm db:generate` puis `rm -rf .next` (le cache Turbopack ne prend pas automatiquement en compte les nouveaux types Prisma).
- Tout nouveau champ Prisma camelCase doit avoir un `@map("snake_case")` — sans exception.
- Les champs `userId` doivent toujours être `@map("user_id")`.
- Chaque server action doit appeler `requireSession()` en première ligne (frontière de sécurité) — voir Tâche 2 pour le pattern déjà utilisé dans `src/app/actions/onboarding.ts`.
- Aucun test runner n'est configuré dans ce dépôt (pas de vitest/jest dans `package.json`). Les étapes de vérification de ce plan utilisent `pnpm type-check`, `pnpm db:validate`, et des scripts Node autonomes exécutés via `npx tsx` à la place d'un framework de test. Ne pas ajouter de framework de test dans le cadre de ce plan — hors périmètre.

---

## Structure des fichiers

- `prisma/schema.prisma` — modifier : ajouter l'enum `ProductSource`, étendre le modèle `Product`, remplacer les valeurs de l'enum `ProductCategory`, ajouter le modèle `DossierProductEvent` + l'enum `DossierEventType`, ajouter la relation `events` sur `UserDossierProduct`. Aucun autre fichier de migration n'est créé — le SQL correspondant est fourni dans le plan lui-même (Tâche 1, dernière étape), pas écrit sur disque.
- `src/app/actions/dossier.ts` — créer : server actions supportant les écrans Dossier (recherche, confirmation de correspondance, ajout au dossier, liste/filtre, détail produit, historique). Reprend le pattern `requireSession()` + Prisma déjà utilisé dans `src/app/actions/onboarding.ts`.
- `scripts/verify-dossier-events.ts` — créer : script Node autonome (aucun framework de test disponible) qui exerce le comportement de journalisation d'événements de bout en bout contre un vrai client Prisma, utilisé comme substitut de tests automatisés pour ce plan.

## Séquencement des tâches

La Tâche 1 couvre tous les changements de schéma et se termine par un bloc SQL complet affiché dans le plan. **Ne pas démarrer la Tâche 2 avant que le développeur confirme que ce SQL a été appliqué et que `pnpm db:generate` a été exécuté** — `prisma db:validate`/type-check réussira sur le seul fichier de schéma, mais les server actions échoueront à l'exécution contre une base sans les colonnes.

---

### Tâche 1 : Changements de schéma — `ProductSource`, valeurs de `ProductCategory`, `DossierProductEvent`, et le SQL manuel complet

**Fichiers :**
- Modifier : `prisma/schema.prisma` (bloc d'enums vers la ligne 266, modèle `Product` lignes 645–665, ajouter modèle + enum près de `UserDossierProduct` ligne 759)

**Interfaces :**
- Produit : l'enum `ProductSource` (`CATALOG_SEED`, `USER_MANUAL`, `USER_OCR`), `Product.barcode: String? @unique`, `Product.sizeLabel: String?`, `Product.source: ProductSource` (défaut `USER_MANUAL`), `Product.createdByUserId: String?`, l'enum `ProductCategory` avec les valeurs `CLEANSING`/`PREPARATION`/`TREATMENT`/`SUPPORT`/`PROTECTION`, le modèle `DossierProductEvent` avec les champs `id: Int`, `dossierProductId: Int`, `type: DossierEventType`, `metadata: Json?`, `occurredAt: DateTime` — tous consommés par la Tâche 2 (server actions) et par le plan de sync OBF.

- [ ] **Étape 1 : Ajouter l'enum `ProductSource`**

Insérer juste après l'accolade fermante de `enum ProductCategory` (se terminant actuellement ligne 278 dans `prisma/schema.prisma`) :

```prisma
enum ProductSource {
  CATALOG_SEED
  USER_MANUAL
  USER_OCR

  @@schema("app")
}
```

- [ ] **Étape 2 : Ajouter les nouveaux champs à `Product`**

Dans le modèle `Product`, ajouter ces quatre champs après `updatedAt` (actuellement ligne 655) :

```prisma
model Product {
  id              Int             @id @default(autoincrement())
  brandId         Int?            @map("brandId")
  name            String
  slug            String          @unique
  category        ProductCategory
  subcategory     String?
  description     String?
  confidenceLevel ConfidenceLevel @default(UNVERIFIED) @map("confidenceLevel")
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updatedAt")
  barcode         String?         @unique
  sizeLabel       String?         @map("size_label")
  source          ProductSource   @default(USER_MANUAL)
  createdByUserId String?         @map("created_by_user_id")

  brand           Brand?               @relation(fields: [brandId], references: [id], onDelete: SetNull)
  aliases         ProductAlias[]
  metadata        ProductMetadata[]
  versions        ProductVersion[]
  dossierProducts UserDossierProduct[]

  @@map("products")
  @@schema("app")
}
```

Note : le brouillon de la spec utilisait `@map("sizeLabel")`/`@map("createdByUserId")`, qui ne sont pas du vrai snake_case et violeraient la règle de mapping du projet — ce plan utilise `size_label` et `created_by_user_id` à la place, cohérent avec tous les autres `@map` du fichier pour les colonnes de type clé étrangère. `barcode` et `source` n'ont pas besoin de `@map` — leurs noms de colonne correspondent déjà au snake_case (mot unique).

- [ ] **Étape 3 : Remplacer les valeurs de l'enum `ProductCategory`**

Remplacer le bloc `enum ProductCategory` existant :

```prisma
enum ProductCategory {
  CLEANSER
  TONER
  SERUM
  MOISTURIZER
  SUNSCREEN
  MASK
  OIL
  TREATMENT
  OTHER

  @@schema("app")
}
```

par :

```prisma
enum ProductCategory {
  CLEANSING
  PREPARATION
  TREATMENT
  SUPPORT
  PROTECTION

  @@schema("app")
}
```

- [ ] **Étape 4 : Rechercher dans le code les références aux anciennes valeurs d'enum devenues invalides**

Lancer : `grep -rn "CLEANSER\|TONER\|SERUM\|MOISTURIZER\|SUNSCREEN\|MASK\b\|'OIL'\|ProductCategory.OIL\|ProductCategory.OTHER" src/ --include="*.ts" --include="*.tsx"`
Attendu : aucune correspondance référençant les anciennes valeurs comme membres de `ProductCategory`. (Des usages en anglais courant de ces mots, sans lien avec l'enum, sont acceptables — ne signaler que les références littérales à l'enum.) Si du code d'implémentation référence les anciennes valeurs, le noter mais ne pas corriger de fichiers non liés dans ce plan — ouvrir un suivi, car aucun usage de ce type n'est attendu à ce stade (les écrans Dossier n'ont pas encore été construits).

- [ ] **Étape 5 : Ajouter l'enum `DossierEventType`**

Insérer après l'enum `ProductSource` ajouté à l'Étape 1 :

```prisma
enum DossierEventType {
  ADDED_TO_DOSSIER
  STATUS_CHANGED
  ADDED_TO_RITUAL
  REMOVED_FROM_RITUAL
  EDITED

  @@schema("app")
}
```

- [ ] **Étape 6 : Ajouter le modèle `DossierProductEvent`**

Insérer après le modèle `UserDossierProduct` (après sa ligne de fermeture `@@schema("app")`, actuellement ligne 777) :

```prisma
model DossierProductEvent {
  id               Int              @id @default(autoincrement())
  dossierProductId Int              @map("dossierProductId")
  type             DossierEventType
  metadata         Json?
  occurredAt       DateTime         @default(now()) @map("occurredAt")

  dossierProduct UserDossierProduct @relation(fields: [dossierProductId], references: [id], onDelete: Cascade)

  @@index([dossierProductId, occurredAt])
  @@map("dossier_product_events")
  @@schema("app")
}
```

- [ ] **Étape 7 : Ajouter la relation inverse sur `UserDossierProduct`**

Dans le modèle `UserDossierProduct`, ajouter `events DossierProductEvent[]` au bloc de relations :

```prisma
  user        User         @relation(fields: [userId], references: [id], onDelete: Restrict)
  product     Product      @relation(fields: [productId], references: [id], onDelete: Restrict)
  ritualItems RitualItem[]
  events      DossierProductEvent[]
```

(Ajouter uniquement la nouvelle ligne `events` — le `onDelete` de `user` reste `Cascade` comme déjà écrit ; ne pas changer les attributs de relation existants.)

- [ ] **Étape 8 : Valider le fichier de schéma**

Lancer : `pnpm db:validate`
Attendu : `The schema at prisma/schema.prisma is valid 🚀` (aucune erreur de champ dupliqué ou de type inconnu)

- [ ] **Étape 9 : Fournir le SQL manuel complet (bloc de code, aucun fichier créé)**

Ce bloc unique couvre tous les changements de schéma des Étapes 1–7 ci-dessus (champs Product, migration des valeurs ProductCategory, table DossierProductEvent). Il n'est **pas** écrit dans un fichier sur disque — il est simplement affiché ici, à copier-coller et exécuter manuellement par le développeur (jamais par un agent).

```sql
-- Migration manuelle pour docs/superpowers/plans/2026-09-15-dossier-product-database.md
-- NE PAS exécuter ceci automatiquement. Relire chaque instruction, en
-- particulier la table de mapping ProductCategory ci-dessous, avant
-- d'appliquer manuellement. À exécuter sur le schéma "app".

BEGIN;

-- 1. Nouvel enum pour Product.source
CREATE TYPE app."ProductSource" AS ENUM ('CATALOG_SEED', 'USER_MANUAL', 'USER_OCR');

-- 2. Nouvelles colonnes sur products
ALTER TABLE app.products
  ADD COLUMN barcode TEXT,
  ADD COLUMN size_label TEXT,
  ADD COLUMN source app."ProductSource" NOT NULL DEFAULT 'USER_MANUAL',
  ADD COLUMN created_by_user_id TEXT;

ALTER TABLE app.products
  ADD CONSTRAINT products_barcode_key UNIQUE (barcode);

-- 3. Migration des valeurs de l'enum ProductCategory.
-- À RELIRE AVANT EXÉCUTION : MASK, OIL et OTHER n'ont pas de correspondance
-- évidente en 1:1. Le mapping ci-dessous est une proposition de départ
-- issue de la spec de conception
-- (docs/superpowers/specs/2026-09-14-dossier-product-database-design.md) —
-- inspecter les lignes réelles de ces trois catégories avant d'exécuter,
-- car mal classer un produit existant change ce que le filtre/l'UI de
-- catégorie du Dossier affiche pour lui.
--
--   CLEANSER    -> CLEANSING
--   TONER       -> PREPARATION
--   SERUM       -> TREATMENT
--   MOISTURIZER -> SUPPORT
--   SUNSCREEN   -> PROTECTION
--   TREATMENT   -> TREATMENT
--   MASK        -> TREATMENT   (à revoir : pourrait être SUPPORT selon le produit)
--   OIL         -> SUPPORT     (à revoir : pourrait être TREATMENT selon le produit)
--   OTHER       -> SUPPORT     (à revoir : fourre-tout, inspecter les lignes réelles)

ALTER TYPE app."ProductCategory" RENAME TO "ProductCategory_old";

CREATE TYPE app."ProductCategory" AS ENUM (
  'CLEANSING', 'PREPARATION', 'TREATMENT', 'SUPPORT', 'PROTECTION'
);

ALTER TABLE app.products
  ALTER COLUMN category DROP DEFAULT,
  ALTER COLUMN category TYPE app."ProductCategory"
  USING (
    CASE category::text
      WHEN 'CLEANSER'    THEN 'CLEANSING'
      WHEN 'TONER'       THEN 'PREPARATION'
      WHEN 'SERUM'       THEN 'TREATMENT'
      WHEN 'MOISTURIZER' THEN 'SUPPORT'
      WHEN 'SUNSCREEN'   THEN 'PROTECTION'
      WHEN 'TREATMENT'   THEN 'TREATMENT'
      WHEN 'MASK'        THEN 'TREATMENT'
      WHEN 'OIL'         THEN 'SUPPORT'
      WHEN 'OTHER'       THEN 'SUPPORT'
    END
  )::app."ProductCategory";

DROP TYPE app."ProductCategory_old";

-- 4. Nouvelle table : dossier_product_events
CREATE TYPE app."DossierEventType" AS ENUM (
  'ADDED_TO_DOSSIER', 'STATUS_CHANGED', 'ADDED_TO_RITUAL',
  'REMOVED_FROM_RITUAL', 'EDITED'
);

CREATE TABLE app.dossier_product_events (
  id                  SERIAL PRIMARY KEY,
  "dossierProductId"  INTEGER NOT NULL REFERENCES app.user_dossier_products(id) ON DELETE CASCADE,
  type                app."DossierEventType" NOT NULL,
  metadata            JSONB,
  "occurredAt"        TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE INDEX dossier_product_events_dossier_product_id_occurred_at_idx
  ON app.dossier_product_events ("dossierProductId", "occurredAt");

COMMIT;
```

Note : ceci utilise `"dossierProductId"` / `"occurredAt"` (colonnes camelCase entre guillemets) pour correspondre aux noms de champs sans `@map` du modèle Prisma ci-dessus, suivant la convention déjà présente dans ce fichier pour les colonnes de clé étrangère `*Id` comme `brandId`, `regimenId`. Si le développeur préfère un snake_case strict ici, il doit aussi mettre à jour les attributs `@map` correspondants dans `prisma/schema.prisma` avant de lancer `pnpm db:generate` — signaler ce choix au développeur plutôt que de trancher unilatéralement, car le schéma existant est incohérent sur ce point (comparer `user_id` vs `brandId`).

- [ ] **Étape 10 : Passation au développeur**

Dire directement à l'utilisateur : "Voici le SQL complet à exécuter manuellement pour appliquer les changements de schéma de ce plan (bloc SQL de l'Étape 9 ci-dessus). Merci de relire le mapping `ProductCategory` (en particulier MASK/OIL/OTHER) au regard de vos données réelles, puis de l'exécuter vous-même en base. Prévenez-moi une fois fait et je lancerai `pnpm db:generate` pour continuer avec les server actions." **Ne pas passer à la Tâche 2 avant confirmation du développeur.**

- [ ] **Étape 11 : Générer le client Prisma (après confirmation du développeur)**

Lancer : `pnpm db:generate && rm -rf .next`
Attendu : Prisma Client régénéré sans erreur. **Ceci nécessite que le SQL de l'Étape 9 ait déjà été exécuté par le développeur en base.**

Pas de commit à cette étape — un seul commit couvrant tout le plan est fait à la toute fin (voir Tâche 4, dernière étape).

---

### Tâche 2 : Server actions — recherche, confirmation de correspondance, ajout au Dossier (avec journalisation d'événements)

**Fichiers :**
- Créer : `src/app/actions/dossier.ts`

**Interfaces :**
- Consomme : `prisma` depuis `@/lib/prisma`, `auth` depuis `@/lib/auth`, `headers` depuis `next/headers` (même pattern que `src/app/actions/onboarding.ts:1-5`) ; les types `Product`, `ProductCategory`, `DossierProductStatus`, `DossierEventType` depuis `@prisma/client`.
- Produit : `searchProducts(query: string): Promise<Array<{ id: number; name: string; brandName: string | null; category: ProductCategory; sizeLabel: string | null }>>`, `addProductToDossier(input: { productId: number; category: ProductCategory; status: DossierProductStatus }): Promise<{ dossierProductId: number }>` — consommés par la Tâche 3 (liste/filtre/détail) et par les futurs écrans front.

- [ ] **Étape 1 : Amorcer le fichier avec l'aide d'authentification**

```typescript
'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ProductCategory, DossierProductStatus } from '@prisma/client'

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user
}
```

- [ ] **Étape 2 : Implémenter `searchProducts`**

```typescript
export async function searchProducts(query: string) {
  await requireSession()

  const trimmed = query.trim()
  if (trimmed.length === 0) return []

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: trimmed, mode: 'insensitive' } },
        { brand: { name: { contains: trimmed, mode: 'insensitive' } } },
        { aliases: { some: { alias: { contains: trimmed, mode: 'insensitive' } } } },
        { brand: { aliases: { some: { alias: { contains: trimmed, mode: 'insensitive' } } } } },
      ],
    },
    include: { brand: true },
    take: 20,
  })

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    brandName: p.brand?.name ?? null,
    category: p.category,
    sizeLabel: p.sizeLabel,
  }))
}
```

- [ ] **Étape 3 : Implémenter `addProductToDossier` avec journalisation d'événement dans une seule transaction**

```typescript
export async function addProductToDossier(input: {
  productId: number
  category: ProductCategory
  status: DossierProductStatus
}) {
  const user = await requireSession()

  const result = await prisma.$transaction(async (tx) => {
    if (input.category) {
      await tx.product.update({
        where: { id: input.productId },
        data: { category: input.category },
      })
    }

    const dossierProduct = await tx.userDossierProduct.create({
      data: {
        userId: user.id,
        productId: input.productId,
        status: input.status,
      },
    })

    await tx.dossierProductEvent.create({
      data: {
        dossierProductId: dossierProduct.id,
        type: 'ADDED_TO_DOSSIER',
        metadata: { status: input.status },
      },
    })

    return dossierProduct
  })

  return { dossierProductId: result.id }
}
```

- [ ] **Étape 4 : Type-check**

Lancer : `pnpm type-check`
Attendu : aucune erreur dans `src/app/actions/dossier.ts`. (Cela échouera si la génération du Prisma Client de la Tâche 1 n'a pas eu lieu, ou si le développeur n'a pas encore appliqué le SQL de la Tâche 1 et que vous vérifiez contre un schéma non concordant — `type-check` ne vérifie que contre les types du client généré, pas contre la base live, donc cela devrait réussir une fois l'Étape 11 de la Tâche 1 terminée avec succès.)

Pas de commit à cette étape — un seul commit couvrant tout le plan est fait à la toute fin (voir Tâche 4, dernière étape).

---

### Tâche 3 : Server actions — liste/filtre, détail produit et historique

**Fichiers :**
- Modifier : `src/app/actions/dossier.ts`

**Interfaces :**
- Consomme : `requireSession()` de la Tâche 2 (même fichier).
- Produit : `listDossierProducts(filter?: { status?: DossierProductStatus; category?: ProductCategory; timeOfDay?: TimeOfDay }): Promise<...>`, `getProductDetail(dossierProductId: number): Promise<...>`, `getDossierProductHistory(dossierProductId: number): Promise<Array<{ type: DossierEventType; metadata: unknown; occurredAt: Date }>>`, `updateDossierProductStatus(dossierProductId: number, status: DossierProductStatus): Promise<void>`.

- [ ] **Étape 1 : Implémenter `listDossierProducts`**

```typescript
import type { TimeOfDay } from '@prisma/client'

export async function listDossierProducts(filter?: {
  status?: DossierProductStatus
  category?: ProductCategory
  timeOfDay?: TimeOfDay
}) {
  const user = await requireSession()

  const items = await prisma.userDossierProduct.findMany({
    where: {
      userId: user.id,
      status: filter?.status,
      product: filter?.category ? { category: filter.category } : undefined,
      ritualItems: filter?.timeOfDay ? { some: { timeOfDay: filter.timeOfDay } } : undefined,
    },
    include: { product: { include: { brand: true } } },
    orderBy: { addedAt: 'desc' },
  })

  return items.map((item) => ({
    dossierProductId: item.id,
    status: item.status,
    productName: item.product.name,
    brandName: item.product.brand?.name ?? null,
    category: item.product.category,
  }))
}
```

- [ ] **Étape 2 : Implémenter `getProductDetail`**

```typescript
export async function getProductDetail(dossierProductId: number) {
  const user = await requireSession()

  const item = await prisma.userDossierProduct.findFirstOrThrow({
    where: { id: dossierProductId, userId: user.id },
    include: {
      product: {
        include: {
          brand: true,
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              ingredients: {
                orderBy: { position: 'asc' },
                include: { canonicalIngredient: true },
              },
            },
          },
        },
      },
      ritualItems: true,
    },
  })

  const latestVersion = item.product.versions[0]

  return {
    dossierProductId: item.id,
    status: item.status,
    productName: item.product.name,
    brandName: item.product.brand?.name ?? null,
    category: item.product.category,
    sizeLabel: item.product.sizeLabel,
    usedIn: item.ritualItems.map((r) => ({ timeOfDay: r.timeOfDay, stepOrder: r.stepOrder })),
    ingredients:
      latestVersion?.ingredients.map((i) => ({
        inci: i.canonicalIngredient.inci,
        isKeyIngredient: i.isKeyIngredient,
        concentration: i.concentration,
      })) ?? [],
  }
}
```

- [ ] **Étape 3 : Implémenter `getDossierProductHistory`**

```typescript
export async function getDossierProductHistory(dossierProductId: number) {
  const user = await requireSession()

  await prisma.userDossierProduct.findFirstOrThrow({
    where: { id: dossierProductId, userId: user.id },
    select: { id: true },
  })

  const events = await prisma.dossierProductEvent.findMany({
    where: { dossierProductId },
    orderBy: { occurredAt: 'desc' },
  })

  return events.map((e) => ({ type: e.type, metadata: e.metadata, occurredAt: e.occurredAt }))
}
```

- [ ] **Étape 4 : Implémenter `updateDossierProductStatus` avec journalisation d'événement**

```typescript
export async function updateDossierProductStatus(dossierProductId: number, status: DossierProductStatus) {
  const user = await requireSession()

  await prisma.$transaction(async (tx) => {
    const current = await tx.userDossierProduct.findFirstOrThrow({
      where: { id: dossierProductId, userId: user.id },
    })

    if (current.status === status) return

    await tx.userDossierProduct.update({
      where: { id: dossierProductId },
      data: { status },
    })

    await tx.dossierProductEvent.create({
      data: {
        dossierProductId,
        type: 'STATUS_CHANGED',
        metadata: { from: current.status, to: status },
      },
    })
  })
}
```

- [ ] **Étape 5 : Type-check**

Lancer : `pnpm type-check`
Attendu : aucune erreur.

Pas de commit à cette étape — un seul commit couvrant tout le plan est fait à la toute fin (voir Tâche 4, dernière étape).

---

### Tâche 4 : Script de vérification pour la journalisation d'événements (substitut de framework de test)

**Fichiers :**
- Créer : `scripts/verify-dossier-events.ts`

**Interfaces :**
- Consomme : `prisma` depuis `@/lib/prisma`, et nécessite une connexion à une base de données live avec le SQL de la Tâche 1 déjà appliqué. N'appelle pas directement les server actions (celles-ci nécessitent une session/`headers()`, indisponibles hors contexte de requête) — exerce à la place les mêmes opérations Prisma qu'elles effectuent, pour vérifier que le schéma et la logique de transaction fonctionnent de bout en bout.

Ce projet n'a aucun test runner (pas de vitest/jest dans `package.json` — voir Contraintes globales). Ce script est le substitut vérifiable le plus proche : il crée de vraies lignes, fait des assertions sur de vrais résultats de requêtes, et nettoie après lui. Ne pas ajouter de framework de test pour satisfaire cette tâche — hors périmètre pour ce plan.

- [ ] **Étape 1 : Écrire le script de vérification**

```typescript
// scripts/verify-dossier-events.ts
// Script de vérification ponctuel (aucun framework de test dans ce dépôt —
// voir le plan docs/superpowers/plans/2026-09-15-dossier-product-database.md, Tâche 4).
// Lancer avec : npx tsx scripts/verify-dossier-events.ts
// Nécessite que DATABASE_URL pointe vers une base où le SQL manuel de la
// Tâche 1 (voir ce plan) a déjà été exécuté.

import { prisma } from '../src/lib/prisma'

async function main() {
  const testUserId = `verify-dossier-events-${Date.now()}`

  await prisma.user.create({
    data: { id: testUserId, email: `${testUserId}@example.test`, name: 'Verify Script User' },
  })

  const product = await prisma.product.create({
    data: {
      name: 'Verify Script Test Cleanser',
      slug: `verify-script-test-cleanser-${Date.now()}`,
      category: 'CLEANSING',
      source: 'USER_MANUAL',
      barcode: `test-${Date.now()}`,
    },
  })

  const dossierProduct = await prisma.userDossierProduct.create({
    data: { userId: testUserId, productId: product.id, status: 'ACTIVE' },
  })

  await prisma.dossierProductEvent.create({
    data: { dossierProductId: dossierProduct.id, type: 'ADDED_TO_DOSSIER', metadata: { status: 'ACTIVE' } },
  })

  await prisma.userDossierProduct.update({
    where: { id: dossierProduct.id },
    data: { status: 'SEASONAL' },
  })
  await prisma.dossierProductEvent.create({
    data: {
      dossierProductId: dossierProduct.id,
      type: 'STATUS_CHANGED',
      metadata: { from: 'ACTIVE', to: 'SEASONAL' },
    },
  })

  const events = await prisma.dossierProductEvent.findMany({
    where: { dossierProductId: dossierProduct.id },
    orderBy: { occurredAt: 'asc' },
  })

  assertEqual(events.length, 2, 'expected 2 events')
  assertEqual(events[0].type, 'ADDED_TO_DOSSIER', 'first event type')
  assertEqual(events[1].type, 'STATUS_CHANGED', 'second event type')

  const cascadeCheck = await prisma.userDossierProduct.delete({ where: { id: dossierProduct.id } })
  const eventsAfterDelete = await prisma.dossierProductEvent.findMany({
    where: { dossierProductId: cascadeCheck.id },
  })
  assertEqual(eventsAfterDelete.length, 0, 'events should cascade-delete with their dossier product')

  await prisma.product.delete({ where: { id: product.id } })
  await prisma.user.delete({ where: { id: testUserId } })

  console.log('PASS: all dossier event assertions succeeded')
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`FAIL: ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
```

- [ ] **Étape 2 : Lancer contre une base avec la migration appliquée**

Lancer : `npx tsx scripts/verify-dossier-events.ts`
Attendu : `PASS: all dossier event assertions succeeded`. En cas d'échec avec une erreur de colonne introuvable, le développeur n'a pas encore appliqué le SQL de la Tâche 1 — s'arrêter et confirmer avec lui avant de continuer.

- [ ] **Étape 3 : Commit unique pour l'ensemble du plan**

C'est le seul commit de tout ce plan — il regroupe le schéma Prisma (Tâche 1), les server actions (Tâches 2 et 3) et ce script de vérification (Tâche 4).

```bash
git add prisma/schema.prisma src/app/actions/dossier.ts scripts/verify-dossier-events.ts
git commit -m "feat: add Dossier product database schema, server actions, and event-logging verification script"
```

---

## Notes d'auto-relecture

- **Couverture de la spec :** les champs `Product`, le remplacement `ProductCategory` + mapping de données, et la table `DossierProductEvent` sont tous couverts par la Tâche 1, avec un seul bloc SQL consolidé affiché dans le plan. Le mapping écran→entité de la table de la spec est couvert par les Tâches 2–3 (recherche=écran 04, confirmation de correspondance=écran 05 via le résultat de `searchProducts` + une lecture de détail ultérieure, ajout au dossier=écran 06, liste/filtre=écrans 08/09, détail produit=écran 10, ingrédients=écran 11 via `getProductDetail`, historique=écran 12). Les écrans 01/02/03 sont un pur flow front sans besoin backend nouveau, selon la spec.
- **Détection de placeholders :** aucun marqueur TBD/TODO ; chaque étape contient du code exécutable ou une commande shell exacte.
- **Cohérence des types :** `dossierProductId` utilisé de manière cohérente à travers la Tâche 1 (schéma), la Tâche 2 (`addProductToDossier`), la Tâche 3 (`getDossierProductHistory`, `updateDossierProductStatus`) et la Tâche 4 (script de vérification). `ProductCategory`/`DossierProductStatus`/`DossierEventType` importés de manière cohérente depuis `@prisma/client` dans chaque tâche qui les utilise.
- **Déviation signalée :** les `@map("sizeLabel")` / `@map("createdByUserId")` du brouillon de la spec n'étaient pas du vrai snake_case ; la Tâche 1 utilise `size_label` / `created_by_user_id` à la place et signale explicitement ce choix au développeur, car la spec ne l'avait pas anticipé et AGENTS.md est strict sur le mapping snake_case.
- **SQL non écrit sur disque, un seul commit :** à la demande de Gilles (2026-09-15), le SQL manuel n'est plus écrit dans `prisma/migrations-manual/` — il est fourni comme bloc de code unique dans le plan (Tâche 1), à copier-coller par le développeur. De même, les commits intermédiaires par tâche ont été supprimés : un unique commit, à la toute fin de la Tâche 4, couvre l'ensemble du plan (schéma, server actions, script de vérification).
