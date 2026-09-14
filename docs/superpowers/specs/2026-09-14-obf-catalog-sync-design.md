# Design — Sync récurrent Open Beauty Facts vers le catalogue produit

Date : 2026-09-14
Statut : validé en brainstorming, prêt pour writing-plans

## Contexte

Chantier explicitement exclu du chantier Dossier (`docs/superpowers/specs/2026-09-14-dossier-product-database-design.md`), qui alimentait le catalogue uniquement par saisie manuelle et OCR. Ce document couvre la mise en place du fetch et de la synchronisation récurrente des données produits cosmétiques depuis Open Beauty Facts (OBF), pour peupler `Product`/`Brand`/`CanonicalIngredient` avec des données de catalogue fiables et à jour.

## Dépendance bloquante

Le schéma Prisma actuel (`prisma/schema.prisma`) ne contient **pas encore** les champs `barcode`, `sizeLabel`, `source`, `createdByUserId` sur `Product`, ni l'enum `ProductSource`, décrits dans la spec Dossier — cette spec a été validée en conception mais jamais implémentée en base à ce jour. Ce chantier OBF s'appuie directement sur ces champs (upsert par `barcode`, marquage `source = CATALOG_SEED`).

**Séquencement requis** : l'implémentation des champs de schéma de la spec Dossier doit être faite avant ou en même temps que ce chantier — pas redéfinie en double dans deux plans séparés.

## Recherche factuelle sur l'API/les données OBF

- OBF déconseille explicitement le scraping via l'API produit pour tout besoin en masse ou à haut volume ; l'équipe recommande les exports nocturnes complets.
- Formats d'export disponibles : dump MongoDB compressé (généré chaque nuit), delta export quotidien des 14 derniers jours (n'indique pas les suppressions), **JSONL.gz** (une ligne = un objet JSON, format retenu), Parquet (Hugging Face, simplifié), CSV.gz (~0,9 Go compressé, séparateur tabulation).
- Champs disponibles documentés à `https://world.openbeautyfacts.org/data/data-fields.txt`.
- Licence : structure sous **ODbL 1.0**, contenus sous **DBCL 1.0**, images sous **CC BY-SA**. Obligation centrale : consulter les conditions avant réutilisation ; les contributeurs demandent à être informés des réutilisations (`reuse@openfoodfacts.org`).
- **Risque de fiabilité documenté** : un thread du forum OBF (`forum.openfoodfacts.org/t/is-the-open-beauty-facts-database-dump-incomplete/2103`) rapporte des incidents non résolus de dumps radicalement incomplets (ex: passage de 4M à 700K produits, puis quasi 0, sans réponse officielle de l'équipe). Ce chantier doit donc inclure une vérification post-fetch, pas une confiance aveugle dans le dump.

## Approche retenue

**Script Node standalone (`scripts/sync-obf.ts`) + cron GitHub Actions**, plutôt que Vercel Cron/Function (limites de durée/mémoire/payload incompatibles avec le streaming d'un dump de plusieurs centaines de Mo, même filtré) ou query API runtime (déjà écartée, et maintenant confirmée par la doc OBF elle-même comme anti-pattern).

## Pipeline

```
1. Télécharger openbeautyfacts-products.jsonl.gz en stream (jamais chargé
   entièrement en mémoire)
2. Décompresser en stream (gzip) + parser ligne par ligne (JSONL)
3. Filtrer chaque ligne :
   - categories_tags correspond à la taxonomie skincare
   - code (barcode) non vide — c'est la clé d'upsert, une fiche sans
     barcode est ignorée
   - ingredients_text non vide
   - brands non vide
4. Normaliser vers le modèle Product/Brand
5. Upsert par barcode (unique) en batchs (ex: 500 lignes par transaction)
6. Logger : nb lignes lues, nb filtrées, nb upsertées, nb erreurs
7. Vérification post-run : si nb upsertés < seuil minimal attendu (à
   calibrer empiriquement au premier run réel) → le script s'arrête en
   erreur avec un rapport, sans upsert partiel silencieux — garde-fou
   direct contre l'incident de dump incomplet documenté ci-dessus
```

## Mapping des champs OBF → `Product`

| Champ OBF | Champ `Product` |
|---|---|
| `code` | `barcode` |
| `product_name` | `name` |
| `brands` | `Brand.name` (créé si absent) |
| `categories_tags` | `category` (mappé vers les 5 valeurs CLEANSING/PREPARATION/TREATMENT/SUPPORT/PROTECTION de la spec Dossier) |
| `ingredients_text` | stocké tel quel comme texte source ; **pas** de matching fin vers `CanonicalIngredient` dans ce chantier — normalisation ultérieure hors périmètre, potentiellement via le pipeline OCR/GPT-4o existant |
| `quantity` | `sizeLabel` |
| — | `source = CATALOG_SEED` (fixe pour toute ligne importée par ce script) |

## Filtrage et volumétrie

Le filtre catégorie skincare + présence de `barcode` réduit fortement le volume par rapport au dump complet OBF (toutes catégories beauté/hygiène, y compris fiches sans code-barres). La volumétrie réelle après filtrage n'est pas connue à l'avance — le garde-fou de l'étape 7 du pipeline sert aussi de première mesure réelle, à utiliser pour calibrer si un filtrage additionnel devient nécessaire pour rester sous le quota Neon free tier (0.5 Go).

## Récurrence

Cron hebdomadaire (GitHub Actions `schedule` + `workflow_dispatch` pour un déclenchement manuel de test). Justification : les données produits cosmétiques évoluent lentement ; un rythme hebdomadaire suffit et limite l'exposition aux incidents de dump côté OBF déjà documentés.

## Conformité licence (approche MVP)

- Attribution visible sur les écrans affichant un produit `source = CATALOG_SEED` (ex: "Data from Open Beauty Facts, ODbL").
- Traçabilité conservée via `barcode` + `source` sur chaque `Product` importé.
- Pas de blocage du chantier sur une validation juridique formelle complète — traité comme une dette documentée, à faire valider formellement plus tard si le volume de données redistribuées devient significatif.

## Hors périmètre de ce chantier

- Matching fin du texte `ingredients_text` brut vers des `CanonicalIngredient` normalisés (reste un chantier séparé)
- Réhébergement des images produit sur Cloudflare R2 (licence CC BY-SA à traiter séparément, filtrage par champ de licence avant tout réhébergement)
- Validation juridique formelle de la conformité ODbL/DBCL
- Modération/fusion des produits `USER_MANUAL`/`USER_OCR` avec les entrées `CATALOG_SEED` (dédoublonnage inter-source)

## Risques / points d'attention

- **Fiabilité du dump OBF** : incidents documentés et non expliqués par l'équipe OBF (voir section recherche). Le garde-fou de l'étape 7 est la principale mitigation ; en cas d'échec de la vérification, ne rien upserter plutôt que de corrompre le catalogue avec un import partiel.
- **Complétude marques prestige** : reste à vérifier empiriquement au premier run réel — non tranchable avant d'avoir des chiffres concrets.
- **Dépendance de séquencement** : ce chantier ne peut pas être implémenté avant (ou en même temps s'il inclut lui-même ces champs) l'ajout des champs de schéma de la spec Dossier.

## Suite

Passage à `writing-plans` pour transformer ce design en plan d'implémentation détaillé, avant exécution (probablement via l'agent `skinaudit-fullstack`), en tenant compte de la dépendance de séquencement avec les champs de schéma Dossier.
