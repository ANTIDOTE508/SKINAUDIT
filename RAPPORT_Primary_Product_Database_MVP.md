# Rapport — Primary Product Database (scope MVP uniquement)

Source : `SKINAUDIT_MEMO_IngredientDatabases.7.8.26.pdf`, section "Primary Product Database" + sections liées pertinentes au MVP.

Exclu volontairement de ce rapport (hors scope MVP selon le memo) :
- **Scientific Layer** (PubChem, CIR) — explicitement reporté à plus tard
- **Competitive Research** (SkinSort, Skincarisma, Think Dirty) — cité comme repoussoir ("ne pas reproduire"), pas comme objectif produit MVP

---

## 1. Objectif MVP

Ne pas reconstruire un catalogue produit cosmétique from scratch. Source retenue en priorité : **Open Beauty Facts (OBF)**, licence **ODbL**.

Usages MVP listés dans le memo :
- reconnaissance de produit (matching image/texte → fiche produit)
- lookup par code-barres (EAN/UPC)
- noms de produit et alias
- informations de marque
- catégories de produits
- listes d'ingrédients INCI (texte brut)
- images produit (sous réserve de licence)

## 2. Source liée au MVP : EU CosIng

Positionnée comme référentiel *ingrédient* faisant autorité (noms INCI officiels, fonctions, statut réglementaire), en complément d'OBF. Nécessaire dès le MVP pour transformer le texte INCI brut d'OBF en ingrédients normalisés et exploitables.

## 3. Modèle de données proposé (MVP uniquement)

**Reference layer** (sync OBF/CosIng, lecture) :
- `Product` — miroir local OBF (barcode, nom, marque, catégorie, image, texte INCI brut, métadonnées de sync/licence)
- `Brand`
- `Ingredient` — ancré CosIng (nom INCI, fonctions, statut réglementaire UE) — champ `pubchemCid` **non inclus**, car Scientific Layer hors scope
- `ProductIngredient` — jointure texte brut → ingrédient normalisé, avec score de matching

**Intelligence layer minimal** (propriétaire, nécessaire pour les écrans front demandés) :
- `UserProductObservation` — historique produits scannés par utilisateur
- `RoutineProduct` — composition de routine

Retiré de la proposition initiale car relevant du Long-Term Direction / Scientific Layer, non du MVP :
- `IngredientMechanism`
- `IngredientSkinConcernLink`

Toutes les entités respectent les règles du projet : `@map("snake_case")` sur chaque champ camelCase, `userId` → `@map("user_id")`. Aucune migration Prisma n'a été exécutée — schéma conceptuel uniquement, à traduire en SQL brut manuellement, suivi de `pnpm db:generate` + `rm -rf .next`.

Recommandation d'intégration : **sync périodique local dans Neon**, pas de query API OBF en runtime (latence OCR, conformité ODbL traçable, pas de dépendance runtime à un service tiers sans SLA).

## 4. Cas d'usage front débloqués (MVP)

- Scan produit (OCR + code-barres) → lookup instantané local
- Écran "Analyse d'ingrédients" avec noms INCI normalisés (via CosIng) au lieu du texte brut d'étiquette
- Historique produits scannés par utilisateur
- Constructeur de routine à partir du catalogue produit

## 5. Points d'attention (MVP)

- **Complétude marques prestige** sur OBF incertaine — à vérifier, cœur de cible SKINAUDIT.
- **Bruit du texte INCI brut** → pipeline de normalisation nécessaire (fuzzy matching + score de confiance), avec réconciliation manuelle des cas ambigus.
- **Licence ODbL** : obligations de partage/attribution à valider avant stockage massif ; images filtrées par licence avant réhébergement Cloudflare R2.
- **Volumétrie vs Neon free tier (0.5GB)** : sync complet OBF hors de portée → modèle hybride recommandé (cache à la demande sur produits scannés, filtrage par catégorie skincare/marques pertinentes).
- **Dépendance à un tiers sans SLA** : le sync local mitige le risque runtime mais déplace la charge vers la fiabilité du job de sync (monitoring à prévoir).

## 6. Ce qui reste à faire hors de ce rapport

Le memo demande un mémo de recommandation formel à la fondatrice (choix final des bases, validation licence, analyse concurrentielle) avant toute implémentation. Ce rapport couvre uniquement la partie architecture/modélisation MVP ; la réponse formelle à la fondatrice reste à rédiger séparément si demandé.

Aucun code écrit, aucune migration lancée, aucun fichier du repo modifié au-delà de ce rapport.
