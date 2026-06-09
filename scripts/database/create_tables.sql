-- ============================================================
-- SkinAudit — DDL PostgreSQL v2
-- Segmentation : auth | app | analytics
-- IDs : BIGINT GENERATED ALWAYS AS IDENTITY
-- À exécuter dans Neon (ou psql) par le développeur
-- ============================================================

-- ============================================================
-- SCHEMAS
-- ============================================================

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS analytics;

-- ============================================================
-- ENUMS
-- Les enums sont dans le schema app (domaine métier)
-- auth et analytics n'ont pas d'enums propres
-- ============================================================

CREATE TYPE app."SkinType"             AS ENUM ('DRY', 'OILY', 'COMBINATION', 'NORMAL');
CREATE TYPE app."SensitivityLevel"     AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE app."ExperienceLevel"      AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
CREATE TYPE app."LocationSource"       AS ENUM ('GPS', 'IP_INFERENCE', 'MANUAL', 'ONBOARDING');
CREATE TYPE app."ClimateZone"          AS ENUM ('DRY', 'HUMID', 'TEMPERATE');
CREATE TYPE app."HumidityBand"         AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE app."Season"               AS ENUM ('SPRING', 'SUMMER', 'AUTUMN', 'WINTER');
CREATE TYPE app."ProductCategory"      AS ENUM ('CLEANSER', 'TONER', 'SERUM', 'MOISTURIZER', 'SUNSCREEN', 'MASK', 'OIL', 'TREATMENT', 'OTHER');
CREATE TYPE app."ConfidenceLevel"      AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'UNVERIFIED');
CREATE TYPE app."SafetyRating"         AS ENUM ('SAFE', 'CAUTION', 'AVOID', 'UNKNOWN');
CREATE TYPE app."DossierProductStatus" AS ENUM ('ACTIVE', 'SEASONAL', 'ARCHIVED');
CREATE TYPE app."TimeOfDay"            AS ENUM ('AM', 'PM', 'BOTH');
CREATE TYPE app."UsageFrequency"       AS ENUM ('DAILY', 'TWO_THREE_WEEKLY', 'WEEKLY', 'OCCASIONAL');
CREATE TYPE app."FindingSeverity"      AS ENUM ('INFORMATIONAL', 'MILD', 'CAUTION', 'HIGH');
CREATE TYPE app."FindingCategory"      AS ENUM ('INGREDIENT_CONFLICT', 'REDUNDANCY', 'OVERUSE', 'MISSING_STEP', 'SEQUENCING', 'CONTEXTUAL', 'DEVICE_INTERACTION');
CREATE TYPE app."SimulationType"       AS ENUM ('ADD', 'REMOVE', 'MOVE');
CREATE TYPE app."SimulationStatus"     AS ENUM ('PENDING', 'APPLIED', 'DISCARDED');
CREATE TYPE app."SubscriptionTier"     AS ENUM ('FREE', 'PREMIUM_ACTIVE', 'PREMIUM_GRACE', 'PREMIUM_EXPIRED', 'ENTERPRISE');

-- ============================================================
-- SCHEMA auth
-- Better Auth : user, session, account, verification
-- Noms de tables et colonnes conformes à la doc officielle Better Auth
-- https://www.better-auth.com/docs/concepts/database
-- ============================================================

CREATE TABLE auth.user (
  id             TEXT        PRIMARY KEY,
  email          TEXT        NOT NULL UNIQUE,
  email_verified BOOLEAN     NOT NULL DEFAULT false,
  name           TEXT,
  image          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE auth.session (
  id         TEXT        PRIMARY KEY,
  user_id    TEXT        NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE auth.account (
  id                       TEXT        PRIMARY KEY,
  user_id                  TEXT        NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
  account_id               TEXT        NOT NULL,
  provider_id              TEXT        NOT NULL,
  access_token             TEXT,
  refresh_token            TEXT,
  id_token                 TEXT,
  access_token_expires_at  TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scope                    TEXT,
  password                 TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, account_id)
);

CREATE TABLE auth.verification (
  id         TEXT        PRIMARY KEY,
  identifier TEXT        NOT NULL,
  value      TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SCHEMA app
-- Domaine métier complet
-- ============================================================

-- User profile & context

CREATE TABLE app.user_profiles (
  id                BIGINT                  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES auth.user(id) ON DELETE CASCADE,
  "skinType"        app."SkinType"          NOT NULL,
  sensitivity       app."SensitivityLevel"  NOT NULL,
  concerns          TEXT[]                  NOT NULL DEFAULT '{}',
  "experienceLevel" app."ExperienceLevel"   NOT NULL DEFAULT 'BEGINNER',
  created_at       TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

CREATE TABLE app.user_environment_context (
  id                BIGINT               GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES auth.user(id) ON DELETE CASCADE,
  "locationSource"  app."LocationSource" NOT NULL DEFAULT 'ONBOARDING',
  "countryCode"     TEXT,
  city              TEXT,
  "climateZone"     app."ClimateZone",
  "humidityBand"    app."HumidityBand",
  "temperatureBand" TEXT,
  "uvBand"          TEXT,
  "pollutionLevel"  TEXT,
  season            app."Season",
  "lastUpdatedAt"   TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE TABLE app.user_devices (
  id              BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
  "deviceType"    TEXT        NOT NULL,
  brand           TEXT,
  model           TEXT,
  "usageFrequency" TEXT,
  "addedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Environmental

CREATE TABLE app.environmental_snapshots (
  id                BIGINT               GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
  captured_at      TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  "locationSource"  app."LocationSource",
  "countryCode"     TEXT,
  city              TEXT,
  "climateZone"     app."ClimateZone",
  "humidityBand"    app."HumidityBand",
  "temperatureBand" TEXT,
  "uvBand"          TEXT,
  "pollutionLevel"  TEXT,
  season            app."Season",
  "rawWeatherData"  JSONB,
  created_at       TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE TABLE app.environmental_triggers (
  id            BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
  "triggerType" TEXT        NOT NULL,
  "triggerData" JSONB,
  "processedAt" TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Brands & products

CREATE TABLE app.brands (
  id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT        NOT NULL UNIQUE,
  slug        TEXT        NOT NULL UNIQUE,
  description TEXT,
  website     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE app.brand_aliases (
  id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "brandId"   BIGINT      NOT NULL REFERENCES app.brands(id) ON DELETE CASCADE,
  alias       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("brandId", alias)
);

CREATE TABLE app.products (
  id                BIGINT               GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "brandId"         BIGINT               REFERENCES app.brands(id) ON DELETE SET NULL,
  name              TEXT                 NOT NULL,
  slug              TEXT                 NOT NULL UNIQUE,
  category          app."ProductCategory" NOT NULL,
  subcategory       TEXT,
  description       TEXT,
  "confidenceLevel" app."ConfidenceLevel" NOT NULL DEFAULT 'UNVERIFIED',
  created_at       TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE TABLE app.product_aliases (
  id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT      NOT NULL REFERENCES app.products(id) ON DELETE CASCADE,
  alias       TEXT        NOT NULL,
  source      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, alias)
);

CREATE TABLE app.product_metadata (
  id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT      NOT NULL REFERENCES app.products(id) ON DELETE CASCADE,
  key         TEXT        NOT NULL,
  value       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, key)
);

CREATE TABLE app.product_versions (
  id              BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id     BIGINT      NOT NULL REFERENCES app.products(id) ON DELETE CASCADE,
  "versionLabel"  TEXT,
  "launchDate"    TIMESTAMPTZ,
  "discontinuedAt" TIMESTAMPTZ,
  notes           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ingredients

CREATE TABLE app.canonical_ingredients (
  id            BIGINT              GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inci          TEXT                NOT NULL UNIQUE,
  "commonName"  TEXT,
  description   TEXT,
  functions     TEXT[]              NOT NULL DEFAULT '{}',
  "safetyRating" app."SafetyRating" NOT NULL DEFAULT 'UNKNOWN',
  created_at   TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE TABLE app.product_version_ingredients (
  id                      BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "productVersionId"      BIGINT      NOT NULL REFERENCES app.product_versions(id) ON DELETE CASCADE,
  "canonicalIngredientId" BIGINT      NOT NULL REFERENCES app.canonical_ingredients(id) ON DELETE RESTRICT,
  position                INTEGER     NOT NULL,
  "isKeyIngredient"       BOOLEAN     NOT NULL DEFAULT false,
  concentration           TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("productVersionId", "canonicalIngredientId")
);

CREATE TABLE app.ingredient_aliases (
  id                      BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "canonicalIngredientId" BIGINT      NOT NULL REFERENCES app.canonical_ingredients(id) ON DELETE CASCADE,
  alias                   TEXT        NOT NULL,
  language                TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("canonicalIngredientId", alias)
);

-- User dossier

CREATE TABLE app.user_dossier_products (
  id           BIGINT                   GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
  product_id  BIGINT                   NOT NULL REFERENCES app.products(id) ON DELETE RESTRICT,
  status       app."DossierProductStatus" NOT NULL DEFAULT 'ACTIVE',
  "addedAt"    TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
  "archivedAt" TIMESTAMPTZ,
  notes        TEXT,
  created_at  TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- Regimens & rituals

CREATE TABLE app.user_regimens (
  id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE app.ritual_items (
  id                 BIGINT              GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "regimenId"        BIGINT              NOT NULL REFERENCES app.user_regimens(id) ON DELETE CASCADE,
  "dossierProductId" BIGINT              NOT NULL REFERENCES app.user_dossier_products(id) ON DELETE CASCADE,
  "timeOfDay"        app."TimeOfDay"     NOT NULL,
  "stepOrder"        INTEGER             NOT NULL,
  frequency          app."UsageFrequency" NOT NULL DEFAULT 'DAILY',
  created_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- Assessments & findings

CREATE TABLE app.regimen_assessments (
  id                        BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "regimenId"               BIGINT      NOT NULL REFERENCES app.user_regimens(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
  "rhiScore"                FLOAT       NOT NULL,
  "rhiIrritationRisk"       FLOAT       NOT NULL,
  "rhiBarrierSupport"       FLOAT       NOT NULL,
  "rhiRegimenBalance"       FLOAT       NOT NULL,
  "rhiActiveOverlap"        FLOAT       NOT NULL,
  "rhiCompatibilityQuality" FLOAT       NOT NULL,
  "rhiContextualAlignment"  FLOAT       NOT NULL,
  "confidenceScore"         FLOAT       NOT NULL,
  "environmentalSnapshotId" BIGINT      REFERENCES app.environmental_snapshots(id) ON DELETE SET NULL,
  assessed_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE app.findings (
  id                    BIGINT                GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "assessmentId"        BIGINT                NOT NULL REFERENCES app.regimen_assessments(id) ON DELETE CASCADE,
  severity              app."FindingSeverity" NOT NULL,
  category              app."FindingCategory" NOT NULL,
  issue                 TEXT                  NOT NULL,
  explanation           TEXT                  NOT NULL,
  "suggestedAdjustment" TEXT                  NOT NULL,
  "isPositive"          BOOLEAN               NOT NULL DEFAULT false,
  "affectedProductIds"  BIGINT[]              NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

-- Compatibility simulations

CREATE TABLE app.compatibility_simulations (
  id                   BIGINT                GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
  "regimenId"          BIGINT                NOT NULL REFERENCES app.user_regimens(id) ON DELETE CASCADE,
  "simulationType"     app."SimulationType"  NOT NULL,
  "simulatedProductId" BIGINT,
  "simulatedTimeOfDay" app."TimeOfDay",
  "simulatedStep"      INTEGER,
  "baseRhiScore"       FLOAT                 NOT NULL,
  "simulatedRhiScore"  FLOAT                 NOT NULL,
  "simulatedFindings"  JSONB                 NOT NULL,
  status               app."SimulationStatus" NOT NULL DEFAULT 'PENDING',
  created_at          TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

-- Confidence objects

CREATE TABLE app.confidence_objects (
  id                     BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT REFERENCES auth.user(id) ON DELETE SET NULL,
  "entityType"           TEXT        NOT NULL,
  "entityId"             BIGINT      NOT NULL,
  "productConfidence"    FLOAT,
  "ingredientConfidence" FLOAT,
  "assessmentConfidence" FLOAT,
  "scoringConfidence"    FLOAT,
  notes                  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skin reflections

CREATE TABLE app.skin_reflection_entries (
  id                        BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
  "recordedAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "drynessValue"            INTEGER     NOT NULL CHECK ("drynessValue"     BETWEEN 0 AND 5),
  "irritationValue"         INTEGER     NOT NULL CHECK ("irritationValue"  BETWEEN 0 AND 5),
  "oilinessValue"           INTEGER     NOT NULL CHECK ("oilinessValue"    BETWEEN 0 AND 5),
  "sensitivityValue"        INTEGER     NOT NULL CHECK ("sensitivityValue" BETWEEN 0 AND 5),
  "tightnessValue"          INTEGER     NOT NULL CHECK ("tightnessValue"   BETWEEN 0 AND 5),
  "glowValue"               INTEGER     NOT NULL CHECK ("glowValue"        BETWEEN 0 AND 5),
  "optionalNotes"           TEXT,
  "linkedRegimenState"      TEXT,
  "linkedContextualStateId" BIGINT      REFERENCES app.environmental_snapshots(id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE app.reflection_metrics (
  id            BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
  metric_type  TEXT        NOT NULL,
  "metricData"  JSONB       NOT NULL,
  "periodStart" TIMESTAMPTZ,
  "periodEnd"   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tier / subscription

CREATE TABLE app.tier_metadata (
  id                     BIGINT                  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES auth.user(id) ON DELETE CASCADE,
  tier                   app."SubscriptionTier"  NOT NULL DEFAULT 'FREE',
  "stripeCustomerId"     TEXT,
  "stripeSubscriptionId" TEXT,
  "currentPeriodStart"   TIMESTAMPTZ,
  "currentPeriodEnd"     TIMESTAMPTZ,
  "cancelAtPeriodEnd"    BOOLEAN                 NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SCHEMA analytics
-- Events haute fréquence + studio events
-- ============================================================

CREATE TABLE analytics.analytics_events (
  id           BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT REFERENCES auth.user(id) ON DELETE SET NULL,
  "sessionId"  BIGINT,
  "eventName"  TEXT        NOT NULL,
  "eventData"  JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE analytics.formulation_studio_events (
  id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,
  "regimenId" BIGINT      REFERENCES app.user_regimens(id) ON DELETE SET NULL,
  "eventType" TEXT        NOT NULL,
  "eventData" JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- auth
CREATE INDEX ON auth.session (user_id);
CREATE INDEX ON auth.account (user_id);

-- app — users & context
CREATE INDEX ON app.user_devices (user_id);
CREATE INDEX ON app.user_environment_context (user_id);
CREATE INDEX ON app.environmental_snapshots (user_id, captured_at DESC);
CREATE INDEX ON app.environmental_triggers (user_id);

-- app — products
CREATE INDEX ON app.products ("brandId");
CREATE INDEX ON app.products (category);
CREATE INDEX ON app.product_versions (product_id);
CREATE INDEX ON app.product_version_ingredients ("productVersionId");
CREATE INDEX ON app.product_version_ingredients ("canonicalIngredientId");

-- app — dossier & regimens
CREATE INDEX ON app.user_dossier_products (user_id, status);
CREATE INDEX ON app.user_regimens (user_id, is_active);
CREATE INDEX ON app.ritual_items ("regimenId");

-- app — assessments
CREATE INDEX ON app.regimen_assessments (user_id, assessed_at DESC);
CREATE INDEX ON app.regimen_assessments ("regimenId");
CREATE INDEX ON app.findings ("assessmentId");
CREATE INDEX ON app.compatibility_simulations (user_id, status);

-- app — reflections
CREATE INDEX ON app.skin_reflection_entries (user_id, "recordedAt" DESC);
CREATE INDEX ON app.reflection_metrics (user_id, metric_type);

-- analytics
CREATE INDEX ON analytics.analytics_events (user_id, occurred_at DESC);
CREATE INDEX ON analytics.analytics_events ("eventName");
CREATE INDEX ON analytics.formulation_studio_events (user_id, created_at DESC);
CREATE INDEX ON analytics.formulation_studio_events ("regimenId");
