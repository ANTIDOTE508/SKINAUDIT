# Design — Base de produits pour le flow "Dossier"

Date : 2026-09-14
Statut : validé en brainstorming, prêt pour writing-plans

## Contexte

L'utilisateur doit livrer plusieurs écrans front du flow "Dossier" (mockup UX fourni : Build your Dossier, Add a product avec Search/Scan/Enter manually, Search Results, Confirm Match, Add to Dossier avec Category & Status, Dossier list avec Filter/Sort, Product Detail sheet, Ingredients, Product History). Ces écrans permettent à un utilisateur d'ajouter des produits cosmétiques à son Dossier personnel.

Un premier rapport (`RAPPORT_Primary_Product_Database_MVP.md`) analysait le memo `SKINAUDIT_MEMO_IngredientDatabases.7.8.26.pdf` et recommandait Open Beauty Facts (OBF) + EU CosIng comme sources externes. Ce rapport a été écrit **avant** l'inspection du schéma Prisma existant et avant la présentation du mockup — il proposait un modèle de données qui, à l'examen du schéma réel, existe déjà en grande partie.

Ce document remplace la partie "architecture de données" de ce premier rapport, à la lumière :
1. du schéma Prisma déjà en place (`prisma/schema.prisma`), qui couvre déjà `Product`, `Brand`, `ProductVersion`, `ProductVersionIngredient`, `CanonicalIngredient`, `UserDossierProduct`, `UserRegimen`, `RitualItem` ;
2. du mockup UX concret ("Dossier — UX Flow", 12 écrans).

## Périmètre

**Inclus dans ce chantier :**
- Extensions de schéma minimales pour supporter les 12 écrans du mockup
- Catalogue produit alimenté par saisie manuelle et OCR (pipeline existant Google ML Kit + GPT-4o)
- Historique d'événements Dossier (timeline)

**Explicitement hors périmètre (chantier séparé ultérieur) :**
- Job de sync périodique Open Beauty Facts / EU CosIng — le front n'a pas besoin de savoir d'où vient la donnée catalogue
- Modération/fusion des produits `USER_MANUAL`/`USER_OCR` vers un catalogue "officiel"

## Schéma existant réutilisé sans modification

`Brand`, `BrandAlias`, `ProductAlias`, `ProductVersion`, `ProductVersionIngredient`, `CanonicalIngredient`, `IngredientAlias`, `UserDossierProduct` (structure), `UserRegimen`, `RitualItem`, enums `DossierProductStatus` (ACTIVE/SEASONAL/ARCHIVED), `TimeOfDay` (AM/PM/BOTH), `UsageFrequency`, `ConfidenceLevel` (pilote déjà le badge "not evaluated" du mockup via `UNVERIFIED`).

## Modifications de schéma

### 1. `Product` — nouveaux champs

```prisma
model Product {
  // ...champs existants inchangés...
  barcode         String?       @unique
  sizeLabel       String?       @map("sizeLabel")       // ex: "118 ml"
  source          ProductSource @default(USER_MANUAL) @map("source")
  createdByUserId String?       @map("createdByUserId")
}

enum ProductSource {
  CATALOG_SEED    // produits pré-chargés (import initial, sans sync auto)
  USER_MANUAL
  USER_OCR

  @@schema("app")
}
```

Justification : le mockup montre des résultats de recherche par taille de produit distincte (écran 04) et un flow de saisie manuelle/scan (écran 03) qu'il faut pouvoir distinguer d'un produit catalogue pour la modération future.

### 2. `ProductCategory` — remplacement des valeurs

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

Remplace l'énumération actuelle (CLEANSER/TONER/SERUM/MOISTURIZER/SUNSCREEN/MASK/OIL/TREATMENT/OTHER) pour s'aligner sur les 5 catégories fonctionnelles affichées dans le Dossier et son filtre (écran 09). C'est la catégorie affichée/éditée à l'écran 06 "Add to Dossier" — pas un champ séparé au niveau du Dossier.

**Migration de données requise (SQL manuel, par le développeur — aucune commande `prisma migrate` ne sera lancée par un agent) :**
| Ancienne valeur | Nouvelle valeur |
|---|---|
| CLEANSER | CLEANSING |
| TONER | PREPARATION |
| SERUM | TREATMENT |
| MOISTURIZER | SUPPORT |
| SUNSCREEN | PROTECTION |
| TREATMENT | TREATMENT |
| MASK | TREATMENT |
| OIL | SUPPORT |
| OTHER | SUPPORT |

Ce mapping est une proposition par défaut ; le développeur doit revalider chaque ligne existante en base avant application, en particulier MASK/OIL/OTHER qui n'ont pas de correspondance évidente.

### 3. Nouvelle table `DossierProductEvent`

```prisma
model DossierProductEvent {
  id               Int              @id @default(autoincrement())
  dossierProductId Int              @map("dossierProductId")
  type             DossierEventType
  metadata         Json?
  occurredAt       DateTime         @default(now()) @map("occurredAt")

  dossierProduct UserDossierProduct @relation(fields: [dossierProductId], references: [id], onDelete: Cascade)

  @@map("dossier_product_events")
  @@schema("app")
}

enum DossierEventType {
  ADDED_TO_DOSSIER
  STATUS_CHANGED
  ADDED_TO_RITUAL
  REMOVED_FROM_RITUAL
  EDITED

  @@schema("app")
}
```

Justification : l'écran 12 "History" affiche une timeline précise ("Added to Dossier" le 7 sept, "Added to PM Ritual — 3 nights/week" le 7 sept, "Moved to Seasonal" le 18 déc, "Returned to Active" le 3 mars) qui n'est pas reconstructible de manière fiable à partir des seuls timestamps `updatedAt` si le statut change plusieurs fois. `metadata` (JSON) porte le détail contextuel (ex: `{"timeOfDay":"PM","frequency":"3x/week"}` ou `{"from":"ACTIVE","to":"SEASONAL"}`).

Chaque écriture métier pertinente (création `UserDossierProduct`, changement de `status`, création/suppression `RitualItem`) doit créer l'événement correspondant dans la même transaction applicative.

Ajout sur `UserDossierProduct` :
```prisma
model UserDossierProduct {
  // ...existant...
  events DossierProductEvent[]
}
```

### 4. Ajustement `Product.category`

`category` conserve son type `ProductCategory` (non-nullable, comme actuellement) — pas de changement structurel au-delà du remplacement des valeurs de l'enum décrit au point 2.

## Mapping écrans mockup → entités/requêtes

| Écran | Entités impliquées |
|---|---|
| 01/02 — Build/Empty Dossier | `count(UserDossierProduct where userId)` |
| 03 — Add Product (méthode) | pas de requête, choix de flow front |
| 04 — Search Results | recherche sur `Product.name` / `Brand.name` / `ProductAlias.alias` / `BrandAlias.alias` |
| 05 — Confirm Match | lecture `Product` + `Brand` sélectionné |
| 06 — Add to Dossier (Category & Status) | création `UserDossierProduct` (status) + `DossierProductEvent(ADDED_TO_DOSSIER)` ; catégorie affichée = `Product.category` |
| 08/09 — Dossier list / Filter | `UserDossierProduct` jointe à `Product.category`, filtre `status`, filtre `RitualItem.timeOfDay` |
| 10 — Product Detail sheet | `Product` + `UserDossierProduct.status` + `RitualItem[]` ("Used in") + actions Edit/Archive |
| 11 — Ingredients | dernier `ProductVersion` → `ProductVersionIngredient` (ordonné par `position`) → `CanonicalIngredient.inci` |
| 12 — History | `DossierProductEvent` par `dossierProductId`, triés par `occurredAt` |

Flow Scan (écran 03) : pipeline OCR existant (Google ML Kit) + GPT-4o pour tenter un matching sur `Product` existant ; si aucun match, création `Product(source=USER_OCR, confidenceLevel=UNVERIFIED)`.
Flow Enter manually (écran 03) : création directe `Product(source=USER_MANUAL, confidenceLevel=UNVERIFIED)`.

## Conventions à respecter (règles projet)

- Tout nouveau champ camelCase → `@map("snake_case")` correspondant (déjà appliqué ci-dessus)
- Aucune commande `prisma migrate dev/deploy` ne sera exécutée par un agent — les changements de schéma ci-dessus sont conceptuels, à traduire en SQL brut par le développeur
- Après application manuelle du schéma : `pnpm db:generate` puis `rm -rf .next`
- `userId` reste `@map("user_id")` partout (aucun changement sur ce point, déjà conforme dans `UserDossierProduct`)

## Risques / points d'attention

- **Migration `ProductCategory`** : nécessite une revue manuelle des données existantes avant application (voir table de mapping ci-dessus, non garantie sans ambiguïté).
- **Volume `DossierProductEvent`** : table à croissance continue (un événement par action utilisateur) — prévoir un index sur `dossierProductId` + `occurredAt` pour la requête de timeline ; pas de rétention/purge nécessaire au MVP compte tenu du volume attendu par utilisateur.
- **Produits `USER_MANUAL`/`USER_OCR` non modérés** : peuvent créer des doublons du même produit avec des noms légèrement différents ; pas de déduplication automatique prévue dans ce chantier (accepté comme dette pour le futur chantier de sync OBF, qui pourra réconcilier).

## Suite

Passage à `writing-plans` pour transformer ce design en plan d'implémentation détaillé, avant exécution (probablement via l'agent `skinaudit-fullstack`).
