# SkinAudit — Plan de Développement

> **Projet** : Antidote SkinAudit App  
> **Client** : The Antidote Agency — Mme Christian-Danielle Anderson  
> **Version BRD** : 2 (10 mai 2026)  
> **Document mis à jour le** : 26 mai 2026

---

## Vue d'ensemble du produit

SkinAudit est une **plateforme d'intelligence cutanée personnelle** qui aide les utilisateurs à comprendre, évaluer et améliorer la façon dont leurs produits de soin fonctionnent ensemble au sein d'un régime complet.

Ce n'est **pas** une appli de recommandation de produits. C'est un **conseiller analytique neutre** : il analyse ce que l'utilisateur possède déjà et lui explique comment l'optimiser.

### Boucle utilisateur centrale
```
Ajouter au Dossier → Construire le Régime → Évaluer dans le Formulation Studio
→ Ajuster → Réévaluer → Améliorer
```

> **Changement v2 :** Le Formulation Studio est maintenant l'espace de travail central unifié. Build + Assess + Adjust + Reassess se font tous au sein du Studio en boucle continue — ce n'est plus une étape séparée après l'évaluation.

### Stack technique retenue (par le BRD)
| Couche | Technologie |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS |
| Animations | Framer Motion / GSAP |
| Backend ORM | Prisma |
| Base de données | PostgreSQL (hébergée sur Neon) |
| Auth | Better Auth |
| AI / NLP matching | OpenAI SDK |
| OCR (MVP — v2) | Google ML Kit |
| Billing | Stripe |
| Déploiement | Vercel |
| Repository | GitHub (org propriétaire) |

---

## Architecture modulaire — 8 services backend (v2)

| Service | Responsabilité |
|---|---|
| **User Service** | Auth, profil, contexte peau |
| **Product & Ingredient Service** | BDD produits, mapping ingrédients, marques |
| **Regimen Service** | Skincare Dossier, Ritual Builder, assignations |
| **Assessment Engine** | Règles, scoring RHI, findings |
| **Formulation Studio Engine** | Recalcul temps-réel, boucle Build/Assess/Adjust/Reassess |
| **Compatibility Simulation Service** | Couche simulation temporaire non-destructive (nouveau v2 — MVP) |
| **Environmental Context Service** | Données climat, saison, triggers (renommé de "Environmental Service") |
| **Behavioral Intelligence Service** | Tracking événements, dashboards, agrégation (renommé de "Analytics Service") |

---

## Modèle de données — Entités principales

```
users → user_profiles → user_environment_context
                     → user_devices (Skin Tools & Treatments)
                     → user_dossier_products → products → product_versions
                                                        → product_version_ingredients
                                                        → canonical_ingredients
                     → user_regimens → ritual_items
                     → regimen_assessments → findings
                     → compatibility_simulations   ← nouveau v2
                     → formulation_studio_events
                     → analytics_events
brands → brand_aliases
products → product_aliases → product_metadata   ← nouveau v2
canonical_ingredients → ingredient_aliases
environmental_triggers
tier_metadata          ← nouveau v2
confidence_objects     ← nouveau v2
```

---

## Modèle de monétisation

| Tier | Produits | Régimes | Prix |
|---|---|---|---|
| **Free** | max 10 | 1 AM + 1 PM | Gratuit |
| **Premium** | max 50 | Multiples + nommage custom | 8–15 €/mois |

**États d'abonnement (v2) :** `free` / `premium_active` / `premium_grace` / `premium_expired` / `enterprise`

Revenus futurs : B2B data intelligence (L'Oréal, Estée Lauder, labs), Premium Skin Reports (one-shot), High-Tier (20–30 €/mois).

---

---

# PLAN DE DÉVELOPPEMENT PAR GRANDES CATÉGORIES

---

## Légende des badges

| Badge | Signification |
|---|---|
| `[MVP]` | Requis pour le lancement — Free Tier inclus (BRD section 10.2) |
| `[PREMIUM]` | Feature payante — nécessite abonnement 8-15€/mois (BRD section 10.3) |
| `[POST-MVP]` | Après le lancement, itération suivante |
| `[FUTUR]` | Phase 3 — Intelligence long-terme |

---

## CATÉGORIE 1 — Fondations & Infrastructure `[MVP]`

> **Priorité : Absolue — Doit être fait en premier**

### 1.1 Setup du projet (Monorepo)
- Initialiser le monorepo Next.js + TypeScript
- Configurer Tailwind CSS, ESLint, Prettier
- Setup Framer Motion / GSAP
- Configurer les variables d'environnement (Vercel + local)

### 1.2 Base de données & ORM
- Créer le projet Neon (PostgreSQL cloud)
- Configurer Prisma avec connexion Neon
- Écrire le **schéma Prisma complet** couvrant toutes les entités :
  - `users`, `user_profiles`
  - `user_environment_context`, `environmental_triggers`
  - `user_devices`
  - `brands`, `brand_aliases`
  - `products`, `product_aliases`, `product_versions`, `product_version_ingredients`
  - `canonical_ingredients`, `ingredient_aliases`
  - `user_dossier_products`
  - `user_regimens`, `ritual_items`
  - `regimen_assessments`, `findings`
  - `compatibility_simulations` ← nouveau v2
  - `confidence_objects` ← nouveau v2
  - `formulation_studio_events`
  - `analytics_events`
- Écrire les migrations initiales
- Seeder de base : ingrédients canoniques, marques populaires, produits courants

### 1.3 Authentification
- Intégrer **Better Auth** (TypeScript-first)
- Inscription / connexion par email
- Gestion des sessions
- **Pas de mode guest** — création de compte obligatoire pour persister les données
- Middleware de protection des routes API

### 1.4 Infrastructure de déploiement
- Configurer le repository GitHub (org propriétaire)
- Connecter Vercel au repo GitHub
- CI/CD basique (build + lint + migrations auto sur merge)
- Gestion des secrets (API keys OpenAI, Stripe, Neon)

---

## CATÉGORIE 2 — Data Layer : Produits & Ingrédients `[MVP]`

> **Priorité : Critique — Le cœur analytique ne peut pas fonctionner sans des données structurées**  
> **Principe fondamental du BRD** : *"The value of SkinAudit depends on how well raw data is understood — not just stored."*

---

### Pourquoi cette catégorie existe

#### Le problème central

L'application reçoit des données brutes du monde réel : noms de produits mal orthographiés, listes d'ingrédients dans des formats différents, noms de marques en variantes multiples. Le moteur d'analyse ne peut pas travailler sur ces données chaotiques directement.

**Sans Data Layer :**
```
Input utilisateur : "La Roche-Posay Effaclar Duo+"
→ App ne sait pas ce que c'est
→ Ingrédients inconnus
→ Moteur d'analyse aveugle
→ Résultat : score vide, aucun finding, aucune valeur
```

**Avec Data Layer :**
```
Input utilisateur : "La Roche-Posay Effaclar Duo+"
→ Product Mapping → product_id canonique (version 2023)
→ Ingredient Mapping → BHA (salicylic acid 0.4%), niacinamide, lipohydroxy acid...
→ Moteur d'analyse → détecte conflit BHA + rétinol dans le rituel
→ Résultat : score précis, finding actionnable, recommandation personnalisée
```

Le Data Layer est la couche de traduction entre le monde réel (bruité) et le moteur analytique (précis). Sans lui, **l'app ne fonctionne pas** — elle peut stocker des produits mais ne peut rien en faire.

#### Pourquoi 3 couches distinctes

**1. Ingredient Mapping — la plus critique**
Les règles d'analyse s'appliquent sur les ingrédients canoniques, pas sur les noms bruts. Si on ne sait pas que "salicylic acid" = "acide salicylique" = "BHA", on ne peut pas détecter un conflit BHA + rétinol. Toute la logique métier repose sur cette couche.

**2. Product Mapping — normalise le chaos**
Un même produit existe sous des centaines de variantes de nom dans les bases utilisateurs. Sans normalisation, on crée des doublons, on perd les versions, on calcule des scores pour des entités fantômes.

**3. Brand Mapping — cohérence + valeur B2B**
Nécessaire pour les analyses par marque (futures), pour la couche analytics B2B prévue dans le BRD, et pour éviter que "La Roche-Posay", "La Roche Posay", "LRP" créent trois entités distinctes en base.

#### Ce qui se passe si on saute cette catégorie

| Symptôme | Cause directe |
|---|---|
| Score toujours identique quel que soit le rituel | Moteur reçoit des ingrédients `null` |
| Findings toujours vides | Aucune règle ne peut matcher sur données brutes |
| Doublons massifs en base | Pas de normalisation produit/marque |
| Analytics inutilisables | Entités incohérentes = agrégations faussées |
| Perte de confiance utilisateur | L'app semble "ne rien faire" |

> **Citation BRD** : *"Without this, your app doesn't work."*

---

### Quand intervient-elle dans le parcours utilisateur

#### Rappel : qu'est-ce qu'un BRD

Un **BRD (Business Requirements Document)** — ou *cahier des charges métier* — décrit **ce que le produit doit faire** du point de vue business, sans prescrire comment le coder. Il liste les fonctionnalités, les règles métier, les contraintes, et les attentes utilisateur. C'est le document de référence entre les parties prenantes (fondateur, designer, dev) avant de commencer le développement. Ce que nous avons analysé ("ANTIDOTE SKINAUDIT APP_VERSION1.pdf") est le BRD de SkinAudit.

#### Flux annoté — où le Data Layer intervient

```
ÉTAPE 1 — Création de compte
  Utilisateur → s'inscrit (email, skin type, concerns)
  → Data Layer : ✗ pas encore nécessaire
  → Tables impliquées : users, skin_profiles

ÉTAPE 2 — Ajout de produits au Dossier
  Utilisateur → tape "Effaclar Duo+ La Roche-Posay"
  ★ DATA LAYER INTERVIENT ICI ★
  → Brand Mapping     : "La Roche-Posay" → brand_id canonique
  → Product Mapping   : "Effaclar Duo+" → product_id (version 2023)
  → Ingredient Lookup : product_version_ingredients → 12 ingrédients canoniques
  → Confidence Score  : mapping_confidence = "high" / "medium" / "low"
  → Tables impliquées : brands, products, product_versions,
                        product_version_ingredients, canonical_ingredients

ÉTAPE 3 — Construction du Ritual Builder
  Utilisateur → assemble ses produits en rituel matin/soir
  → Data Layer : ✓ passif (données déjà chargées à l'étape 2)
  → Lit les ingrédients déjà mappés, ne refait pas le matching

ÉTAPE 4 — Assessment (analyse du rituel)
  ★ POINT CRITIQUE ★
  → Moteur de règles lit canonical_ingredient_id pour chaque produit du rituel
  → Détecte : BHA dans Effaclar + Retinol dans sérum = conflit irritation
  → Calcule : Regimen Health Index (score 0-100) sur données canoniques
  → Génère : findings ("éviter la combinaison BHA + rétinol le soir")
  → Sans Data Layer complet → score = null, findings = []

ÉTAPE 5 — Formulation Studio
  ★ RECALCUL EN TEMPS RÉEL ★
  Utilisateur → retire le sérum rétinol du rituel
  → Partial recalculation : seulement les règles affectées par ce changement
  → Nouveau score affiché instantanément
  → Chaque ajustement utilisateur = 1 requête sur canonical_ingredients
```

#### En résumé

Le Data Layer intervient **massivement à l'étape 2** (ajout de produit), reste en mémoire aux étapes 3-4, et est requis en temps réel à l'étape 5. Il n'y a aucune valeur analytique possible sans lui — c'est pourquoi il est en **Priorité Critique** et doit être buildé avant toute autre fonctionnalité métier.

---

### Vue d'ensemble : les 3 couches de mapping critiques

Le BRD identifie trois niveaux de mapping indispensables, dans cet ordre de priorité :

```
1. Ingredient Mapping  ← le plus important, sans ça l'app ne fonctionne pas
2. Product Mapping     ← normaliser tous les inputs vers un produit canonique
3. Brand Mapping       ← normaliser toutes les variantes de nom de marque
```

---

### Comment alimenter la base interne — Stratégie d'alimentation

#### Ce que dit le BRD (et ce qu'il ne dit pas)

Le BRD (section 6.10) pose deux principes clés :
- **"Accuracy Over Completeness"** : mieux vaut peu de produits vérifiés que beaucoup de produits douteux
- **"Progressive Data Improvement"** : la base s'améliore au fur et à mesure que les utilisateurs ajoutent des produits

Le BRD décrit le *quoi* (canonical product record, ingredient mapping, confidence levels) mais **ne prescrit pas de source externe**. C'est un angle mort du document que nous comblons ici.

---

#### Source 1 — Open Beauty Facts (source principale MVP)

**Ce que c'est** : base open source communautaire, ~1 million de produits cosmétiques dans le monde, ingrédients INCI structurés, API REST gratuite et sans authentification.

```bash
# Exemple d'appel API
GET https://world.openbeautyfacts.org/api/v2/search?
  search_terms=effaclar+duo&
  categories_tags=skincare&
  fields=product_name,brands,ingredients_text,ingredients
```

```json
// Réponse
{
  "product_name": "Effaclar Duo+",
  "brands": "La Roche-Posay",
  "ingredients": [
    { "id": "niacinamide", "text": "Niacinamide", "percent_estimate": 5 },
    { "id": "salicylic-acid", "text": "Salicylic Acid", "percent_estimate": 0.4 }
  ]
}
```

**Stratégie d'import** : script Node.js qui importe les produits cosmétiques populaires → nettoyage → insertion en base avec `mapping_confidence = 'medium'`. Un admin peut upgrader en `high` après vérification manuelle.

| Avantages | Inconvénients |
|---|---|
| Gratuit, immédiat | Qualité variable (données contributives) |
| ~1M produits couverts | Manque les produits de niche |
| INCI souvent déjà parsés | Formulations pas toujours à jour |
| Mise à jour continue | Nécessite un nettoyage post-import |

---

#### Source 2 — Seed manuel curé (indispensable pour le lancement)

Pour les ~300-500 produits que 80% des premiers utilisateurs vont saisir, on constitue une base interne vérifiée manuellement depuis les **sites officiels des marques** (page produit → liste INCI officielle).

**Marques cibles MVP** (ordre de priorité) :
```
The Ordinary        → ~30 produits populaires
CeraVe              → ~20 produits
La Roche-Posay      → ~25 produits
Paula's Choice      → ~20 produits
Drunk Elephant      → ~15 produits
Neutrogena          → ~15 produits
Cetaphil            → ~10 produits
Vichy               → ~15 produits
Avène               → ~15 produits
Bioderma            → ~15 produits
```

Ces produits sont insérés avec `mapping_confidence = 'high'`. C'est du **travail éditorial**, pas du code. Estimé à 2-4 semaines de saisie selon la ressource disponible.

---

#### Source 3 — Contribution utilisateur (croissance organique)

Quand un utilisateur saisit un produit inconnu et colle sa liste INCI manuellement (méthode fallback du BRD section 6.1) :

```
Utilisateur saisit "Sérum Vitamine C XYZ Brand"
→ Produit non trouvé en base
→ Formulaire : "Colle ta liste d'ingrédients (dos du flacon ou site officiel)"
→ Produit créé avec mapping_confidence = 'low' + flag pending_review = true
→ Admin valide et corrige → mapping_confidence upgradé en 'high'
→ Tous les utilisateurs ayant ce produit bénéficient de l'upgrade automatiquement
```

C'est le modèle **"la base grandit avec la communauté"** — chaque nouveau produit saisi améliore l'expérience pour tous les utilisateurs suivants.

---

#### Source 4 — Parsing INCI par IA `[MVP]` (complément technique)

Pour les produits trouvés via Open Beauty Facts mais dont la liste INCI est en texte brut non structuré, on utilise OpenAI pour parser et structurer :

```typescript
// Prompt OpenAI
const prompt = `
Parse cette liste INCI cosmétique en JSON structuré.
Retourne uniquement un tableau JSON valide, sans explication.
INCI: "${rawInciText}"
Format: [{ "inci_name": string, "order": number, "category": string }]
`
```

**Le BRD autorise explicitement cet usage** (section 6.9 : *"AI is used for: ingredient parsing"*).

**Le BRD interdit explicitement** (section 6.9 : *"AI is NOT used for: generating ingredient lists, inventing product data"*) — si l'INCI brut n'est pas disponible, on n'hallucine pas : le produit reste en `confidence = low` jusqu'à saisie manuelle.

---

#### Architecture d'alimentation complète

```
PHASE 1 — Seed initial (AVANT lancement, ~4-6 semaines)
  ├── Import Open Beauty Facts → ~5000 produits cosmétiques populaires
  │     confidence = medium, pending_review = true
  ├── Curation manuelle top 300-500 produits depuis sites officiels
  │     confidence = high, pending_review = false
  └── Table canonical_ingredients seedée manuellement
        ~200 INCI clés (retinol, niacinamide, AHA, BHA, céramides, etc.)

PHASE 2 — Croissance organique (APRÈS lancement)
  ├── Saisie utilisateur → produit inconnu → pending_review
  ├── Admin valide → confidence upgrade → tous les users bénéficient
  └── AI parse l'INCI brut si disponible → structured ingredients

PHASE 3 — Automatisation avancée (FUTURE)
  ├── Barcode scanning → lookup via Open Food Facts / EAN database
  └── OCR label (Google ML Kit) → extraction INCI depuis photo
        (mentionné explicitement dans BRD section 6.1 comme "Future / Not MVP")
```

#### Règle BRD à respecter absolument

> **"Never block user progress"** (BRD section 6.8)

Si un produit n'est pas trouvé et que l'utilisateur ne veut pas saisir l'INCI :
- Le produit est ajouté en base avec `confidence = low`
- Il est **exclu des analyses d'ingrédients** mais inclus dans la construction du rituel
- L'interface affiche : *"Some products in your regimen could not be fully verified. Analysis accuracy may be limited."*
- L'utilisateur n'est jamais bloqué

---

### 2.1 Schéma de base de données — Tables du Data Layer

Le BRD fournit les schémas SQL exacts. Voici les tables à implémenter :

#### `brands` — Marques canoniques
```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY,
  canonical_name TEXT UNIQUE NOT NULL,
  parent_company TEXT,
  brand_tier TEXT,        -- mass, masstige, premium, ultra_luxury, professional
  brand_positioning TEXT, -- derm, clinical, luxury, natural, prestige
  country_origin TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `brand_aliases` — Variantes de noms de marque
```sql
CREATE TABLE brand_aliases (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  alias_name TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```
> Exemple : "LaMer", "LA MER", "la mer" → tous mappés vers `La Mer`

#### `products` — Produits canoniques
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  canonical_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  product_category TEXT NOT NULL,   -- cleansing, preparation, treatment, support, protection (taxonomie v2)
  product_subcategory TEXT,
  product_tier TEXT,
  price_band TEXT,
  leave_on BOOLEAN,
  wash_off BOOLEAN,
  contains_spf BOOLEAN DEFAULT FALSE,
  spf_value INT,
  verified_status TEXT DEFAULT 'unverified',
  data_confidence TEXT DEFAULT 'low',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `product_aliases` — Variantes de noms de produits
```sql
CREATE TABLE product_aliases (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  alias_name TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  alias_type TEXT, -- user_input, abbreviation, regional_name, old_name
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `product_versions` — Versions régionales et reformulations
```sql
CREATE TABLE product_versions (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  version_name TEXT,
  region_code TEXT,
  market TEXT,
  reformulation_date DATE,
  full_inci_raw TEXT,
  full_inci_normalized TEXT,
  ingredient_data_confidence TEXT,
  source_type TEXT, -- brand_site, retailer, user_scan, licensed_db, manual_review
  source_url TEXT,
  active_version BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `canonical_ingredients` — Ingrédients normalisés
```sql
CREATE TABLE canonical_ingredients (
  id UUID PRIMARY KEY,
  inci_name TEXT UNIQUE NOT NULL,
  common_name TEXT,
  ingredient_family TEXT,    -- retinoid, aha, bha, humectant, ceramide
  function_category TEXT,    -- exfoliant, antioxidant, hydrator, barrier_support
  active_flag BOOLEAN,
  irritation_potential INT,      -- score 0-10
  barrier_support_score INT,     -- score 0-10
  microbiome_relevance_score INT,
  evidence_confidence TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `ingredient_aliases` — Synonymes et variantes d'ingrédients
```sql
CREATE TABLE ingredient_aliases (
  id UUID PRIMARY KEY,
  canonical_ingredient_id UUID REFERENCES canonical_ingredients(id),
  alias_name TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  alias_type TEXT, -- synonym, spelling_variant, trade_name
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `product_version_ingredients` — Lien entre versions de produits et ingrédients canoniques
```sql
CREATE TABLE product_version_ingredients (
  id UUID PRIMARY KEY,
  product_version_id UUID REFERENCES product_versions(id),
  canonical_ingredient_id UUID REFERENCES canonical_ingredients(id),
  ingredient_order INT,
  concentration_min NUMERIC,
  concentration_max NUMERIC,
  concentration_confidence TEXT,
  mapping_confidence TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `compatibility_simulations` — Simulations de compatibilité (nouveau v2)
```sql
CREATE TABLE compatibility_simulations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  regimen_id UUID REFERENCES user_regimens(id),
  simulation_state JSONB NOT NULL,   -- état du régime simulé
  simulated_rhi NUMERIC,
  simulated_findings JSONB,
  change_type TEXT,                  -- add_product, remove_product, move_slot, change_frequency
  status TEXT DEFAULT 'pending',     -- pending, applied, discarded
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `confidence_objects` — Objets de confiance propagée (nouveau v2)
```sql
CREATE TABLE confidence_objects (
  id UUID PRIMARY KEY,
  entity_type TEXT NOT NULL,         -- product, ingredient, assessment, scoring
  entity_id UUID NOT NULL,
  confidence_level TEXT NOT NULL,    -- high, medium, low
  confidence_source TEXT,            -- exact_match, fuzzy_match, ocr, manual
  propagated_from UUID,              -- FK vers confidence_objects parent
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 2.2 Seed initial — Données de démarrage

#### 2.2.1 Ingrédients canoniques prioritaires (MVP)

Le seed doit couvrir en priorité les ingrédients les plus fréquemment présents dans les routines :

| Famille | Ingrédients clés |
|---|---|
| **Retinoids** | Retinol, Retinal, Tretinoin, Retinyl Palmitate, Hydroxypinacolone Retinoate |
| **AHA (acides alpha-hydroxylés)** | Glycolic Acid, Lactic Acid, Mandelic Acid, Tartaric Acid |
| **BHA** | Salicylic Acid, Beta-Hydroxybutyric Acid |
| **PHA** | Gluconolactone, Lactobionic Acid |
| **Humectants** | Hyaluronic Acid, Sodium Hyaluronate, Glycerin, Panthenol, Urea |
| **Actifs brightening** | Niacinamide, Vitamin C (L-Ascorbic Acid), Alpha-Arbutin, Kojic Acid, Tranexamic Acid |
| **Barrière & Ceramides** | Ceramide NP, Ceramide AP, Ceramide EOP, Cholesterol, Fatty Acids |
| **Antioxydants** | Vitamin E (Tocopherol), Resveratrol, Ferulic Acid, Coenzyme Q10 |
| **SPF / UV filters** | Zinc Oxide, Titanium Dioxide, Avobenzone, Octinoxate, Tinosorb |
| **Occlusifs** | Petrolatum, Dimethicone, Squalane, Lanolin |
| **Peptides** | Matrixyl (Palmitoyl Pentapeptide-4), Argireline, Copper Peptides |

Pour chaque ingrédient : `inci_name`, `common_name`, `ingredient_family`, `function_category`, `active_flag`, `irritation_potential`, `barrier_support_score`, `evidence_confidence`.

#### 2.2.2 Marques prioritaires (MVP)

Couvrir les marques les plus utilisées dans les routines grand public et premium :

**Mass / Masstige** : CeraVe, La Roche-Posay, Neutrogena, Vichy, Avène, Eucerin, Bioderma, Garnier, L'Oréal Paris, Cetaphil

**Premium** : Paula's Choice, The Ordinary, COSRX, Drunk Elephant, Tatcha, Sunday Riley, The Inkey List, Farmacy, First Aid Beauty, Glow Recipe

**Luxury / Ultra-luxury** : La Mer, SK-II, Sisley, Chanel, Dior (skincare), Augustinus Bader, Barbara Sturm

#### 2.2.3 Produits prioritaires (MVP seed ~300-500 produits)

Cibler les produits les plus fréquemment mentionnés / utilisés :
- 1-2 produits phares par marque couverte
- Priorité aux catégories les plus communes : cleanser, serum actifs, moisturizer, SPF
- Inclure les produits emblématiques (The Ordinary Niacinamide 10% + Zinc 1%, CeraVe Moisturizing Cream, Paula's Choice BHA, etc.)

---

### 2.3 Système de matching produits — Pipeline complet

Le BRD définit un pipeline en 4 niveaux, du plus précis au plus permissif :

#### Niveau 1 — Search-Based (primaire)
```
Input utilisateur → normalisation (lowercase, suppression noise words)
→ recherche exacte dans product_aliases.normalized_alias
→ si match : confidence = high
```

#### Niveau 2 — Fuzzy Matching (AI-assisté, OpenAI SDK)
```
Input utilisateur → OpenAI SDK
→ correction de fautes de frappe
→ normalisation de marque ("ordinary" → "The Ordinary")
→ détection de synonymes
→ suggestion de match canonique + confidence = medium
```

Flow complet tel que défini dans le BRD :
```
User Input
→ OpenAI SDK traite le texte
→ suggestion de produit normalisé
→ match contre produit canonique
→ confidence level assigné
→ présenté à l'utilisateur pour confirmation
```

**Exemple :**
- Input : `"ordinary niacinamide zinc"`
- Output : `The Ordinary Niacinamide 10% + Zinc 1%` — confidence: `high`

#### Niveau 3 — Inférence de catégorie (AI)
Quand le produit n'est pas trouvé mais que l'utilisateur décrit ce qu'il utilise :
- AI infère la catégorie (`cleanser`, `serum`, `moisturizer`, `SPF`, `exfoliant`, `mask`)
- Particulièrement utile pour les produits ajoutés manuellement
- Résultat : produit manuel avec `data_confidence = low` + catégorie inférée

#### Niveau 4 — Entrée manuelle (fallback absolu)
- Toujours disponible, jamais bloquant
- L'utilisateur entre le nom manuellement
- Option : coller la liste d'ingrédients depuis le site de la marque
- Assignation automatique : `data_confidence = low`, `verified_status = unverified`
- Le produit reste utilisable pour la construction du régime

**Règle absolue du BRD** : *"Never block user progress. Manual entry must always be available."*

#### Logging de la résolution
Chaque résolution est tracée dans `user_dossier_products` :
```
input_type       : search | manual | ocr (futur)
resolution_type  : exact | fuzzy | alias | manual
confidence_level : high | medium | low
```

---

### 2.4 Système de confiance des données (Data Confidence Framework)

Le BRD exige que **chaque produit et chaque mapping d'ingrédient** porte un niveau de confiance explicite.

| Niveau | Signification | Conditions |
|---|---|---|
| **High** | Produit vérifié + liste d'ingrédients vérifiée | Match exact + source fiable (brand site / licensed DB) |
| **Medium** | Match probable + données partielles | Fuzzy match + ingrédients partiellement vérifiés |
| **Low** | Entrée manuelle ou données manquantes | Input utilisateur non matchable + pas de liste d'ingrédients |

#### Impact sur l'analyse
- Si un produit est `low confidence` → le moteur d'assessment peut exclure ce produit de l'analyse avancée d'ingrédients (mais il reste dans le régime)
- Message utilisateur si confidence globale faible :  
  *"Some products in your regimen could not be fully verified. Analysis accuracy may be limited."*
- Si confidence est low pour plusieurs produits :  
  *"This analysis includes one or more products that could not be fully verified, which may affect precision."*

#### Niveau de confiance de l'évaluation globale
La confiance de chaque Assessment est calculée à partir de la confiance agrégée des produits du régime.

---

### 2.5 Normalisation & Mapping des marques

#### Processus de normalisation
1. Convertir en minuscules : `"LA MER"` → `"la mer"`
2. Supprimer la ponctuation / espaces parasites
3. Comparer contre `brand_aliases.normalized_alias`
4. Retourner `brands.canonical_name`

**Exemples de mapping :**
| Input | Canonical |
|---|---|
| "LaMer" | La Mer |
| "LA MER" | La Mer |
| "the ordinary" | The Ordinary |
| "TO" | The Ordinary |
| "paula's choice" | Paula's Choice |
| "paulas choice" | Paula's Choice |

#### Brand Tier (importance analytique)
Le `brand_tier` permet des insights B2B de valeur :
- **mass** : CeraVe, Cetaphil, Neutrogena
- **masstige** : La Roche-Posay, Vichy, The Ordinary
- **premium** : Paula's Choice, Drunk Elephant, COSRX
- **ultra_luxury** : La Mer, SK-II, Augustinus Bader
- **professional** : SkinCeuticals, iS Clinical

---

### 2.6 Parsing des ingrédients (input manuel)

Quand un utilisateur colle une liste d'ingrédients brute depuis un site web :

```
Raw text (ex: "Aqua, Niacinamide, Glycerin, Retinol, Sodium Hyaluronate, ...")
→ OpenAI SDK : nettoyage + tokenisation
→ Matching contre canonical_ingredients.inci_name
→ Matching contre ingredient_aliases.alias_name
→ Chaque ingrédient reçoit un confidence level individuel
→ Résultat stocké dans product_version_ingredients
```

**Ce que le système comprend de :**
```
Aqua, Niacinamide, Glycerin, Retinol, Sodium Hyaluronate
```

| Ingrédient | Famille | Fonction |
|---|---|---|
| Niacinamide | Active | Brightening / barrier support |
| Glycerin | Humectant | Hydration |
| Retinol | Retinoid | Cell turnover |
| Sodium Hyaluronate | Humectant | Hydration |

**Pourquoi c'est critique** : sans ce mapping, il est impossible de détecter les conflits, les surexpositions aux actifs et les risques barrière.

---

### 2.7 Comportement quand le produit est introuvable

Défini explicitement dans le BRD (section 6.8) :

```
Produit non trouvé dans la base
→ Permettre l'ajout manuel
→ Assigner confidence = low
→ Exclure de l'analyse avancée d'ingrédients si nécessaire
→ Permettre quand même la construction du régime
→ JAMAIS bloquer la progression de l'utilisateur
```

---

### 2.8 Interface d'administration (Admin Data Curation)

Le BRD spécifie un **workflow de review humain** pour les outputs incertains de l'AI (section 15.8) :

#### Queue de review — Contient :
- Produits non matchés (aucun résultat trouvé)
- Entrées dupliquées détectées
- Listes d'ingrédients ambiguës
- Assignations de catégorie incertaines

#### Capacités admin :
| Action | Description |
|---|---|
| Approuver un match | Valider la suggestion AI |
| Fusionner des doublons | Merge de deux entrées produits |
| Éditer les métadonnées | Corriger catégorie, nom, brand |
| Mettre à jour le mapping d'ingrédients | Corriger les associations ingrédients |
| Ajuster le confidence level | Monter / descendre la confiance |

**Contrainte importante** : L'AI ne doit **jamais** écrire directement en base des enregistrements canoniques sans validation humaine ou validation par règles.

---

### 2.9 Rôle de l'AI dans le Data Layer — Périmètre exact

Le BRD définit très précisément ce que l'AI fait et ne fait pas :

#### L'AI est utilisée pour :
- Matching de noms de produits (fuzzy, NLP)
- Correction de fautes de frappe
- Normalisation de marques
- Parsing et nettoyage de listes d'ingrédients
- Inférence de catégorie produit
- Support à la curation admin

#### L'AI n'est PAS utilisée pour :
- Générer des listes d'ingrédients de toutes pièces
- Inventer des données produits
- Fournir des conseils médicaux
- Déterminer le Regimen Health Index
- Remplacer la logique déterministe du moteur de règles
- Présenter des données non vérifiées comme des faits

**Positionnement système :**
```
AI            = assistant d'input
Database      = source de vérité
Rule Engine   = logique de décision
Tone Layer    = communication utilisateur
```

---

### 2.10 Stratégie de croissance du Data Layer

#### Principe : Progressive Data Improvement
- Le système s'améliore au fur et à mesure que des produits sont ajoutés
- Les mappings deviennent plus précis avec le temps
- Chaque produit non trouvé alimente la queue de curation admin

#### Sources de données envisagées
| Source | Confidence | Notes |
|---|---|---|
| Site officiel de la marque | High | Source primaire idéale |
| Base de données licensée | High | Open Beauty Facts, EWG, INCIDecoder |
| Retailer (INCI liste produit) | Medium | Variable selon le retailer |
| Scan utilisateur OCR | Low→Medium | Phase 2, nettoyage AI requis |
| Entrée manuelle utilisateur | Low | Toujours acceptée |

#### OCR Scanning `[MVP]` (Google ML Kit) — v2

> **Changement v2 :** L'OCR est maintenant **MVP Phase 1**. Il était marqué "Future/FUTUR" dans le BRD v1.

```
Utilisateur scanne l'étiquette du produit
→ Google ML Kit extrait le texte
→ OpenAI nettoie le texte
→ Ingredient parser structure les données
→ Mapping vers canonical_ingredients
→ Confidence assigné (medium→high selon qualité scan)
```

---

### 2.11 Principes de conception du Data Layer (BRD 14B.17)

1. **Normalize core data** — Produits, marques et ingrédients doivent être canoniques
2. **Preserve user flexibility** — L'utilisateur peut toujours ajouter un produit même si les données sont incomplètes
3. **Store confidence levels** — Tout mapping incertain doit porter un score de confiance
4. **Track behavior over time** — Capturer non seulement ce que l'utilisateur a, mais aussi ce qu'il change
5. **Build for analytics from day one** — Les analytics ne sont pas un afterthought

---

### 2.12 Ordre de build recommandé pour le Data Layer

```
Étape 1 : Schéma Prisma — toutes les tables du Data Layer
          (incl. compatibility_simulations, confidence_objects — nouvelles v2)
Étape 2 : Seed ingrédients canoniques (~100-200 ingrédients prioritaires)
Étape 3 : Seed marques (~50-100 marques avec aliases)
Étape 4 : Seed produits (~300-500 produits avec product_versions + ingredient mappings)
          (utiliser taxonomie v2 : cleansing / preparation / treatment / support / protection)
Étape 5 : API de recherche produit (search-based)
Étape 6 : Intégration OpenAI SDK pour fuzzy matching + ingredient parsing
Étape 7 : Pipeline OCR (Google ML Kit) — MVP v2
Étape 8 : Pipeline de confidence scoring + propagation chain
Étape 9 : Interface admin de curation (minimale pour MVP)
```

> **Avertissement MVP** : Ne pas attendre d'avoir une base de données parfaite pour lancer. Commencer avec les produits les plus populaires, laisser le système s'enrichir via les entrées utilisateurs et la queue de curation admin.

---

## CATÉGORIE 3 — Onboarding & Profil Utilisateur `[MVP]`

> **Priorité : Haute — Premier contact avec l'app**

### 3.1 Landing page (First App Open)
- Message de valeur clair et immédiat :  
  *"Understand how your skincare routine really works — and how to improve it using what you already own."*
- Explication ultra-courte (3 étapes : Add → Build → Get insights)
- CTA unique : **"Start Your Analysis"**
- Ton : professionnel, calme, non-alarmiste

### 3.2 Création de compte
- Formulaire minimaliste (email + password)
- Pas de guest mode
- Redirection directe vers l'onboarding

### 3.3 Onboarding progressif (7 étapes — v2)

> **Changement v2 :** L'onboarding est étendu de 3 à 7 étapes, avec ajout d'une introduction éducative et d'un niveau d'expérience.

**Étape 1 — Création de compte**
- Email + mot de passe

**Étape 2 — Profil**
- Type de peau : dry / oily / combination / normal
- Préoccupations principales (multi-select) : acne, aging, pigmentation, dryness, sensitivity, redness

**Étape 3 — Sensibilité & Objectifs peau**
- Sensibilité : low / medium / high
- Objectifs prioritaires (focus areas)

**Étape 4 — Collecte du Contexte Environnemental**
- Localisation / région (auto-détectée ou manuelle)
- Saison actuelle (auto ou manuelle)
- Climat : dry / humid / temperate

**Étape 5 — Niveau d'expérience régime**
- Débutant / intermédiaire / avancé
- Influence le niveau de détail des explications

**Étape 6 — Introduction éducative**
- Explication du concept Dossier / Ritual / Regimen
- Présentation du Formulation Studio

**Étape 7 — Ingestion des produits**
- Ajout des premiers produits au Dossier
- OCR scan / recherche / saisie manuelle disponibles

**Principes UX** :
- Champs minimum requis
- Enrichissement progressif possible ensuite
- Chaque étape a une valeur claire pour l'utilisateur

---

## CATÉGORIE 4 — Skincare Dossier (Bibliothèque Produits) `[MVP]`

> **Priorité : Haute — Source de toutes les données pour l'analyse**

### 4.1 Interface d'ajout de produits
- Barre de recherche principale avec suggestions en temps réel
- Matching assisté (fuzzy + AI)
- **OCR scan d'étiquette (Google ML Kit)** — `[MVP]` — extrait la liste INCI depuis une photo
- Scan barcode (lookup interne + API externe fallback)
- Fallback manuel toujours disponible
- Catégorisation automatique selon taxonomie v2 (cleansing / preparation / treatment / support / protection)

### 4.2 Gestion du dossier
- Vue liste/grille des produits possédés
- Statuts : `active` / `seasonal` / `archived`
- Limites freemium (10) / premium (50) avec prompt d'upgrade au seuil
- Métadonnées par produit : brand, category, type, ingredient list si disponible

### 4.3 Indicateur de confiance
- Badge de confiance visible pour chaque produit : ✓ Verified / ~ Partial / ? Unverified
- Message contextuel si analyse limitée : *"Some products could not be fully verified. Analysis accuracy may be limited."*

---

## CATÉGORIE 5 — Ritual Builder (Construction du Régime) `[MVP]`

> **Priorité : Haute — Transforme la bibliothèque en régime analysable**

> **Changement v2 :** Le Ritual Builder est intégré **au sein du Formulation Studio** (Catégorie 7). Il n'est plus une étape séparée — la construction et l'évaluation se font dans le même espace.

### 5.1 Construction du régime AM/PM
- Interface drag & drop pour assigner les produits au :
  - **Morning Ritual (AM)**
  - **Evening Ritual (PM)**
- Définition de l'ordre d'application
- Définition de la fréquence par produit : daily / 2-3x/week / weekly / occasional
- L'assessment RHI se met à jour en temps réel pendant la construction

### 5.2 Règle d'or
- Seuls les produits d'usage **régulier** sont inclus dans l'analyse de base
- Les produits "occasional" sont exclus du Regimen Assessment principal

### 5.3 Régimes étendus `[PREMIUM]`
- Multiple rituels nommables
- Override environnemental (ex: voyage, changement de pays)

---

## CATÉGORIE 6 — Regimen Assessment Engine (Moteur d'Analyse) `[MVP]`

> **Priorité : Critique — C'est le cœur du produit**

### 6.1 Inputs du moteur
- Produits du régime AM + PM
- Composition en ingrédients
- Catégories de produits
- Fréquence d'utilisation
- Structure (ordre, layering)
- Contexte utilisateur (type de peau, sensibilité)
- Contexte environnemental (climat, saison)
- Usage d'appareils

### 6.2 Catégories de règles d'analyse

**1. Règles de Conflits d'Ingrédients**
- Combinaisons incompatibles (ex: rétinol + acide exfoliant fort)
- Surcharge d'actifs similaires
- Chevauchement d'actifs

**2. Règles de Redondance**
- Produits à fonctions dupliquées
- Layering inutile
- Ex: 2 sérums niacinamide

**3. Règles de Sur-utilisation**
- Fréquence excessive (ex: exfoliation quotidienne)
- Exposition cumulative trop élevée

**4. Règles d'Étapes Manquantes**
- Absence de SPF en AM
- Manque d'hydratation
- Absence de support barrière

**5. Règles de Séquençage**
- Actifs mal ordonnés
- Occlusifs bloquant l'absorption

**6. Règles Contextuelles**
- Ajustement selon sensibilité (ex: haute sensibilité + rétinol haute fréquence → warning renforcé)
- Ajustement selon climat (ex: climat sec + exfoliation → risque barrière accru)

**7. Règles Interaction Appareils**
- Appareil + ingrédient → risque (ex: microneedling + rétinol → caution)
- Besoins de recovery

### 6.3 Outputs

**Regimen Health Index (RHI) — Score multi-dimensionnel pondéré (v2)**

> **Changement v2 :** Le scoring passe d'un simple base-100 avec déductions à un RHI multi-dimensionnel pondéré sur 6 dimensions.

**6 dimensions pondérées :**

| Dimension | Poids |
|---|---|
| `irritation_risk` | Élevé |
| `barrier_support` | Élevé |
| `regimen_balance` | Modéré |
| `active_overlap` | Modéré |
| `compatibility_quality` | Modéré |
| `contextual_alignment` | Faible-Modéré |

**Formule :**
```
RHI = weighted_subscores + contextual_adjustments - confidence_penalties
```

**Interprétation du score :**

| Score | Label |
|---|---|
| 90–100 | Highly Balanced |
| 75–89 | Generally Balanced |
| 60–74 | Moderate Optimization Opportunity |
| 40–59 | Elevated Concern |
| < 40 | Significant Structural Concern |

**Niveaux de sévérité (v2) :** `informational` / `mild` / `caution` / `high`

> **Changement v2 :** Les niveaux passent de `low / medium / high / critical` (v1) à `informational / mild / caution / high` (v2)

**Structured Findings — 3 éléments (v2)**

> **Changement v2 :** La structure des findings passe de 4 éléments (Title + Explanation + Impact + Recommendation) à 3 (Issue + Explanation + Suggested Adjustment)

```
Issue              : identification du problème
Explanation        : ce qui se passe et pourquoi
Suggested Adjustment : quoi faire concrètement
```

**Positive Reinforcement Outputs (nouveau v2)**
- En plus des warnings, le moteur génère des outputs positifs
- Identifie ce qui fonctionne bien dans le régime
- Identifie les synergies bénéfiques entre ingrédients

**Confidence Layer**
- Niveau de confiance global de l'évaluation affiché à l'utilisateur
- Chaîne : product_confidence → ingredient_confidence → assessment_confidence → scoring_confidence

### 6.4 Principes de conception du moteur
- **Déterministe** : même input → même output (pas d'IA pour le scoring)
- **Explainable** : chaque résultat doit être compréhensible
- **Trust over complexity** : éviter la sur-complexité au démarrage
- **Tone** : professionnel, non-alarmiste, non-judgmental
  - ❌ *"This routine is bad"*
  - ✓ *"This combination may increase irritation risk, particularly with frequent use."*

---

## CATÉGORIE 7 — Formulation Studio (Espace de Travail Central) `[MVP]` — fonctionnalités avancées `[PREMIUM]`

> **Priorité : Haute — Espace central unifié et moteur d'engagement**

> **Changement v2 :** Le Formulation Studio est maintenant l'**espace de travail central** de l'application, pas une étape séparée post-évaluation. Il unifie Build + Assess + Adjust + Reassess en un flux continu.

### 7.1 Espace de travail unifié (v2)

Le Formulation Studio combine en un seul environnement :
- **Ritual Builder** — construction du régime AM/PM (drag & drop)
- **Assessment en temps réel** — le RHI est calculé et affiché à mesure que le rituel est construit
- **Refinement** — ajustement interactif avec recalcul immédiat
- **Compatibility Simulation** — simulation non-destructive de changements (`[MVP]`)

### 7.2 Boucle continue
```
Build → Assess → Adjust → Reassess → Improve
```
Chaque modification déclenche un recalcul partiel immédiat (pas de rebuild complet).

### 7.3 Actions disponibles
- Déplacer un produit entre AM et PM
- Modifier la fréquence d'utilisation
- Retirer / réintroduire un produit
- Réordonner les étapes
- Lancer une simulation de compatibilité

### 7.4 Compatibility Simulation System `[MVP]`

> **Changement v2 :** Était Post-MVP Premium dans la v1. Maintenant **MVP Phase 1**.

Couche temporaire et non-destructive :
- Simulation créée sans modifier le régime réel
- Score simulé affiché côte à côte avec le score réel
- Findings simulés vs findings réels comparés
- La modification n'est persistée que si l'utilisateur confirme

Scénarios :
- "What happens if I add this product?"
- "What happens if I remove this serum?"
- "What happens if I move this to PM?"

### 7.5 Adaptation environnementale
- Le Studio prend en compte le contexte environnemental actuel
- Suggestions d'ajustement lors de changements climatiques/saisonniers

### 7.6 Feature Constraints
- `[MVP]` **Free** : accès au Studio, 1 rituel AM + 1 PM, recalcul temps-réel, simulation basique
- `[PREMIUM]` **Premium** : rituels multiples, simulation avancée, override environnement (voyage)

---

## CATÉGORIE 8 — Contexte Environnemental & Triggers `[MVP]` basique — triggers actifs `[POST-MVP]`

> **Priorité : Moyenne (MVP basique, avancé en Phase 2)**

### 8.1 Détection environnementale
- Auto-détection de la localisation (IP ou GPS)
- Mapping vers `climate_zone` (dry / humid / temperate)
- Calcul de la saison courante
- `humidity_band`, `temperature_band`, `uv_band`

### 8.2 Impact sur l'analyse
- Climat sec → risque sécheresse accru
- Climat humide → production de sébum potentiellement accrue
- UV élevé → importance du SPF renforcée

### 8.3 Environmental Trigger System `[POST-MVP]`
Types de triggers :
1. **Seasonal Transitions** : winter → spring, summer → fall
2. **Short-Term Climate Shifts** : chutes de température, pics d'humidité
3. **Location Changes** `[PREMIUM]` : voyage, déménagement

Comportement :
- **Mode Passif** : mise à jour silencieuse, reflétée à la prochaine évaluation
- **Mode Actif** (recommandé) : notification push → Formulation Studio → suggestions d'ajustements

Flow de l'utilisateur :
```
Changement détecté → Trigger généré → Utilisateur notifié
→ Studio ouvert → Ajustements suggérés → Nouvelle évaluation
```

Ton des notifications : advisory, calme, non-alarmiste.
- ❌ *"Your routine is wrong for this weather"*
- ✓ *"Your current environment may benefit from small adjustments to improve balance and comfort."*

---

## CATÉGORIE 9 — Compatibility Check (Simulation & Pre-Purchase) `[MVP]` basique — avancé `[PREMIUM]`

> **Priorité : Haute pour le basique (MVP) — avancé Post-MVP**

> **Changement v2 :** La Compatibility Simulation basique est **MVP Phase 1**. La version Pre-Purchase avancée reste Post-MVP/Premium.

### 9.1 Compatibility Simulation (MVP — via Formulation Studio)
Intégré au Formulation Studio (voir Catégorie 7). Permet de simuler l'ajout ou le retrait d'un produit sans modifier le régime réel.

### 9.2 Pre-Purchase Compatibility Check `[PREMIUM]` `[POST-MVP]`
L'utilisateur envisage d'acheter un produit et veut savoir s'il est compatible avec son régime actuel.

**Flow :**
1. Recherche du produit envisagé
2. Évaluation de compatibilité avec le régime courant (via Compatibility Simulation Service)
3. Output :
   - Score de compatibilité
   - Conflits potentiels identifiés
   - Placement suggéré (AM ou PM, à quelle étape)

### 9.3 Monétisation
- Version avancée Premium uniquement
- Potentiel de revenu affilié (optionnel, sans biaiser les recommandations)

---

## CATÉGORIE 10 — UX / Interface Utilisateur `[MVP]`

> **Priorité : Continue tout au long du développement**

### 10.1 Philosophie de design

**Ce que l'utilisateur doit ressentir** :
- Rassuré
- Informé
- En contrôle
- Curieux d'explorer davantage

**Ce qu'il ne faut PAS créer** :
- Anxiété
- Confusion
- Culpabilité
- Sentiment d'être submergé

### 10.2 Principes UX
1. **Fast Time-to-Value** : insight en moins de quelques minutes
2. **Progressive Complexity** : simple d'abord, plus profond au fil du temps
3. **Continuous Feedback** : chaque action produit un résultat visible
4. **Low Friction** : minimum d'inputs requis
5. **Safe Exploration** : l'utilisateur peut tester sans conséquences permanentes

### 10.3 Ton des messages

> **Changement v2 :** La structure des findings passe de 4 éléments à 3.

Structure standardisée pour chaque finding (v2) :
```
1. Issue             — identification du problème
2. Explanation       — ce qui se passe et pourquoi
3. Suggested Adjustment — quoi faire concrètement
```

**Positive Reinforcement (nouveau v2) :** En plus des warnings, afficher systématiquement ce qui fonctionne bien dans le régime.

Langage probabiliste obligatoire :
- ❌ *"This will damage your skin"*
- ✓ *"This combination may increase irritation risk, particularly with frequent use"*

### 10.4 Navigation principale (proposition)
```
Dashboard / Home
├── Skincare Dossier
├── Formulation Studio (Ritual Builder + Assessment + Simulation)
├── Profile & Context (peau + environnement + Skin Tools)
└── Settings / Subscription
```

---

## CATÉGORIE 11 — Système de Billing & Abonnements `[MVP]`

> **Priorité : Moyenne — intégrer avant le lancement public**

### 11.1 Intégration Stripe
- Abonnement mensuel (8-15 €)
- Option annuelle (remisée)
- Discount codes / promotions
- Trial logic
- Webhooks pour mise à jour du statut d'abonnement en base

### 11.2 Gestion des limites Freemium
- Compteur de produits dans le Dossier
- Blocage à 10 produits → prompt d'upgrade contextuel
- Blocage à 1 régime → prompt d'upgrade au moment de la création d'un second
- Paywall non-agressif : montrer la valeur avant de demander le paiement

### 11.3 Paywall UX
- Déclencher au moment où l'utilisateur touche la limite, pas avant
- Message clair sur la valeur débloquée
- Processus de paiement fluide via Stripe

---

## CATÉGORIE 12 — Behavioral Intelligence & Founder Dashboards `[MVP]` event tracking — dashboards avancés `[POST-MVP]`

> **Priorité : Moyenne — event tracking + Founder Dashboards basiques dès le MVP (v2)**

> **Changement v2 :** Les Founder Dashboards basiques passent en MVP Phase 1 (étaient Post-MVP dans v1). Le service est renommé "Behavioral Intelligence Service".

### 12.1 Event Tracking (Events à implémenter)

| Catégorie | Events |
|---|---|
| User Lifecycle | `account_created`, `onboarding_completed` |
| Dossier | `product_added`, `product_not_found`, `manual_product_added`, `ocr_scan_attempted` |
| Regimen | `regimen_created`, `product_added_to_regimen`, `product_removed_from_regimen`, `frequency_changed` |
| Assessment | `assessment_run`, `score_generated`, `findings_viewed` |
| Simulation | `simulation_created`, `simulation_applied`, `simulation_discarded` |
| Formulation Studio | `studio_opened`, `adjustment_made`, `reassessment_triggered` |
| Monetization | `paywall_viewed`, `subscription_started`, `discount_code_used` |
| Environmental | `environment_updated`, `environmental_trigger_generated`, `user_returned_after_trigger` |

Structure d'un event :
```json
{
  "event": "assessment_run",
  "user_id": "anonymized",
  "score": 72,
  "timestamp": "..."
}
```

### 12.2 Dashboards Founder

1. **Regimen Quality Dashboard** — distribution des scores, tendances d'amélioration
2. **Ingredient Risk Dashboard** — conflits les plus fréquents, ingrédients surexposés
3. **Behavior Change Dashboard** — modifications qui améliorent les scores
4. **Retention & Engagement Dashboard** — DAU/WAU, usage du Studio, taux de retour
5. **Environmental Impact Dashboard** — impact du climat sur les routines, réponse aux triggers

### 12.3 Privacy & Data Ethics
- Aucune donnée personnellement identifiable dans les analytics agrégées
- Insights agrégés uniquement
- Transparence sur l'usage des données
- Conformité GDPR (important marché EU)

### 12.4 Valeur B2B `[FUTUR]`
SkinAudit génère un dataset unique de comportement skincare réel :
- Patterns de mauvais usage des actifs
- Comportements par type de peau et climat
- Insights de shopping intent
Clients potentiels : L'Oréal, Estée Lauder, labs indépendants, retailers.

---

## CATÉGORIE 13 — Sécurité & Conformité `[MVP]`

> **Priorité : Haute — dès le départ**

### 13.1 Ownership & Contrôle
- Tous les comptes services (Vercel, Neon, GitHub, Stripe, OpenAI) sous org propriétaire
- Database sous contrôle direct du fondateur
- API keys jamais committées

### 13.2 Protection des données
- Stockage chiffré
- Auth sécurisée (Better Auth)
- Conformité GDPR :
  - Droit à l'effacement
  - Export des données utilisateur
  - Consentement explicite pour l'usage analytique

### 13.3 Scalabilité
- Design pour une base produits croissante
- Caching des données fréquemment consultées (ingrédients, produits populaires)
- Rule engine optimisé (recalcul partiel, pas rebuild complet)
- Architecture modulaire facilitant extraction microservices ultérieure

---

## PHASES DE DÉVELOPPEMENT

### Phase 1 — MVP (Priorité absolue)
**Objectif** : Valider la proposition de valeur core

> **v2 vs v1 :** Ajouts en Phase 1 — Compatibility Simulation, OCR Google ML Kit, Recommendation System basique, Behavioral Logging, Founder Dashboards basiques.

| # | Tâche | Note v2 |
|---|---|---|
| 1 | Setup infrastructure (Next.js, Neon, Prisma, Vercel, GitHub) | — |
| 2 | Schéma BDD complet + migrations (incl. `compatibility_simulations`, `product_metadata`, `confidence_objects`) | Nouvelles tables v2 |
| 3 | Authentification (Better Auth) | — |
| 4 | Seed : ingrédients canoniques + produits populaires | — |
| 5 | Système de matching produits (search + fuzzy + AI NLP + OCR) | OCR now MVP |
| 6 | Onboarding progressif (7 étapes v2) | +4 étapes vs v1 |
| 7 | Skincare Dossier (ajout, gestion, limites free/premium) | — |
| 8 | Formulation Studio central (Ritual Builder + Assessment + Adjust + Reassess) | Architecture unifiée v2 |
| 9 | Regimen Assessment Engine (règles + RHI multi-dimensionnel + findings 3 éléments) | Scoring revu v2 |
| 10 | Compatibility Simulation System | Nouveau MVP v2 |
| 11 | Recommendation System (basique) | Nouveau MVP v2 |
| 12 | Environmental Context Service (basique : localisation + saison) | Renommé v2 |
| 13 | Behavioral Intelligence — event tracking + Founder Dashboards basiques | Dashboards now MVP v2 |
| 14 | Billing Stripe (free/premium + états d'abonnement v2) | Nouveaux états v2 |
| 15 | UX complète + ton des messages (3 éléments + positive reinforcement) | Structure findings v2 |

### Phase 2 — Post-MVP `[POST-MVP]`
- Environmental Trigger System (notifications actives)
- Matching produits amélioré (plus de données, meilleure précision)
- Pre-Purchase Compatibility Check avancé `[PREMIUM]`
- Founder Dashboards avancés
- Advanced Behavioral Insights

### Phase 3 — Intelligence Long-terme `[FUTUR]`
- Outcome tracking longitudinal
- Predictive insights (patterns comportementaux)
- B2B Data Intelligence Layer
- App mobile (React Native ou Flutter, backend API-agnostique depuis le début)

---

## DÉPENDANCES ENTRE MODULES

```
User Profile + Environmental Context + Devices
        ↓
Skincare Dossier (produits + ingrédients mappés)
        ↓
Ritual Builder (régime structuré AM/PM)
        ↓
Regimen Assessment Engine (score + findings)
        ↓
Formulation Studio (optimisation + re-évaluation)
        ↓
Analytics (logging de tous les événements)
```

**Règle critique** : Le moteur d'assessment ne fonctionne de manière fiable que si la couche d'ingrédients canoniques est bien construite. **Le Data Layer est le fondement de tout.**

---

## PRINCIPES NON-NÉGOCIABLES

1. **SkinAudit ne dit jamais quoi acheter** — il aide à comprendre ce que l'utilisateur possède déjà.
2. **L'IA assiste le matching, elle ne remplace pas la logique déterministe** du moteur d'analyse.
3. **Jamais bloquer l'utilisateur** — fallback manuel toujours disponible.
4. **Confiance avant tout** — afficher honnêtement les limites de l'analyse (confidence level).
5. **Ton non-alarmiste et non-jugmental** — chaque message doit être advisory et supportif.
6. **Renforcement positif obligatoire** — identifier ce qui fonctionne bien, pas seulement les problèmes.
7. **État persistant vs calculé** — ne jamais stocker l'état calculé comme vérité primaire. Le RHI et les findings se recalculent à partir des données persistantes.
8. **Backend API-agnostique** depuis le jour 1 pour permettre la migration mobile ultérieure.
9. **GDPR dès le départ** — données agrégées uniquement dans les analytics.

---

*Document mis à jour à partir du BRD "Antidote SkinAudit App — Version 2" (10 mai 2026)*
