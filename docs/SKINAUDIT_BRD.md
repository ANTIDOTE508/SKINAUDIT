# ANTIDOTE: SkinAudit App — Business Product Requirements Document

**Fondatrice :** Mme Christian-Danielle Anderson, The Antidote Agency
**BRD Version :** 2 (10 mai 2026)

---

## Concept central

SkinAudit est une **plateforme d'intelligence cutanée personnelle** qui aide les utilisateurs à comprendre, évaluer et améliorer la façon dont leurs produits de soin fonctionnent ensemble au sein d'un régime complet.

Ce n'est **pas** un marketplace ni un moteur de recommandation de produits. C'est un **conseiller analytique neutre** : il analyse ce que l'utilisateur possède déjà et lui explique comment l'optimiser. Le positionnement clé : *"You've had the products. Now you have the intelligence."*

### Boucle utilisateur centrale
```
Ajouter au Dossier → Construire le Régime → Évaluer dans le Formulation Studio
→ Ajuster → Réévaluer → Améliorer
```

---

## A quoi sert SkinAudit ? Les cas d'usage concrets

### Le problème que l'app résout

La plupart des gens accumulent des produits de soin au fil du temps — un sérum vu sur TikTok, un moisturizer recommandé par une amie, un exfoliant trouvé en pharmacie, un rétinol conseillé par une esthéticienne. Au bout d'un moment, leur rituel ressemble à un empilement de 6, 8, 10 produits appliqués chaque matin et chaque soir, **sans savoir si tout ça fonctionne ensemble**.

Le problème : **certains ingrédients se neutralisent, d'autres s'irritent mutuellement, d'autres encore font double emploi.** Et personne ne le dit à l'utilisateur, parce que les marques ne vendent que leurs propres produits — elles n'ont aucun intérêt à analyser le régime global.

### Ce que fait concrètement l'app

Tu entres tes produits. L'app analyse comment ils interagissent **ensemble**. Elle te dit ce qui ne va pas, pourquoi, et comment ajuster — **sans te demander d'acheter quoi que ce soit de nouveau.**

---

### Use case 1 — "Ma peau est irritée et je ne sais pas pourquoi"

> Sophie, 28 ans, utilise depuis 2 mois : un nettoyant à l'acide glycolique (AHA), un sérum à la vitamine C, et un rétinol le soir. Sa peau est rouge, tiraillée, hypersensible.

Elle entre ses 3 produits dans SkinAudit. L'app détecte :
- **Conflit** : AHA (exfoliant acide) + rétinol dans le même rituel = irritation cumulée
- **Surcharge** : vitamine C + rétinol = deux actifs forts qui stressent la barrière cutanée
- **Manque** : pas de moisturizer barrier-support dans son rituel

L'app lui dit :
> *"Your ritual combines several strong actives that may be increasing your skin's sensitivity. This is very common and can be improved without changing your products. Consider using your AHA in the morning and your retinol at night only, and add a gentle moisturizer after each step."*

Sophie ne rachète rien. Elle **réorganise** simplement l'ordre et la fréquence. Son irritation disparaît en 2 semaines.

---

### Use case 2 — "J'ai beaucoup de produits, je ne sais pas lesquels utiliser ensemble"

> Marc, 35 ans, a accumulé 12 produits dans sa salle de bain. Il les applique en vrac, sans logique. Il ne voit aucun résultat.

Il entre tous ses produits dans SkinAudit. L'app :
- Détecte **3 doublons** (deux moisturizers qui font la même chose)
- Identifie **2 produits redondants** avec les mêmes actifs à des concentrations similaires
- Lui propose un **rituel AM optimal** avec 4 produits parmi ses 12
- Lui propose un **rituel PM optimal** avec 5 produits différents

Marc réalise qu'il n'a pas besoin d'acheter plus — il avait juste besoin d'**ordre et de structure**.

---

### Use case 3 — "Je vis à Dubai, mon rituel pensé pour Paris ne fonctionne plus"

> Inès, 31 ans, a déménagé de Paris à Dubai. Son rituel qui fonctionnait parfaitement en France lui bouche maintenant les pores.

Elle renseigne son nouveau contexte (climat chaud et humide, été). L'app détecte :
- **Incompatibilité climatique** : son moisturizer épais et occlusif, parfait pour un hiver parisien, est trop lourd pour un climat chaud et humide
- **Risque de congestion** : la combinaison produits riches + chaleur = pores bouchés
- **Absence de SPF adapté** : son SPF habituel (SPF 30) insuffisant pour un UV index élevé

L'app lui explique pourquoi son régime doit évoluer **selon son environnement**, pas seulement selon son type de peau.

---

### Use case 4 — "J'utilise des Skin Tools, est-ce compatible avec mes produits ?"

> Léa, 40 ans, vient d'acheter un outil de microneedling à domicile. Elle continue son rituel habituel les jours où elle l'utilise, incluant son sérum rétinol.

Elle ajoute "microneedling" dans son profil Skin Tools & Treatments. L'app déclenche immédiatement :
- **Caution haute** : microneedling + rétinol le même jour = risque d'irritation sévère
- **Suggested Adjustment** : ne pas appliquer de rétinol ni d'AHA les jours de microneedling. Utiliser uniquement des produits apaisants et barrier-support.

---

### Use case 5 — "Je veux progresser mais sans tout changer"

> Thomas, 45 ans, a un rituel basique mais veut l'améliorer.

Il entre ses 5 produits. Score initial : **54** (Elevated Concern).

L'app identifie :
- Il n'a pas de SPF le matin → caution importante
- Il applique son nettoyant deux fois par jour alors qu'il a la peau sèche → over-cleansing
- Son sérum vitamine C est appliqué le soir → perte d'efficacité

Après ajustements (réorganisation uniquement, aucun achat) : score remonte à **81** (Generally Balanced).

Thomas voit concrètement sa progression. La boucle **Build → Assess → Adjust → Reassess** dans le Formulation Studio crée un sentiment d'amélioration mesurable.

---

### En résumé : ce que l'app apporte à l'utilisateur

| Besoin utilisateur | Ce que SkinAudit fait |
|---|---|
| "Ma peau réagit mal, je ne sais pas pourquoi" | Identifie les conflits d'ingrédients responsables |
| "J'ai trop de produits, j'en suis perdu" | Construit un rituel cohérent depuis ce que tu possèdes déjà |
| "Je viens de changer de pays/saison" | Adapte les recommandations à ton environnement réel |
| "J'utilise des outils de soin, c'est compatible ?" | Détecte les combinaisons dangereuses produits/outils |
| "Je veux progresser mais sans acheter" | Mesure l'amélioration de ton régime dans le temps |
| "Je ne comprends pas les ingrédients" | Explique en langage simple ce que fait chaque actif |

> **L'app ne te dit jamais quoi acheter. Elle te dit comment mieux utiliser ce que tu as déjà.**

---

## Ce qui rend SkinAudit différent

1. **Évalue les régimes, pas les produits isolément** — la compatibilité vient des interactions systémiques
2. **Moteur déterministe et explainable** — pas de boîte noire IA pour le scoring
3. **Renforcement positif** — identifie ce qui fonctionne bien, pas seulement les problèmes
4. **Conscience de la confiance** — affiche les limites quand les données sont incomplètes
5. **Contexte environnemental intégré** — le même régime peut être excellent à Paris, inadapté à Dubai

---

## Principes d'expérience produit (10 principes BRD v2)

1. **Supportive Optimization** — évaluer pour aider, non pour juger
2. **Explainable Feedback** — chaque finding explique le *pourquoi*
3. **Explainable Scoring** — le score est décomposable et compréhensible
4. **Structured Outputs** — résultats cohérents et lisibles
5. **Positive Reinforcement** — identifier ce qui fonctionne bien, pas seulement les problèmes
6. **Curiosity-Driven Exploration** — encourager l'expérimentation dans le Formulation Studio
7. **Progress Visibility** — rendre visible l'amélioration au fil du temps
8. **Transparency & Confidence Awareness** — montrer les limites des données
9. **Mastery Over Gamification** — miser sur la compréhension, pas les points/badges
10. **Long-Term Relationship Philosophy** — construire une relation durable, pas une transaction

---

## Terminologie clé (BRD v2)

### Concepts utilisateur

| Terme | Définition précise | Exemple concret |
|---|---|---|
| **Ritual** | Séquence ordonnée de produits appliquée sur un slot temporel (AM ou PM). Un rituel a un ordre, une fréquence par produit, et un contexte. | Rituel AM de Sophie : nettoyant → vitamine C → SPF. Chaque produit a sa fréquence : nettoyant daily, vitamine C daily, SPF daily. |
| **Regimen** | Système complet de soins = l'ensemble des rituels actifs + leur fréquence + le contexte environnemental + les Skin Tools & Treatments. C'est l'unité d'analyse principale. | Le régime de Marc = Rituel AM (4 produits) + Rituel PM (5 produits) + contexte Paris hiver + microneedling 1x/semaine. C'est cet ensemble qui est évalué, pas chaque rituel isolément. |
| **Skincare Dossier** | Bibliothèque personnelle de tous les produits que l'utilisateur possède. Un produit dans le Dossier n'est **pas** automatiquement analysé — il doit être assigné à un rituel pour entrer dans l'évaluation. | Marc a 12 produits dans son Dossier, mais seuls 9 sont assignés à ses rituels. Les 3 restants (un masque occasionnel, un sérum d'été, un old product) sont dans le Dossier mais exclus du RHI. |
| **Formulation Studio** | Espace de travail central et unifié. Combine en un seul flux : construction du rituel (Ritual Builder) + évaluation temps réel + ajustement interactif + réévaluation. La boucle Build → Assess → Adjust → Reassess se fait entièrement dans le Studio. | Thomas ouvre le Studio, assemble son rituel PM, voit son RHI monter de 54 à 71 en temps réel quand il retire son rétinol du slot AM. Il confirme le changement sans jamais quitter l'écran. |
| **Skin Tools & Treatments** | Élargissement de "appareils/devices" (v1). Inclut les outils à domicile (LED mask, microneedling, brosse faciale, microcourant) **et** les soins professionnels (peelings chimiques professionnels, laser, microneedling professionnel). | Léa utilise un microneedling à domicile 1x/semaine et va en institut pour un peeling chimique 1x/mois. Les deux sont déclarés dans son profil Skin Tools. L'app adapte ses findings pour les jours où chaque outil est utilisé. |

### Moteur & Scoring

| Terme | Définition précise | Exemple concret |
|---|---|---|
| **Assessment** | Évaluation complète d'un régime à un instant T, déclenchée manuellement ou automatiquement lors d'un changement dans le Formulation Studio. Produit deux outputs : un RHI (score global) et une liste de findings. C'est un état **calculé** — jamais stocké comme vérité primaire, toujours recalculé depuis les données persistantes. | Sophie lance un assessment sur son rituel PM → le moteur exécute toutes les règles → output : RHI = 48 + 3 findings. Elle retire son AHA, relance un nouvel assessment → RHI = 76 + 1 finding restant. Les deux assessments coexistent dans l'historique. |
| **Finding** | Résultat unitaire produit par le moteur quand une règle est déclenchée. Un finding est un message structuré en 3 parties (Issue + Explanation + Suggested Adjustment) associé à un niveau de sévérité (informational / mild / caution / high). Un assessment peut produire 0 à N findings, positifs ou négatifs. | Le rituel PM de Sophie déclenche 2 findings : (1) severity: caution — Issue: "Retinoid and AHA in the same slot" / Explanation: "These two actives combined may increase irritation over time" / Suggested Adjustment: "Move your AHA to AM and keep retinol for PM only." (2) severity: informational — Issue: "No barrier support detected" / Explanation: "Your ritual lacks moisturizing agents after active ingredients" / Suggested Adjustment: "Add a gentle moisturizer as a last step." |
| **Regimen Assessment Engine** | Moteur d'évaluation entièrement déterministe et rule-based. Prend en entrée le régime complet (rituels + contexte + Skin Tools) et produit un RHI + des findings. **Jamais piloté par IA** — l'IA n'intervient que pour la résolution des produits en amont. | Le moteur détecte que le rituel PM de Sophie contient rétinol (class: retinoid) + glycolic acid (class: aha) → règle R001 déclenchée → finding généré → RHI dimension irritation_risk pénalisée. Même input, même output, toujours. |
| **Regimen Health Index (RHI)** | Score multi-dimensionnel pondéré sur 6 dimensions : irritation_risk, barrier_support, regimen_balance, active_overlap, compatibility_quality, contextual_alignment. Remplace l'ancien score base-100 à déductions fixes. | Régime de Thomas avant ajustement : irritation_risk faible (pas de conflits) mais barrier_support très bas (aucun ceramide, aucun humectant) + contextual_alignment bas (hiver sec, pas d'hydratant). RHI = 54. Après ajout d'un moisturizer : barrier_support remonte → RHI = 81. |
| **Compatibility Simulation System** | Couche temporaire et non-destructive permettant de simuler des modifications du régime et d'en voir l'impact sur le RHI et les findings — sans modifier le régime réel. La modification n'est persistée que si l'utilisateur confirme. | Inès veut savoir ce qui se passe si elle ajoute une huile de nuit à son rituel PM. Elle crée une simulation : RHI simulé = 68 vs RHI réel = 72 — l'huile crée un risque de congestion en climat humide. Elle voit le finding simulé, décide de ne pas confirmer. Son régime réel est intact. |
| **Confidence Propagation** | Chaîne de confiance : product_confidence → ingredient_confidence → assessment_confidence → scoring_confidence → recommendation_confidence. La confiance basse d'un produit se propage et réduit la confiance du score global. | Marc ajoute manuellement un sérum de marque locale sans liste INCI → product_confidence = low → les ingrédients de ce produit sont inconnus → assessment_confidence dégradée → le RHI s'affiche avec le badge "Limited data — 2 products could not be fully verified". |

### Services backend (nommage v2)

| Terme v2 | Définition | Exemple d'usage | Remplace (v1) |
|---|---|---|---|
| **Environmental Context Service** | Construit l'objet contextuel (climat, saison, humidité, UV) injecté dans le Rule Engine avant chaque évaluation. | Inès change sa localisation de Paris à Dubai → le service reconstruit le contexte (hot, humid, uv_index: high) → toutes les règles environnementales sont réévaluées → son moisturizer épais déclenche maintenant un finding congestion_risk. | "Environmental Service" |
| **Behavioral Intelligence Service** | Service de tracking comportemental : log de tous les events utilisateur, agrégation, production des métriques pour les dashboards fondatrice. | Après 1 mois : le service agrège que 73% des utilisateurs ont amélioré leur RHI après avoir retiré un exfoliant de leur rituel PM → la fondatrice voit cette stat dans son Regimen Quality Dashboard. | "Analytics Service" |

---

## Parcours utilisateur — Onboarding étendu (BRD v2)

1. **Création de compte** — email + mot de passe
2. **Profil** — type de peau, préoccupations
3. **Sensibilité & objectifs peau** — sensibilité, focus prioritaires
4. **Collecte du contexte environnemental** — région, climat, saison
5. **Niveau d'expérience régime** — débutant à avancé
6. **Introduction éducative** — comprendre le concept avant de commencer
7. **Ingestion des produits** — ajout des premiers produits au Dossier

---

## Fonctionnalités principales

- **Formulation Studio** — espace de travail central unifié (Build → Assess → Adjust → Reassess en boucle continue)
- **Skincare Dossier** — bibliothèque de produits personnelle avec OCR scan (MVP)
- **Ritual Builder** — construction de rituels AM/PM par drag & drop (intégré au Formulation Studio)
- **Regimen Assessment Engine** — détecte conflits, sur-utilisation, étapes manquantes, risques
- **Regimen Health Index (RHI)** — score multi-dimensionnel pondéré (6 dimensions)
- **Compatibility Simulation System** — simulation temporaire non-destructive de modifications (MVP Phase 1)
- **Environmental Context Service** — ajuste les alertes selon météo/saison/UV
- **Skin Tools & Treatments** — détecte les combinaisons dangereuses produits/outils
- **Positive Reinforcement Outputs** — identifie ce qui fonctionne bien (nouveau en v2)

---

## Architecture technique (BRD v2)

### 1. Vue d'ensemble système

**Type de produit :** moteur de décision rule-based et context-aware, superposé à des régimes définis par l'utilisateur, des données d'ingrédients structurées, et des modificateurs environnementaux.

**Architecture :** Monolithe Modulaire (choix délibéré contre les microservices pour le MVP)

---

### 2. Architecture globale — 8 services backend (v2)

| Service | Responsabilité |
|---|---|
| **User Service** | Auth, profil, contexte peau |
| **Product & Ingredient Service** | BDD produits, mapping ingrédients, marques |
| **Regimen Service** | Skincare Dossier, Ritual Builder, assignations |
| **Assessment Engine** | Règles, scoring RHI, findings |
| **Formulation Studio Engine** | Recalcul temps-réel, boucle d'interaction, simulation |
| **Compatibility Simulation Service** | Couche de simulation temporaire non-destructive (nouveau MVP) |
| **Environmental Context Service** | Données climat, saison, triggers |
| **Behavioral Intelligence Service** | Tracking événements, dashboards, agrégation |

---

### 3. Principe architectural clé — État Persistant vs État Calculé

**État Persistant** (stocké en base, appartient à l'utilisateur) :
- Contenu du Skincare Dossier
- Structure des Rituels
- Profil & Contexte Environnemental
- Données Skin Tools & Treatments

**État Calculé** (dérivé à la demande, jamais stocké comme vérité primaire) :
- Regimen Health Index (RHI)
- Findings structurés
- Scores de sous-dimensions
- Résultats de simulation de compatibilité

Ce principe garantit que les changements de règles ou de données d'ingrédients peuvent recalculer les résultats passés sans corrompre les données utilisateur.

---

### 4. Chaîne de propagation de confiance

```
Confiance produit → Confiance ingrédients → Confiance assessment
→ Confiance scoring → Confiance recommandations
```

Chaque niveau de confiance se propage vers le haut. Un produit à confiance faible réduit la confiance de l'assessment global.

---

### 5. Data Flow complet (chemin critique)

```
User Input (Dossier)
  → Product Resolution Engine (OCR / recherche / manuel)
  → Ingredient Mapping
  → Ritual Construction (Formulation Studio)
  → Rule Engine Execution
  → Scoring Engine (RHI multi-dimensionnel)
  → Output Formatter (tone layer + positive reinforcement)
  → Response to user
  → Event logged (Behavioral Intelligence Service)
```

---

### 6. Product Resolution Engine

**Rôle critique** : résoudre un nom de produit saisi par l'utilisateur en un objet produit structuré avec ingrédients connus.

**Types d'input et niveaux de confiance :**

| Type | Exemple | Confiance |
|---|---|---|
| Exact match | "The Ordinary Niacinamide" | High |
| Approximate | Produit similaire | Medium |
| Manual entry | Nom saisi par l'user | Low |
| OCR scan (MVP) | Photo d'étiquette | Medium→High |
| Ingredient input | Liste INCI complète | High |

> **Principe clé :** L'app ne bloque jamais l'utilisateur. Même si les données sont incomplètes, l'analyse tourne et le niveau de confiance est affiché en UI.

---

### 7. Catégories de produits (taxonomie détaillée v2)

| Catégorie | Types inclus |
|---|---|
| **Cleansing Products** | Makeup remover, micellar water, cleansing balm, cleansing oil, gel/cream/foam/milk cleanser |
| **Preparation Products** | Toner, hydrating toner, facial mist, essence |
| **Treatment Products** | Serum, exfoliant, facial scrub, at-home peel, acne treatment, various masks |
| **Support Products** | Moisturizer, barrier cream, facial oil, hydration/soothing/recovery/overnight mask |
| **Protection Products** | SPF / sunscreen |

---

### 8. Rule Engine (système cœur)

**7 catégories de règles :**

1. **Conflict rules** — ingrédients incompatibles (ex: rétinoid + AHA même slot)
2. **Overuse rules** — accumulation excessive d'actifs forts
3. **Redundancy rules** — doublons sans valeur additionnelle
4. **Missing step rules** — absences critiques (ex: pas de SPF en AM)
5. **Environmental rules** — inadéquation rituel / conditions externes
6. **Skin Tool rules** — combinaisons dangereuses avec outils de soin
7. **Cadence rules** — fréquence d'usage inadaptée

**Structure d'une règle (JSON) :**
```json
{
  "id": "R001",
  "category": "conflict",
  "severity": "caution",
  "risk_type": "irritation",
  "conditions": {
    "ingredient_classes": ["retinoid", "aha"],
    "same_slot": true
  },
  "modifiers": {
    "sensitivity_high": "severity+1",
    "winter": "severity+1",
    "microneedling": "severity+1"
  },
  "output": {
    "issue": "Retinoid and AHA combination detected",
    "explanation": "Your ritual combines retinoids and AHA exfoliants in the same step.",
    "suggested_adjustment": "Consider using your AHA in the morning and your retinoid at night."
  }
}
```

---

### 9. Scoring Engine — Regimen Health Index (RHI) v2

**6 dimensions pondérées (v2) :**

| Dimension | Poids |
|---|---|
| **irritation_risk** | Élevé |
| **barrier_support** | Élevé |
| **regimen_balance** | Modéré |
| **active_overlap** | Modéré |
| **compatibility_quality** | Modéré |
| **contextual_alignment** | Faible-Modéré |

**Formule :**
```
RHI = weighted_subscores + contextual_adjustments - confidence_penalties
```

**Interprétation du score :**

| Score | Label | Signification |
|---|---|---|
| 90–100 | Highly Balanced | Régime très bien structuré |
| 75–89 | Generally Balanced | Quelques ajustements mineurs possibles |
| 60–74 | Moderate Optimization Opportunity | Améliorations notables possibles |
| 40–59 | Elevated Concern | Plusieurs problèmes détectés |
| < 40 | Significant Structural Concern | Régime à revoir en profondeur |

**Niveaux de sévérité (v2) :**

| Niveau | Description |
|---|---|
| **informational** | Information sans action urgente requise |
| **mild** | Observation légère, ajustement optionnel |
| **caution** | Attention recommandée, ajustement conseillé |
| **high** | Action fortement recommandée |

**Affichage conditionnel du score :**
- Confidence `high` → score plein affiché
- Confidence `medium` → score avec mention "based on partial data"
- Confidence `low` → score indicatif uniquement, badge "Limited data"

---

### 10. Assessment et Findings (v2)

Un **assessment** est l'évaluation complète d'un régime à un instant T. Il est déclenché manuellement par l'utilisateur ou automatiquement lors d'un changement dans le Formulation Studio. Il produit deux outputs : un **RHI** (le score global) et une **liste de findings** (les observations unitaires). L'assessment est un état calculé — il n'est jamais stocké comme vérité primaire, il se recalcule à chaque fois depuis les données persistantes (rituels, profil, contexte).

**Exemple :** Sophie lance un assessment sur son rituel PM. Le moteur parcourt ses 3 produits, exécute toutes les règles, et produit : RHI = 48 (Elevated Concern) + 3 findings (2 négatifs, 1 positif). Elle ajuste, relance — nouvel assessment : RHI = 76 (Generally Balanced) + 1 finding restant.

---

Un **finding** est le résultat unitaire produit par le moteur lorsqu'une règle est déclenchée. C'est le message concret que l'utilisateur voit. Un assessment peut produire 0 à N findings — certains signalent un problème, d'autres renforcent positivement ce qui fonctionne bien. Chaque finding est associé à un niveau de sévérité : `informational` / `mild` / `caution` / `high`.

Chaque finding contient 3 champs obligatoires :
```
Issue              : identification courte du problème ou de l'observation
Explanation        : ce qui se passe et pourquoi c'est important
Suggested Adjustment : quoi faire concrètement
```

**Exemple — finding négatif (severity: caution) :**
```
Issue              : "Retinoid and AHA in the same evening slot"
Explanation        : "These two actives combined may increase irritation over time,
                     especially with daily use."
Suggested Adjustment : "Move your AHA to your morning ritual and keep retinol
                        for evenings only."
```

**Exemple — finding positif (severity: informational) :**
```
Issue              : "Good barrier support detected"
Explanation        : "Your ritual includes ceramides and a humectant, which work
                     together to maintain your skin's protective layer."
Suggested Adjustment : "Keep this combination — it's working well for your skin type."
```

> Changement v2 : la structure passe de 4 éléments (Title + Explanation + Impact + Recommendation) à 3 (Issue + Explanation + Suggested Adjustment). Les findings positifs sont une nouveauté v2 — la v1 ne produisait que des warnings.

---

### 11. Compatibility Simulation System (MVP Phase 1 — nouveau v2)

Couche de simulation temporaire et non-destructive permettant à l'utilisateur d'explorer des modifications de régime sans altérer son régime réel.

**Fonctionnement :**
- L'utilisateur crée une simulation temporaire
- Le moteur recalcule l'assessment sur la configuration simulée
- Le score et les findings simulés sont affichés côte à côte avec l'état réel
- Aucune modification n'est persistée tant que l'utilisateur ne confirme pas

**Cas d'usage :**
- "Que se passe-t-il si j'ajoute ce produit ?"
- "Que se passe-t-il si je retire ce sérum ?"
- "Que se passe-t-il si je déplace ce produit en PM ?"

> **Note importante :** la Compatibility Simulation était Post-MVP dans le BRD v1. Elle est **MVP Phase 1 dans le BRD v2**.

---

### 12. Environmental Context Service

Construit un objet contextuel enrichi injecté dans le Rule Engine avant l'évaluation.

**Inputs :**

| Input | Valeurs | Source |
|---|---|---|
| Climat | hot / cold / humid / dry / temperate | Profil user |
| Saison | summer / winter / spring / autumn | Date système + région |
| Humidité | low / medium / high | Profil environnemental |
| Sensibilité | low / medium / high | Profil peau |
| Skin Tools | liste des outils utilisés | Onboarding |

**Modificateurs de risque :**

| Condition | Risque amplifié |
|---|---|
| `season: winter` | Dryness risk |
| `climate: humid` | Congestion risk |
| `uv_index: high` | UV risk |
| `sensitivity: high` | Irritation risk (tous conflits → sévérité +1) |
| `device: microneedling` | Irritation + infection risk |
| `device: facial_brush` | Over-exfoliation risk |

---

### 13. AI Pipeline — Rôle limité et précis

L'IA intervient **uniquement pour l'assistance à la reconnaissance**, jamais pour les décisions d'analyse.

**OCR (MVP v2 — Google ML Kit) :**
```
Photo d'étiquette capturée
  → Google ML Kit (OCR)
  → Raw text extrait
  → Parser : détection section INCI
  → Nettoyage et split
  → Ingredient Normalization Engine
```

> **Note :** OCR avec Google ML Kit est **MVP** dans le BRD v2 (était "Future/FUTUR" dans v1)

**NLP (matching textuel) :**
- OpenAI SDK pour fuzzy matching, correction de fautes
- Inférence de catégorie produit si produit inconnu

**Contrainte architecturale critique :**
> L'IA est un **outil d'input**, pas un **moteur de décision**. Toute conclusion affichée à l'utilisateur provient exclusivement du Rule Engine et du Scoring Engine.

---

### 14. Output Generation Layer

**Positive Reinforcement Outputs (nouveau v2) :**
En plus des warnings, le système génère des outputs positifs :
- Ce qui fonctionne bien dans le régime
- Les bonnes pratiques identifiées
- Les synergies bénéfiques entre ingrédients

Contraintes strictes :
- Pas de diagnostic médical
- Pas de claims absolus
- Pas de fear language
- Langage probabiliste obligatoire

---

### 15. Modèle de données — Entités principales

```
users → user_profiles → user_environment_context
                     → user_devices (Skin Tools & Treatments)
                     → user_dossier_products → products → product_versions
                                                        → product_version_ingredients
                                                        → canonical_ingredients
                     → user_regimens → ritual_items
                     → regimen_assessments → findings
                     → compatibility_simulations  ← nouveau v2
                     → formulation_studio_events
                     → analytics_events
brands → brand_aliases
products → product_aliases → product_metadata  ← nouveau v2
canonical_ingredients → ingredient_aliases
environmental_triggers
tier_metadata          ← nouveau v2
confidence_objects     ← nouveau v2
```

---

### 16. Analytics & Behavioral Intelligence

Chaque interaction utilisateur est un event tracké.

**Events trackés (MVP) :**

| Event | Données |
|---|---|
| `account_created` | user_id, timestamp |
| `onboarding_completed` | steps completed, skin_type |
| `product_added` | product_id, resolution_type, confidence, category |
| `ritual_created` | user_id, nb produits, slot (AM/PM) |
| `assessment_run` | regimen_id, rhi_score, rules_triggered, confidence |
| `simulation_created` | user_id, change_type, score_delta |
| `routine_improved` | regimen_id, score_before, score_after |
| `paywall_viewed` | feature_attempted, tier |

---

### 17. Resilience & Dégradation gracieuse

| Situation | Comportement |
|---|---|
| Produit non trouvé | Proposer similaires → fallback saisie manuelle |
| Ingrédients incomplets | Analyse partielle, confidence = `low`, badge affiché |
| OCR illisible | Ignorer scan, proposer recherche manuelle |
| Barcode inconnu | Fallback API externe → fallback saisie manuelle |
| Routine vide | Bloquer l'analyse, message explicatif |
| Ingrédient `unknown` | Ignoré dans les règles, visible dans détail produit |

**Règles globales :**
- Never crash
- Always return output
- Degrade confidence, not experience
- Log everything

---

## Plateforme & MVP Scope (BRD v2)

**Plateforme :** Web (Next.js) en priorité → wrapper React Native ensuite

### MVP Phase 1 — inclus (BRD v2)

| Feature | Badge |
|---|---|
| Onboarding étendu (7 étapes) | `[MVP]` |
| Skincare Dossier avec OCR | `[MVP]` |
| Ritual Builder (AM/PM) | `[MVP]` |
| Regimen Assessment Engine | `[MVP]` |
| Regimen Health Index (RHI) multi-dimensionnel | `[MVP]` |
| Formulation Studio (Build + Assess + Adjust + Reassess) | `[MVP]` |
| Compatibility Simulation System | `[MVP]` |
| Recommendation System (basique) | `[MVP]` |
| Environmental Context (basique) | `[MVP]` |
| Behavioral Logging (event tracking) | `[MVP]` |
| Founder Dashboards (basiques) | `[MVP]` |
| Billing Stripe (freemium/premium) | `[MVP]` |

### Phase 2 — Post-MVP

- Environmental Trigger System (notifications actives)
- Matching produits amélioré
- Advanced Behavioral Insights
- Dashboards Founder avancés

### Phase 3 — Futur

- Outcome tracking longitudinal
- Predictive insights
- B2B Data Intelligence Layer
- App mobile native

---

## Monétisation

### États d'abonnement (v2)

| État | Description |
|---|---|
| `free` | Compte gratuit actif |
| `premium_active` | Abonnement premium en cours |
| `premium_grace` | Période de grâce (paiement échoué) |
| `premium_expired` | Premium expiré, retour aux limites free |
| `enterprise` | Compte B2B |

### Tiers

| Tier | Produits | Régimes | Prix |
|---|---|---|---|
| **Free** | max 10 | 1 AM + 1 PM | Gratuit |
| **Premium** | max 50 | Multiples + nommage custom | 8–15 €/mois |

**Premium inclut :** simulation de compatibilité avancée, analyse historique, override environnemental (voyage), advanced behavioral insights.

**Revenus futurs :** B2B data intelligence (L'Oréal, Estée Lauder, labs), Premium Skin Reports (one-shot), High-Tier (20–30 €/mois).

---

## Contraintes légales & éthiques

- Aucun diagnostic médical
- Ne remplace pas un dermatologue
- Guidance uniquement, ton calme et éducatif
- GDPR dès le départ (données agrégées uniquement dans les analytics)
- Transparence sur les limites de l'analyse

---

*Document mis à jour à partir du BRD "Antidote SkinAudit App — Version 2" (10 mai 2026)*
