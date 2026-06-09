# SkinAudit — Plan de Développement V2

> **Projet** : Antidote SkinAudit App  
> **Client** : The Antidote Agency — Mme Christian-Danielle Anderson  
> **Sources** : BRD v2 (10 mai 2026) + Mémo Addendum (31 mai 2026) + Vision Produit (1er juin 2026)  
> **Document créé le** : 8 juin 2026

---

## Ce qui change dans cette version du plan

Ce plan v2 intègre trois mutations majeures par rapport au `PLAN_DEVELOPPEMENT.md` initial :

| Dimension | Plan v1 | Plan v2 |
|---|---|---|
| Vision produit | Assessment engine | Living skincare intelligence environment |
| Environmental Service | Paramètre de profil statique | Couche d'intelligence contextuelle dynamique (Weather API) |
| Skin Reflection | Absent | Module complet — check-ins + corrélation + longitudinal |
| Séparation Backend / Frontend | Non formalisée | Architecture duale explicite (Backend Truth Layer / Frontend Experience Layer) |
| UX/UI | Spécifiée dans le plan | Sous-spécifiée ici — voir `FRONTEND_EXPERIENCE_SPEC.md` (document à créer) |
| Moteurs de retour | Non formalisés | 6 strategic return drivers intégrés dans l'architecture |

> **Principe architectural ajouté (Mémo 31.5.26) :**  
> *"L'ontologie backend ne doit pas dicter le workflow frontend. Les concepts backend (régime / évaluation / findings) ne doivent pas devenir des étapes littérales du workflow frontend."*

---

## Vue d'ensemble du produit

SkinAudit est un **environnement d'intelligence skincare vivant** qui évolue aux côtés de l'utilisateur. Ce n'est pas un outil d'évaluation ponctuel — c'est un compagnon continu qui analyse comment les produits que l'utilisateur possède déjà fonctionnent ensemble, dans son contexte réel.

### Boucle utilisateur centrale (v2)
```
Ajouter au Dossier → Construire le Régime → Formulation Studio (permanent)
→ Évaluer → Ajuster → Réévaluer → Améliorer → [retour naturel]
```

Le **Formulation Studio** est le foyer permanent de cette boucle. Évaluer, Ajuster et Réévaluer se déroulent tous en son sein, en temps réel, sans quitter l'écran.

### Stack technique
| Couche | Technologie |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS |
| Animations | Framer Motion / GSAP |
| Backend ORM | Prisma |
| Base de données | PostgreSQL (hébergée sur Neon) |
| Auth | Better Auth |
| AI / NLP matching | OpenAI SDK |
| OCR (MVP) | Google ML Kit |
| **Weather API** ← nouveau v2 | OpenWeatherMap ou WeatherAPI |
| Billing | Stripe |
| Déploiement | Vercel |
| Repository | GitHub (org propriétaire) |

---

## Architecture modulaire — 9 services backend (v2)

| Service | Responsabilité |
|---|---|
| **User Service** | Auth, profil, contexte peau |
| **Product & Ingredient Service** | BDD produits, mapping ingrédients, marques |
| **Regimen Service** | Skincare Dossier, Ritual Builder, assignations |
| **Assessment Engine** | Règles, scoring RHI, findings |
| **Formulation Studio Engine** | Recalcul temps-réel, boucle Build/Assess/Adjust/Reassess |
| **Compatibility Simulation Service** | Couche simulation temporaire non-destructive |
| **Environmental Context Service** | Données climat, saison, Weather API, snapshots horodatés, context-triggered reassessment |
| **Skin Reflection & Correlation Service** ← nouveau v2 | Check-ins cutanés, corrélation déterministe, tracking longitudinal |
| **Behavioral Intelligence Service** | Tracking événements, dashboards, agrégation |

---

## Modèle de données — Entités principales (v2)

```
users → user_profiles → user_environment_context        ← updatable dynamiquement (pas seulement onboarding)
                     → user_devices (Skin Tools & Treatments)
                     → user_dossier_products → products → product_versions
                                                        → product_version_ingredients
                                                        → canonical_ingredients
                     → user_regimens → ritual_items
                     → regimen_assessments → findings
                     → compatibility_simulations
                     → formulation_studio_events
                     → analytics_events
                     → skin_reflection_entries           ← nouveau v2
                     → reflection_metrics               ← nouveau v2
brands → brand_aliases
products → product_aliases → product_metadata
canonical_ingredients → ingredient_aliases
environmental_triggers
environmental_snapshots                                  ← nouveau v2
tier_metadata
confidence_objects
```

---

## Modèle de monétisation

| Tier | Produits | Régimes | Prix |
|---|---|---|---|
| **Free** | max 10 | 1 AM + 1 PM | Gratuit |
| **Premium** | max 50 | Multiples + nommage custom | 8–15 €/mois |

**États d'abonnement :** `free` / `premium_active` / `premium_grace` / `premium_expired` / `enterprise`

---

## Légende des badges

| Badge | Signification |
|---|---|
| `[MVP]` | Requis pour le lancement |
| `[PREMIUM]` | Feature payante — nécessite abonnement |
| `[POST-MVP]` | Après le lancement, itération suivante |
| `[FUTUR]` | Phase 3 — Intelligence long-terme |

---

---

# PLAN DE DÉVELOPPEMENT PAR CATÉGORIES

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
  - `user_environment_context` ← designé pour être **updatable dynamiquement**, pas seulement rempli à l'onboarding
  - `environmental_triggers`, `environmental_snapshots` ← nouveau v2
  - `user_devices`
  - `brands`, `brand_aliases`
  - `products`, `product_aliases`, `product_versions`, `product_version_ingredients`
  - `canonical_ingredients`, `ingredient_aliases`
  - `user_dossier_products`
  - `user_regimens`, `ritual_items`
  - `regimen_assessments`, `findings`
  - `compatibility_simulations`
  - `confidence_objects`
  - `formulation_studio_events`
  - `analytics_events`
  - `skin_reflection_entries`, `reflection_metrics` ← nouveau v2
- Écrire les migrations initiales
- Seeder de base : ingrédients canoniques, marques populaires, produits courants

#### Schéma additionnel v2 — Tables nouvelles

##### `environmental_snapshots` — États contextuels horodatés
```sql
CREATE TABLE environmental_snapshots (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  captured_at TIMESTAMP DEFAULT NOW(),
  location_source TEXT,          -- manual, ip_inference, gps
  country_code TEXT,
  city TEXT,
  climate_zone TEXT,             -- dry, humid, temperate
  humidity_band TEXT,            -- low, medium, high
  temperature_band TEXT,
  uv_band TEXT,
  pollution_level TEXT,          -- nouveau v2 (mémo section D.3)
  season TEXT,
  raw_weather_data JSONB,        -- réponse brute de la Weather API
  created_at TIMESTAMP DEFAULT NOW()
);
```

##### `skin_reflection_entries` — Entrées de ressenti cutané
```sql
CREATE TABLE skin_reflection_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  recorded_at TIMESTAMP DEFAULT NOW(),
  dryness_value INT,             -- 0-5
  irritation_value INT,          -- 0-5
  oiliness_value INT,            -- 0-5
  sensitivity_value INT,         -- 0-5
  tightness_value INT,           -- 0-5
  glow_value INT,                -- 0-5
  optional_notes TEXT,
  linked_regimen_state UUID,     -- FK → snapshot état régime
  linked_contextual_state UUID   -- FK → environmental_snapshots
);
```

##### `reflection_metrics` — Métriques de tendance agrégées
```sql
CREATE TABLE reflection_metrics (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  metric_type TEXT NOT NULL,     -- weekly_average, trend, correlation_candidate
  metric_data JSONB NOT NULL,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

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
- Gestion des secrets (API keys OpenAI, Stripe, Neon, **Weather API** ← nouveau)

---

## CATÉGORIE 2 — Data Layer : Produits & Ingrédients `[MVP]`

> **Priorité : Critique — Le cœur analytique ne peut pas fonctionner sans données structurées**

_(Architecture détaillée identique au plan v1 — voir `PLAN_DEVELOPPEMENT.md` sections 2.1 à 2.12 pour le schéma SQL complet des tables brands, products, canonical_ingredients, etc.)_

### Résumé des 3 couches de mapping
```
1. Ingredient Mapping  ← le plus critique
2. Product Mapping     ← normaliser tous les inputs
3. Brand Mapping       ← normaliser les variantes de noms
```

### Stratégie d'alimentation
- **Phase 1** : Import Open Beauty Facts (~5000 produits, confidence = medium) + curation manuelle top 300-500 (confidence = high) + seed ~100-200 ingrédients canoniques
- **Phase 2** : Contribution utilisateur + validation admin
- **Phase 3** : Automatisation OCR + scanning

### Ordre de build Data Layer
```
Étape 1 : Schéma Prisma — toutes les tables (incl. nouvelles v2)
Étape 2 : Seed ingrédients canoniques (~100-200 prioritaires)
Étape 3 : Seed marques (~50-100 avec aliases)
Étape 4 : Seed produits (~300-500 avec versions + ingredient mappings)
Étape 5 : API de recherche produit (search-based)
Étape 6 : OpenAI SDK — fuzzy matching + ingredient parsing
Étape 7 : Pipeline OCR (Google ML Kit) — MVP v2
Étape 8 : Pipeline confidence scoring + propagation chain
Étape 9 : Interface admin de curation (minimale MVP)
```

---

## CATÉGORIE 3 — Onboarding & Profil Utilisateur `[MVP]`

> **Priorité : Haute — Premier contact avec l'app**

### 3.1 Landing page
- Message de valeur clair : *"Comprenez comment votre routine skincare fonctionne vraiment — et comment l'améliorer avec ce que vous possédez déjà."*
- 3 étapes visuelles : Add → Build → Get insights
- CTA unique : **"Commencer mon analyse"**
- Ton : professionnel, calme, non-alarmiste

### 3.2 Création de compte
- Formulaire minimaliste (email + password)
- Pas de guest mode
- Redirection directe vers l'onboarding

### 3.3 Onboarding progressif (7 étapes)

**Étape 1 — Création de compte**
- Email + mot de passe

**Étape 2 — Profil peau**
- Type de peau : dry / oily / combination / normal
- Préoccupations principales (multi-select) : acne, aging, pigmentation, dryness, sensitivity, redness

**Étape 3 — Sensibilité & Objectifs**
- Sensibilité : low / medium / high
- Objectifs prioritaires

**Étape 4 — Contexte Environnemental** ← renforcé v2
- Localisation / région (auto-détectée par IP ou saisie manuelle)
- Saison actuelle
- Climat : dry / humid / temperate
- Message transparent sur l'usage de la localisation :  
  *"Votre contexte environnemental aide SkinAudit à adapter votre analyse. Vous pouvez le modifier à tout moment."*
- `user_environment_context` créé comme objet dynamique dès l'onboarding — pas figé

**Étape 5 — Niveau d'expérience**
- Débutant / intermédiaire / avancé
- Influence le niveau de détail des explications

**Étape 6 — Introduction éducative**
- Explication des concepts : Dossier / Ritual / Formulation Studio
- Introduction au RHI et aux Findings
- Introduction aux Skin Reflections

**Étape 7 — Ingestion des premiers produits**
- OCR scan / recherche / saisie manuelle

---

## CATÉGORIE 4 — Skincare Dossier `[MVP]`

> **Priorité : Haute — Source de toutes les données pour l'analyse**

### 4.1 Interface d'ajout de produits
- Barre de recherche avec suggestions temps réel
- Matching assisté (fuzzy + AI)
- **OCR scan d'étiquette** (Google ML Kit) `[MVP]`
- Scan barcode
- Fallback manuel toujours disponible
- Catégorisation automatique (cleansing / preparation / treatment / support / protection)

### 4.2 Gestion du dossier
- Vue liste/grille des produits possédés
- Statuts : `active` / `seasonal` / `archived`
- Limites freemium (10) / premium (50) avec prompt d'upgrade au seuil
- Métadonnées par produit

### 4.3 Indicateur de confiance
- Badge visible : ✓ Verified / ~ Partial / ? Unverified
- Message contextuel si analyse limitée

---

## CATÉGORIE 5 — Ritual Builder `[MVP]`

> **Intégré au Formulation Studio (Catégorie 7). Construction et évaluation dans le même espace.**

### 5.1 Construction AM/PM
- Interface drag & drop
- Slots Morning Ritual (AM) / Evening Ritual (PM)
- Ordre d'application
- Fréquence par produit : daily / 2-3x/week / weekly / occasional
- RHI recalculé en temps réel pendant la construction

### 5.2 Règle d'or
- Seuls les produits d'usage **régulier** sont inclus dans l'analyse de base
- Produits "occasional" exclus du Regimen Assessment principal

### 5.3 Régimes étendus `[PREMIUM]`
- Multiple rituels nommables
- Override environnemental (voyage)

---

## CATÉGORIE 6 — Regimen Assessment Engine `[MVP]`

> **Priorité : Critique — Le cœur du produit**

### 6.1 Inputs du moteur
- Produits du régime AM + PM + fréquences + ordre
- Composition en ingrédients canoniques
- Profil utilisateur (type de peau, sensibilité)
- **Objet Contexte Environnemental** (inject depuis Environmental Context Service — dynamique, pas statique)
- Skin Reflections récentes (inject depuis Skin Reflection Service) ← nouveau v2
- Usage d'appareils (Skin Tools)

### 6.2 Catégories de règles (7)
1. **Conflits d'Ingrédients** — combinaisons incompatibles (ex : rétinol + AHA)
2. **Redondance** — produits à fonctions dupliquées
3. **Sur-utilisation** — fréquence excessive, exposition cumulative
4. **Étapes Manquantes** — absence SPF, manque hydratation
5. **Séquençage** — actifs mal ordonnés, occlusifs bloquants
6. **Contextuelles** — sensibilité × climat × saison
7. **Interaction Appareils** — micro-needling + rétinol → caution

### 6.3 Outputs

**RHI — Score multi-dimensionnel pondéré (6 dimensions)**

| Dimension | Poids |
|---|---|
| `irritation_risk` | Élevé |
| `barrier_support` | Élevé |
| `regimen_balance` | Modéré |
| `active_overlap` | Modéré |
| `compatibility_quality` | Modéré |
| `contextual_alignment` | Faible-Modéré |

```
RHI = weighted_subscores + contextual_adjustments - confidence_penalties
```

**Interprétation :**

| Score | Label |
|---|---|
| 90–100 | Highly Balanced |
| 75–89 | Generally Balanced |
| 60–74 | Moderate Optimization Opportunity |
| 40–59 | Elevated Concern |
| < 40 | Significant Structural Concern |

**Niveaux de sévérité :** `informational` / `mild` / `caution` / `high`

**Structured Findings — 3 éléments**
```
Issue              : identification du problème
Explanation        : ce qui se passe et pourquoi
Suggested Adjustment : quoi faire concrètement
```

**Positive Reinforcement Outputs** — ce qui fonctionne bien dans le régime, synergies bénéfiques détectées.

**Confidence Layer**  
Chaîne propagée : `product_confidence → ingredient_confidence → assessment_confidence → scoring_confidence`

### 6.4 Principes
- **Déterministe** : même input → même output. L'IA n'intervient jamais dans le calcul du score.
- **Dynamique** : le même régime peut produire un RHI différent selon le contexte environnemental.
- **Explainable** : chaque résultat est compréhensible
- **Ton non-alarmiste** :
  - ❌ *"This routine is bad"*
  - ✓ *"This combination may increase irritation risk, particularly with frequent use."*

---

## CATÉGORIE 7 — Formulation Studio `[MVP]` — avancé `[PREMIUM]`

> **Priorité : Haute — Espace de travail central unifié. C'est ici que l'utilisateur vit dans SkinAudit.**

### 7.1 Espace de travail unifié
Le Studio combine en un seul environnement permanent :
- **Ritual Builder** — construction AM/PM (drag & drop)
- **RHI en temps réel** — calculé et affiché à mesure que le rituel est construit
- **Findings actifs** — alertes + renforcements positifs
- **Contexte environnemental actuel** (ville / saison / climat)
- **Simulation non-destructive** `[MVP]`
- **Historique des évaluations** `[MVP]`

### 7.2 Boucle continue
```
Build → Assess → Adjust → Reassess → Improve
```
Chaque modification → recalcul partiel immédiat (pas de rebuild complet).

Il n'y a pas de bouton "Lancer l'analyse". L'analyse est **continue et ambiante**.

### 7.3 Actions disponibles
- Déplacer un produit AM ↔ PM
- Modifier la fréquence d'utilisation
- Retirer / réintroduire un produit
- Réordonner les étapes
- Lancer une simulation de compatibilité
- Consulter l'historique des évaluations passées

### 7.4 Compatibility Simulation System `[MVP]`

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
- Le Studio affiche le contexte environnemental actuel
- Les findings contextuels se mettent à jour quand le contexte change

### 7.6 Feature Constraints
- `[MVP]` **Free** : 1 rituel AM + 1 PM, recalcul temps-réel, simulation basique, historique limité
- `[PREMIUM]` : rituels multiples, simulation avancée, override voyage, historique complet

---

## CATÉGORIE 8 — Environmental Context Service `[MVP]` ← Architecture upgradée

> **Changement majeur v2 (Mémo 31.5.26) :** L'Environmental Context Service n'est plus un simple paramètre de profil. C'est une **couche d'intelligence contextuelle dynamique** qui injecte des modifiers dans le moteur d'évaluation avant chaque réévaluation.
>
> *"Environmental context must be treated as dynamic contextual input — not as static onboarding metadata."*

### 8.1 Capacités MVP (Priorité HAUTE)

#### User Location Object
- Fondation pour l'interprétation climate-aware et location-aware
- Traité comme infrastructure d'intelligence contextuelle, pas comme "tracking"
- Hiérarchie de fallback : GPS opt-in → IP inference → saisie manuelle → profil onboarding

#### Weather API Integration `[MVP]`
- Ingestion de : humidity, UV index, temperature, dryness indicators, pollution ← nouveau
- Appel API déclenché lors de chaque changement de contexte
- API cible : OpenWeatherMap ou WeatherAPI (à choisir)
- Le backend ingère les données météo — il ne construit pas une "expérience météo"

#### Environmental Context Service (centralisé)
- Fonctionne comme une **centralized contextual interpretation layer**
- Injecte des `environmental_modifiers` dans le Rule Engine avant chaque réévaluation
- Modulaire et scalable
- Crée un `Objet Contexte` :
  ```
  {
    climate_zone, humidity_band, uv_band, temperature_band,
    pollution_level, season, location_source
  }
  ```

#### Dynamic Context Recomputation
- Le même régime produit des outputs différents selon les conditions changeantes
- C'est ce qui rend le système "vivant"

#### Context-Triggered Reassessment
- Un changement de contexte environnemental déclenche automatiquement un recalcul partiel du RHI (dimensions contextuelles uniquement)
- Message dans le Studio : *"Votre contexte a changé. Votre analyse a été mise à jour."*

### 8.2 Capacités MVP (Priorité MOYENNE)

#### Environmental Snapshots horodatés
- Table `environmental_snapshots` — stocke les états contextuels avec timestamp
- Lie les skin_reflection_entries à leur contexte au moment de la saisie
- Nécessaire pour la corrélation temporelle (Catégorie 11)

#### Background Refresh
- Refresh silencieux du contexte à intervalle raisonnable (ex : quotidien)
- Sans notification intrusive à l'utilisateur

### 8.3 Capacités POST-MVP

- **Push-trigger logic** — notifications actives lors de changements climatiques/saisonniers
- **Geofencing / travel detection** — détection automatique de transition
- **GPS opt-in réévaluation automatique** `[PREMIUM]` — voyage détecté → réévaluation déclenchée

### 8.4 Impact contextuel sur l'analyse (exemples)
- Climat sec → risque sécheresse accru → `barrier_support` pénalisé si pas de céramide
- Humidité élevée → texture riche → risque congestion
- UV élevé → importance SPF renforcée → `contextual_alignment` pénalisé si pas de SPF50+
- Hiver → exfoliation → risque barrière accru

### 8.5 Tone des notifications (quand implémentées)
- ❌ *"Your routine is wrong for this weather"*
- ✓ *"Your current environment may benefit from small adjustments to improve balance and comfort."*

---

## CATÉGORIE 9 — Compatibility Check & Regimen Forecasting `[MVP]` basique — avancé `[PREMIUM]`

> **Repositionnement v2 (Mémo 31.5.26) :** Ce n'est pas une "shopping feature". C'est du **regimen forecasting** — un comportement quotidien à haute fréquence.
>
> Questions naturelles de l'utilisateur : "Puis-je l'utiliser ?", "Est-ce compatible avec mon rétinol ?", "Sera-t-il redondant ?", "Où dans mon rituel l'appliquer ?"

### 9.1 Compatibility Simulation (MVP — via Formulation Studio)
Intégré au Studio (voir Catégorie 7). Simuler l'ajout/retrait d'un produit sans modifier le régime réel.

### 9.2 Pre-Purchase Compatibility Forecasting `[PREMIUM]` `[POST-MVP]`

**Flow :**
1. Recherche du produit envisagé
2. Simulation de compatibilité complète avec le régime courant
3. Output :
   - Score de compatibilité
   - Conflits potentiels identifiés
   - Placement suggéré (AM ou PM, à quelle étape)
   - Impact simulé sur le RHI

---

## CATÉGORIE 10 — UX / Interface Utilisateur `[MVP]`

> **Important (Mémo 31.5.26) :** Cette catégorie est **intentionnellement sous-spécifiée** dans ce document technique.  
> L'interaction architecture, les behavioral loops, l'emotional UX, le Studio feel, l'experimentation feel, l'onboarding psychology et les reinforcement systems feront l'objet d'un document séparé : **`FRONTEND_EXPERIENCE_SPEC.md`** (à créer par la fondatrice avec support Vibe Coding).

### 10.1 Principes non-négociables

**L'utilisateur doit ressentir :**
- Rassuré — l'analyse est un soutien, pas un jugement
- Informé — il comprend pourquoi, pas seulement quoi
- En contrôle — il peut explorer sans risque
- Curieux — il a envie d'aller plus loin

**Ce qu'il ne faut PAS créer :**
- Anxiété / Culpabilité / Confusion / Sentiment d'être submergé

### 10.2 Principes UX fondamentaux

1. **Fast Time-to-Value** : insight en moins de quelques minutes
2. **Progressive Complexity** : simple d'abord, plus profond au fil du temps
3. **Continuous Feedback** : chaque action produit un résultat visible immédiatement
4. **Low Friction** : minimum d'inputs requis
5. **Safe Exploration** : l'utilisateur peut tester sans conséquences permanentes
6. **Ambient Intelligence** : l'intelligence se sent présente — pas comme l'exécution d'un rapport

### 10.3 Ton des messages

Structure findings (3 éléments) :
```
1. Issue             — identification du problème
2. Explanation       — ce qui se passe et pourquoi
3. Suggested Adjustment — quoi faire concrètement
```

Langage probabiliste obligatoire :
- ❌ *"This will damage your skin"*
- ✓ *"This combination may increase irritation risk, particularly with frequent use"*

### 10.4 Navigation principale
```
Dashboard / Home
├── Skincare Dossier
├── Formulation Studio (Ritual Builder + Assessment + Simulation)
├── Skin Reflections & Progress   ← nouveau v2
├── Profile & Context (peau + environnement + Skin Tools)
└── Settings / Subscription
```

### 10.5 Document Frontend à créer — `FRONTEND_EXPERIENCE_SPEC.md`
Ce document, rédigé par la fondatrice avec support Vibe Coding, couvrira :
- Interaction architecture détaillée
- Behavioral loops (les 6 return drivers)
- Emotional UX + flow continuity
- Studio feel — comment l'espace de travail se sent "vivant"
- Experimentation feel — simulation psychologie
- Onboarding psychology — réduction friction, engagement progressif
- Reinforcement systems — feedback positif, jalons
- Compatibility exploration flows
- Ambient intelligence behavior — comment les changements contextuels sont perçus sans interruption

---

## CATÉGORIE 11 — Skin Reflection & Correlation Intelligence `[MVP]` basique — avancé `[PREMIUM]`

> **Module entièrement nouveau — absent du BRD v1 et v2. Introduit dans le Mémo Addendum 31.5.26.**  
> Rend SkinAudit "behaviorally intelligent" — les utilisateurs reviennent consulter en continu.

### 11.1 Skin Feeling Check-Ins `[MVP]`

Micro-interactions hebdomadaires (30 secondes) permettant à l'utilisateur de noter son état cutané :

**Métriques :** dryness / irritation / oiliness / sensitivity / tightness / glow (chacune sur 0-5)

**Principes UX :**
- Légèreté et rapidité — jamais un formulaire pesant
- Optionnel — toujours, jamais obligatoire
- Note libre optionnelle (texte court)

**Ce qui est lié à chaque check-in :**
- Snapshot de l'état du régime au moment de la saisie (`linked_regimen_state`)
- Snapshot du contexte environnemental au moment de la saisie (`linked_contextual_state`)

### 11.2 Regimen Correlation Intelligence `[MVP]` basique

Le système détecte des corrélations entre changements de régime et évolution des skin reflections, via **logique déterministe** (rule logic + event comparison + trend observation + temporal comparison — pas ML).

**Flux backend :**
```
reflection_change
→ compare_recent_regimen_changes (7-14 derniers jours)
→ compare_recent_environment_changes
→ identify_possible_contributors
→ output formulé comme "contributeur possible" — jamais comme diagnostic causal
```

**Exemple d'output :**
```
"Vos scores d'irritation se sont améliorés ces 2 dernières semaines.
 Pendant cette période, vous avez réduit votre exfoliant AHA de quotidien à 3x/semaine.
 Cela pourrait être un contributeur possible à l'amélioration."
```

**Contrainte absolue :** Outputs formulés comme *"possible contributors"* — **jamais** comme diagnostic causal. (Principe 10 BRD v2 : Correlation Intelligence, pas Diagnostic Intelligence.)

### 11.3 Contextual Observation Layer `[MVP]`

Connexion entre conditions environnementales, changements de régime, skin reflections et trend behavior.

**Inputs contextuels :** weather API, humidity, UV index, **pollution** ← nouveau, seasonality, climate conditions

**Flux :**
```
user_location → weather_API → environment_snapshot
→ contextual_modifier_layer → recommendation_adjustment
```

### 11.4 Longitudinal Trend Tracking `[MVP]` basique — `[PREMIUM]` complet

Le système devient **"time-aware"** en maintenant un historique à 4 niveaux :
- Score history (évolution RHI)
- Reflection history (évolution des skin reflections)
- Regimen history (tous les changements de régime tracés)
- Contextual history (snapshots environnementaux)

**Free** : historique limité (ex : 3 derniers mois)  
**Premium** : historique complet, visualisation longitudinale avancée

**Valeur :** investissement émotionnel, engagement longitudinal, formation d'habitudes, rétention.

---

## CATÉGORIE 12 — Système de Billing & Abonnements `[MVP]`

> **Priorité : Moyenne — intégrer avant le lancement public**

### 12.1 Intégration Stripe
- Abonnement mensuel (8-15 €) + option annuelle
- Discount codes / promotions
- Trial logic
- Webhooks pour mise à jour du statut d'abonnement

### 12.2 Gestion des limites Freemium
- Compteur produits Dossier → blocage à 10 → prompt upgrade contextuel
- Blocage à 1 régime → prompt upgrade
- Historique limité → prompt upgrade
- Paywall non-agressif : montrer la valeur avant de demander le paiement

### 12.3 Philosophie paywall
- Déclencher au moment où l'utilisateur touche la limite — pas avant
- Message clair sur la valeur débloquée
- *"Montrer la valeur D'ABORD"*

---

## CATÉGORIE 13 — Behavioral Intelligence & Founder Dashboards `[MVP]` basique — avancé `[POST-MVP]`

### 13.1 Event Tracking

| Catégorie | Events |
|---|---|
| User Lifecycle | `account_created`, `onboarding_completed` |
| Dossier | `product_added`, `product_not_found`, `manual_product_added`, `ocr_scan_attempted` |
| Regimen | `regimen_created`, `product_added_to_regimen`, `product_removed`, `frequency_changed` |
| Assessment | `assessment_run`, `score_generated`, `findings_viewed` |
| Simulation | `simulation_created`, `simulation_applied`, `simulation_discarded` |
| Formulation Studio | `studio_opened`, `adjustment_made`, `reassessment_triggered` |
| Environmental | `environment_updated`, `environmental_trigger_generated`, `context_snapshot_created` |
| Skin Reflection | `check_in_completed`, `correlation_observed`, `trend_milestone_reached` ← nouveau v2 |
| Monetization | `paywall_viewed`, `subscription_started`, `discount_code_used` |

### 13.2 Founder Dashboards `[MVP]` basiques

1. **Regimen Quality Dashboard** — distribution des scores, tendances d'amélioration
2. **Ingredient Risk Dashboard** — conflits les plus fréquents
3. **Behavior Change Dashboard** — modifications qui améliorent les scores
4. **Retention & Engagement Dashboard** — DAU/WAU, usage du Studio, taux de retour
5. **Environmental Impact Dashboard** — impact du climat sur les routines
6. **Skin Reflection Dashboard** ← nouveau v2 — taux de check-in, métriques de tendance agrégées

### 13.3 Privacy & GDPR
- Aucune donnée personnellement identifiable dans les analytics agrégées
- Conformité GDPR obligatoire (marché EU prioritaire)
- Transparence sur l'usage des données
- Droit à l'effacement + export des données utilisateur

---

## CATÉGORIE 14 — Sécurité & Conformité `[MVP]`

### 14.1 Ownership & Contrôle
- Tous les comptes services sous org propriétaire
- Database sous contrôle direct du fondateur
- API keys jamais committées

### 14.2 Protection des données
- Stockage chiffré
- Better Auth sécurisée
- GDPR : effacement, export, consentement explicite pour usage analytique

### 14.3 Scalabilité
- Design pour base produits croissante
- Caching des données fréquemment consultées
- Rule engine optimisé (recalcul partiel)
- Architecture modulaire facilitant extraction microservices ultérieure
- Backend API-agnostique depuis le jour 1 (préparation mobile)

---

---

## PHASES DE DÉVELOPPEMENT V2

### Phase 1 — MVP

**Objectif** : Valider la proposition de valeur core d'un living skincare intelligence environment

| # | Tâche | Catégorie |
|---|---|---|
| 1 | Setup infrastructure (Next.js, Neon, Prisma, Vercel, GitHub, Weather API) | Cat. 1 |
| 2 | Schéma BDD complet + migrations (incl. `environmental_snapshots`, `skin_reflection_entries`, `reflection_metrics`) | Cat. 1 |
| 3 | Authentification (Better Auth) | Cat. 1 |
| 4 | Seed : ingrédients canoniques + produits populaires | Cat. 2 |
| 5 | Système de matching produits (search + fuzzy + AI NLP + OCR) | Cat. 2 |
| 6 | Onboarding progressif (7 étapes — contexte environnemental dynamique dès le départ) | Cat. 3 |
| 7 | Skincare Dossier (ajout, gestion, limites free/premium) | Cat. 4 |
| 8 | Formulation Studio central (Ritual Builder + Assessment + Adjust + Reassess) | Cat. 7 |
| 9 | Environmental Context Service — Weather API + Objet Contexte + Dynamic Recomputation + Context-Triggered Reassessment | Cat. 8 |
| 10 | Regimen Assessment Engine (règles + RHI 6 dimensions + findings 3 éléments + positive reinforcement + inject contexte environnemental) | Cat. 6 |
| 11 | Compatibility Simulation System (non-destructif) | Cat. 9 |
| 12 | Skin Feeling Check-Ins + linking régime/contexte | Cat. 11 |
| 13 | Regimen Correlation Intelligence (basique — contributeurs possibles) | Cat. 11 |
| 14 | Longitudinal Trend Tracking basique (score history + reflection history) | Cat. 11 |
| 15 | Behavioral Intelligence — event tracking + Founder Dashboards basiques (incl. Skin Reflection Dashboard) | Cat. 13 |
| 16 | Environmental Snapshots horodatés + Background Refresh | Cat. 8 |
| 17 | Billing Stripe (free/premium + états d'abonnement) | Cat. 12 |
| 18 | UX complète conforme aux principes (voir `FRONTEND_EXPERIENCE_SPEC.md`) | Cat. 10 |

### Phase 2 — Post-MVP

- Environmental Trigger System (notifications push actives)
- GPS opt-in + réévaluation automatique au voyage `[PREMIUM]`
- Pre-Purchase Compatibility Forecasting avancé `[PREMIUM]`
- Longitudinal Trend Tracking avancé (visualisation complète)
- Correlation Intelligence avancée
- Founder Dashboards avancés
- Matching produits amélioré (plus de données, meilleure précision)
- `FRONTEND_EXPERIENCE_SPEC.md` — implémentation complète behavioral loops

### Phase 3 — Intelligence Long-terme

- Outcome tracking longitudinal multi-années
- Predictive insights (patterns comportementaux)
- B2B Data Intelligence Layer (L'Oréal, Estée Lauder, labs)
- App mobile (React Native — backend API-agnostique depuis le jour 1)

---

## DÉPENDANCES ENTRE MODULES (v2)

```
User Profile + Contexte Environnemental (dynamique) + Devices
        ↓
Skincare Dossier (produits + ingrédients mappés)
        ↓
Ritual Builder / Formulation Studio (régime structuré AM/PM)
        ↓                                    ↑
Environmental Context Service ──────────────→ │ (inject modifiers)
        ↓                                    │
Regimen Assessment Engine (score RHI + findings)
        ↓
Skin Reflection & Correlation Service (check-ins + corrélation)
        ↓
Behavioral Intelligence (logging + dashboards + longitudinal)
```

**Règle critique :** Le moteur d'assessment ne fonctionne de manière fiable que si :
1. La couche d'ingrédients canoniques est bien construite
2. Le contexte environnemental est injecté dynamiquement avant chaque évaluation

---

## PRINCIPES NON-NÉGOCIABLES (v2)

1. **SkinAudit ne dit jamais quoi acheter** — il aide à comprendre ce que l'utilisateur possède déjà.
2. **L'IA assiste le matching, elle ne remplace pas la logique déterministe** du moteur d'analyse.
3. **Jamais bloquer l'utilisateur** — fallback manuel toujours disponible.
4. **Confiance avant tout** — afficher honnêtement les limites (confidence level propagé).
5. **Ton non-alarmiste et non-judgmental** — chaque message est advisory et supportif.
6. **Renforcement positif obligatoire** — identifier ce qui fonctionne bien, pas seulement les problèmes.
7. **État persistant vs calculé** — le RHI et les findings se recalculent à partir des données persistantes. Jamais stockés comme vérité primaire.
8. **Backend API-agnostique** depuis le jour 1 pour permettre la migration mobile.
9. **GDPR dès le départ** — données agrégées uniquement dans les analytics.
10. **Correlation Intelligence, pas Diagnostic Intelligence** — tous les outputs exprimant des relations entre états cutanés et régimes doivent être formulés comme "contributeurs possibles" — jamais comme diagnostics causaux. ← nouveau v2
11. **L'ontologie backend ne dicte pas le workflow frontend** — les concepts backend (régime / évaluation / findings) ne deviennent pas des étapes littérales du workflow. L'expérience est continue et ambiante, pas séquentielle. ← nouveau v2
12. **Le contexte environnemental est dynamique** — pas de la métadonnée d'onboarding figée. Il s'actualise en continu et influe sur l'évaluation à chaque fois. ← nouveau v2

---

## DOCUMENTS À CRÉER

| Document | Statut | Contenu |
|---|---|---|
| `PLAN_DEVELOPPEMENT.md` | ✓ Existant (v1) | Plan technique — BRD v2 |
| `PLAN_DEVELOPPEMENT_V2.md` | ✓ Ce document | Plan technique — BRD v2 + Mémo + Vision |
| `SKINAUDIT_PRODUCT_VISION.md` | ✓ Existant | Vision produit complète |
| `MEMO_ADDENDUM_SYNTHESIS_31.5.26.md` | ✓ Existant | Synthèse du mémo fondatrice |
| **`FRONTEND_EXPERIENCE_SPEC.md`** | ⬜ À créer | Interaction architecture, behavioral loops, emotional UX, Studio feel, onboarding psychology, ambient intelligence |

---

*Plan de Développement V2 — SkinAudit*  
*Intégrant BRD v2 (10 mai 2026) + Mémo Addendum (31 mai 2026) + Vision Produit (1er juin 2026)*  
*The Antidote Agency — Mme Christian-Danielle Anderson*  
*Compilé le 8 juin 2026*
