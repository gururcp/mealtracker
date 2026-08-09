-- =============================================================================
-- Meal Tracker SaaS — Initial Schema
-- Migration: 20260808000000
--
-- Applies all pre-migration review fixes:
--   • daily_logs pinned to plan_version_id (floating log fix)
--   • Nutrition provenance via food_nutrition_versions + content_version pinning
--   • Timezone on members (no IST hardcode)
--   • meal_slots table replaces meal ENUM (extensible meal types)
--   • member auth CHECK constraint
--   • plan_version status guard (draft/active/superseded) + immutability triggers
--   • foods + vegetables merged into one table (category column)
--   • plan_allowed_vegs table (VEGETABLE ALLOWED list per plan version)
--   • food_clinic_overrides replaces nullable clinic_id on foods
--   • household_clinic_history for nutritionist transfer tracking
--   • billing_status on households
--   • scale_extractions table (raw OCR provenance)
--   • plan_habits with target_value/target_max_value/target_unit/is_boolean
--   • habit_ticks with numeric value column
--   • UNIQUE constraints on daily_logs, meal_ticks, habit_ticks, weight_readings
--   • audit_events table with triggers on sensitive tables
--   • authored_by split into authored_by_user_id (clinic) + authored_by_member_id (family)
--   • deactivated_at on members
--   • piece/tsp/tbsp units (real plan uses all three)
--   • plan_item_kind: 'fixed' | 'choice' (replaces veg_slot — paneer/soya are not veg)
--   • alternate_kind: 'specific' (food_id required) | 'open_veg' (picks from plan_allowed_vegs)
--   • partial unique index enforcing exactly one is_default per plan_item
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
-- gen_random_uuid() is a Postgres 13+ built-in (in pg_catalog) — no extension needed.
-- pgcrypto reserved for potential future PIN-hash helpers; enable via Supabase
-- Dashboard → Database → Extensions if/when we add SQL-side crypto functions.

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------

-- Unit types: g/ml are primary (kitchen scale); piece/tsp/tbsp appear in real plans
-- (10 almonds, 1 tsp black coffee, 1 tbsp chia seeds, 7 tsp amla juice)
CREATE TYPE unit_type AS ENUM ('g', 'ml', 'piece', 'tsp', 'tbsp');

CREATE TYPE food_source AS ENUM ('ifct', 'usda', 'llm', 'manual');

-- Vegetables merged into foods via this category column
CREATE TYPE food_category AS ENUM (
    'vegetable', 'grain', 'dairy', 'protein', 'fruit',
    'oil', 'spice', 'beverage', 'supplement', 'other'
);

-- draft  → editable, not yet in use
-- active → currently assigned to a member; immutable (triggers enforce this)
-- superseded → replaced by a newer version; kept for historical tick resolution
CREATE TYPE plan_version_status AS ENUM ('draft', 'active', 'superseded');

-- fixed  → single food, one alternate row (the food itself)
-- choice → 1..N alternates; member picks one at log time
--          covers both veg slots (sabziyan) and protein/carb alternates (paneer/soya)
CREATE TYPE plan_item_kind AS ENUM ('fixed', 'choice');

-- specific → food_id NOT NULL; references an exact food row
-- open_veg → food_id NULL; member picks any vegetable from plan_allowed_vegs at log time
CREATE TYPE alternate_kind AS ENUM ('specific', 'open_veg');

CREATE TYPE clinic_role AS ENUM ('owner', 'nutritionist', 'staff');

CREATE TYPE billing_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'paused');

CREATE TYPE extraction_status AS ENUM ('pending', 'confirmed', 'rejected');

-- ---------------------------------------------------------------------------
-- Identity / Tenancy
-- ---------------------------------------------------------------------------

CREATE TABLE clinics (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supabase Auth users who belong to a clinic (nutritionists, staff, owner)
-- Not in use for V0.1 (no clinic UI yet), but schema is ready
CREATE TABLE clinic_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL,   -- Supabase Auth user_id (auth.uid())
    role        clinic_role NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (clinic_id, user_id)
);

CREATE TABLE households (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id               UUID REFERENCES clinics(id) ON DELETE SET NULL,  -- current primary clinic
    name                    TEXT NOT NULL,
    stripe_subscription_id  TEXT,
    -- Sync from Stripe webhooks; never infer subscription state by calling Stripe per-request
    billing_status          billing_status NOT NULL DEFAULT 'trialing',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit trail for clinic transfers; old clinic retains read access to plans they authored
-- (access gated at plan_versions.clinic_id, not households.clinic_id)
CREATE TABLE household_clinic_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id    UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    clinic_id       UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    from_date       DATE NOT NULL,
    to_date         DATE,           -- NULL = currently assigned
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (household_id, clinic_id, from_date)
);

CREATE TABLE members (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id            UUID NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
    name                    TEXT NOT NULL,
    dob                     DATE,
    height_cm               NUMERIC(5, 1),
    sex                     TEXT CHECK (sex IN ('male', 'female', 'other')),
    -- IANA timezone string; used to compute log_date at write time
    -- Never hardcode IST in application code; always derive from this column
    timezone                TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    is_family_admin         BOOL NOT NULL DEFAULT FALSE,
    is_active               BOOL NOT NULL DEFAULT TRUE,
    -- Both set together in one transaction; is_active is the derived boolean
    deactivated_at          TIMESTAMPTZ,
    deactivated_by_user_id  UUID,       -- Supabase Auth user (clinic staff who deactivated)
    deactivated_by_member_id UUID,      -- family admin who deactivated
    -- V0.1: pin_hash only. V0.2+: auth_user_id set, pin_hash nulled after verification.
    -- At least one MUST be present; ghost members (neither) are billing/adherence liabilities.
    pin_hash                TEXT,
    auth_user_id            UUID UNIQUE, -- Supabase Auth user_id; null until V0.2 migration
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT member_has_auth
        CHECK (pin_hash IS NOT NULL OR auth_user_id IS NOT NULL),
    CONSTRAINT deactivation_consistent
        CHECK (
            (is_active = TRUE  AND deactivated_at IS NULL) OR
            (is_active = FALSE AND deactivated_at IS NOT NULL)
        )
);

-- ---------------------------------------------------------------------------
-- Food / Nutrition Master
-- (Vegetables are NOT a separate table — category = 'vegetable')
-- ---------------------------------------------------------------------------

CREATE TABLE foods (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    en_name         TEXT NOT NULL,
    hi_name         TEXT,
    category        food_category NOT NULL DEFAULT 'other',

    -- Nutrition values are expressed per this unit (100g or 100ml)
    per_100_unit    unit_type NOT NULL DEFAULT 'g' CHECK (per_100_unit IN ('g', 'ml')),

    -- Weight of one piece in grams; required when this food appears as unit='piece' in a plan
    -- e.g. badam (almond) ~1.2g each, anda (egg) ~50g each
    piece_grams     NUMERIC(8, 2),

    -- Approximate weight of one tsp in grams; required when food appears as unit='tsp'
    -- e.g. black coffee powder ~2.5g/tsp, methi seeds ~4g/tsp
    tsp_grams       NUMERIC(8, 2),

    -- Nutrition per 100g (or per 100ml for liquids)
    cal             NUMERIC(8, 2),
    protein_g       NUMERIC(8, 3),
    carbs_g         NUMERIC(8, 3),
    fat_g           NUMERIC(8, 3),
    fiber_g         NUMERIC(8, 3),
    iron_mg         NUMERIC(8, 3),
    calcium_mg      NUMERIC(8, 3),
    magnesium_mg    NUMERIC(8, 3),
    phosphorus_mg   NUMERIC(8, 3),
    potassium_mg    NUMERIC(8, 3),
    sodium_mg       NUMERIC(8, 3),
    zinc_mg         NUMERIC(8, 3),
    vit_a_ug        NUMERIC(8, 3),
    vit_c_mg        NUMERIC(8, 3),
    vit_d_ug        NUMERIC(8, 3),
    vit_e_mg        NUMERIC(8, 3),
    vit_k_ug        NUMERIC(8, 3),
    thiamin_mg      NUMERIC(8, 3),   -- B1
    riboflavin_mg   NUMERIC(8, 3),   -- B2
    niacin_mg       NUMERIC(8, 3),   -- B3
    vit_b6_mg       NUMERIC(8, 3),
    folate_ug       NUMERIC(8, 3),   -- B9
    vit_b12_ug      NUMERIC(8, 3),

    -- Provenance tracking
    -- content_version increments when ANY nutrition value changes.
    -- plan_item_alternates pins this version at plan creation time so historical
    -- calorie calculations never silently change when we refresh IFCT/USDA data.
    source              food_source NOT NULL DEFAULT 'manual',
    source_ref          TEXT,        -- e.g. IFCT item code, USDA FDC ID
    content_version     INT NOT NULL DEFAULT 1,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per (food_id, content_version); populated automatically by trigger
-- when content_version is incremented on foods.
-- Historical nutrition queries join here using the pinned version from plan_item_alternates.
CREATE TABLE food_nutrition_versions (
    food_id         UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    content_version INT  NOT NULL,
    -- Snapshot of all nutrition columns at the moment content_version was incremented
    cal             NUMERIC(8, 2),
    protein_g       NUMERIC(8, 3),
    carbs_g         NUMERIC(8, 3),
    fat_g           NUMERIC(8, 3),
    fiber_g         NUMERIC(8, 3),
    iron_mg         NUMERIC(8, 3),
    calcium_mg      NUMERIC(8, 3),
    magnesium_mg    NUMERIC(8, 3),
    phosphorus_mg   NUMERIC(8, 3),
    potassium_mg    NUMERIC(8, 3),
    sodium_mg       NUMERIC(8, 3),
    zinc_mg         NUMERIC(8, 3),
    vit_a_ug        NUMERIC(8, 3),
    vit_c_mg        NUMERIC(8, 3),
    vit_d_ug        NUMERIC(8, 3),
    vit_e_mg        NUMERIC(8, 3),
    vit_k_ug        NUMERIC(8, 3),
    thiamin_mg      NUMERIC(8, 3),
    riboflavin_mg   NUMERIC(8, 3),
    niacin_mg       NUMERIC(8, 3),
    vit_b6_mg       NUMERIC(8, 3),
    folate_ug       NUMERIC(8, 3),
    vit_b12_ug      NUMERIC(8, 3),
    snapshotted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (food_id, content_version)
);

-- Clinic-specific nutrition overrides (e.g. "paneer, our formulation with different fat %")
-- Global foods in `foods` are read-only for non-super-admins.
-- Nutritionists create overrides here; NULL override columns inherit from the global food.
CREATE TABLE food_clinic_overrides (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_id         UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    clinic_id       UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    -- Only the columns that differ need to be set; NULL = use global value
    cal             NUMERIC(8, 2),
    protein_g       NUMERIC(8, 3),
    carbs_g         NUMERIC(8, 3),
    fat_g           NUMERIC(8, 3),
    fiber_g         NUMERIC(8, 3),
    override_note   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (food_id, clinic_id)
);

-- Alternate names and synonyms for foods.
-- Enables search to find the canonical food entry regardless of what name staff types.
-- Examples:
--   "baby spinach"   → Spinach (Palak)
--   "saag"           → Spinach (Palak)    [or a staff creates a "Saag" alias for it]
--   "shimla"         → Capsicum (Shimla Mirchi)
--   "bhindi"         → Okra / Lady's Finger (Bhindi)   [redundant but harmless]
--   "french beans"   → any future bean entry
--
-- The search UI queries en_name, hi_name, AND alias_name together before showing
-- "Add new food" — prevents most duplicates without any LLM involvement.
--
-- staff/nutritionist can add aliases; LLM deduplication in V0.3+ will auto-populate
-- this table and also flag suspected duplicate food rows for admin review.
CREATE TABLE food_aliases (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_id     UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    alias_name  TEXT NOT NULL,
    language    TEXT NOT NULL DEFAULT 'en',  -- ISO 639-1: 'en', 'hi', 'mr', 'ta', etc.
    added_by_user_id   UUID,    -- clinic staff who added this alias (NULL = seeded)
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (alias_name, language)  -- one canonical food per alias per language
);

-- Lookup table for Indian household measures used in plan display and input UI.
-- Nutritionists enter plans in natural language (1 katori, 1 glass, 1 tsp);
-- this table converts to grams/ml for nutrition calculations.
-- Distinct from unit_type enum: these are display/entry aids, not storage units.
-- Kitchen scale users will confirm gram weights; this table provides defaults.
CREATE TABLE serving_units (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,              -- 'katori', 'glass', 'wati', 'cup'
    food_category   food_category,              -- NULL = applies to all categories
    grams_per_unit  NUMERIC(8, 2) NOT NULL,
    UNIQUE (name, food_category)
);

-- ---------------------------------------------------------------------------
-- Plan Model
-- ---------------------------------------------------------------------------

CREATE TABLE plan_versions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id               UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    -- Who authored this plan (ownership does NOT change when household changes clinic)
    clinic_id               UUID REFERENCES clinics(id) ON DELETE SET NULL,  -- NULL = family-authored
    effective_date          DATE NOT NULL,
    status                  plan_version_status NOT NULL DEFAULT 'draft',
    note                    TEXT,
    -- Exactly one of these should be set; both nullable to handle each authorship type
    authored_by_user_id     UUID,   -- clinic staff Supabase Auth user_id
    authored_by_member_id   UUID REFERENCES members(id) ON DELETE SET NULL,  -- family admin
    published_at            TIMESTAMPTZ,   -- set when status → 'active'
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT author_is_set
        CHECK (authored_by_user_id IS NOT NULL OR authored_by_member_id IS NOT NULL),
    CONSTRAINT author_is_exclusive
        CHECK (NOT (authored_by_user_id IS NOT NULL AND authored_by_member_id IS NOT NULL))
);

-- Replaces the former `meal ENUM('morning','lunch','dinner')` on plan_items.
-- Allows any meal structure: 3 meals, 5 small meals, pre/post-workout, etc.
-- Default rows (morning/lunch/dinner) are created by application code when a new plan_version is drafted.
CREATE TABLE meal_slots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_version_id UUID NOT NULL REFERENCES plan_versions(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,       -- display name: 'Morning 7–11', 'Lunch 11–2', etc.
    position        INT  NOT NULL,       -- display order
    UNIQUE (plan_version_id, position)
);

CREATE TABLE plan_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_version_id UUID NOT NULL REFERENCES plan_versions(id) ON DELETE CASCADE,
    meal_slot_id    UUID NOT NULL REFERENCES meal_slots(id) ON DELETE CASCADE,
    position        INT  NOT NULL,       -- display order within the meal slot
    kind            plan_item_kind NOT NULL,
    -- Preparation or combination instructions shown alongside the item in the UI.
    -- Examples from real plans:
    --   "isabgol ki bhoosi 1 chamach + namak + nimbu + 1 glass paani"
    --   "palak 70g + hara dhaniya 30g — juice bana lein"
    -- These modifiers (namak, nimbu, paani) are not tracked as food items;
    -- they are free-text instructions stored here.
    note            TEXT,
    UNIQUE (plan_version_id, meal_slot_id, position)
);

-- Each row is one option for a plan_item.
-- fixed items have exactly 1 alternate (is_default=TRUE) referencing the food.
-- choice items have 1..N alternates; one is the default suggestion.
-- open_veg alternates (kind='open_veg') reference food_id=NULL; at log time the member
-- picks any vegetable from plan_allowed_vegs for this plan_version.
--
-- IMPORTANT: food_content_version is pinned here at plan creation time.
-- When calculating historical nutrition, always join food_nutrition_versions
-- on (food_id, food_content_version), NOT on foods.id directly.
CREATE TABLE plan_item_alternates (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_item_id         UUID NOT NULL REFERENCES plan_items(id) ON DELETE CASCADE,
    position             INT  NOT NULL,
    kind                 alternate_kind NOT NULL DEFAULT 'specific',
    food_id              UUID REFERENCES foods(id) ON DELETE RESTRICT,
    -- Pinned at plan creation; used for historical nutrition calculations
    food_content_version INT,
    quantity             NUMERIC(8, 2) NOT NULL,
    unit                 unit_type NOT NULL DEFAULT 'g',
    is_default           BOOL NOT NULL DEFAULT FALSE,
    UNIQUE (plan_item_id, position),

    -- specific alternates must reference a food; open_veg alternates must not
    CONSTRAINT alternate_kind_food_consistent CHECK (
        (kind = 'specific'  AND food_id IS NOT NULL AND food_content_version IS NOT NULL) OR
        (kind = 'open_veg'  AND food_id IS NULL      AND food_content_version IS NULL)
    )
);

-- Enforces exactly one default alternate per plan_item (partial unique index)
CREATE UNIQUE INDEX plan_item_single_default_idx
    ON plan_item_alternates (plan_item_id)
    WHERE is_default = TRUE;

-- The list of vegetables the member is permitted to pick for open_veg slots.
-- Corresponds to the "VEGETABLE ALLOWED" sidebar on Vijaya's plan.
-- Per plan_version (nutritionist can change allowed vegs when creating a new version).
CREATE TABLE plan_allowed_vegs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_version_id UUID NOT NULL REFERENCES plan_versions(id) ON DELETE CASCADE,
    food_id         UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    UNIQUE (plan_version_id, food_id)
    -- Category validation enforced via trigger below (validate_allowed_veg_category)
    -- rather than a CHECK constraint, because CHECK constraints on cross-table
    -- conditions are not re-evaluated when the referenced row changes.
);

-- Non-food checklist items: water intake, steps, supplements, habit reminders.
-- is_boolean=TRUE  → done/not-done (e.g. "sent screenshot to nutritionist")
-- is_boolean=FALSE → numeric measurement (e.g. "drank 3.8L water", "walked 4200 steps")
-- For range targets ("3 to 5 litres"), set target_value=3 and target_max_value=5.
CREATE TABLE plan_habits (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_version_id     UUID NOT NULL REFERENCES plan_versions(id) ON DELETE CASCADE,
    position            INT  NOT NULL,
    en_label            TEXT NOT NULL,
    hi_label            TEXT,
    is_boolean          BOOL NOT NULL DEFAULT TRUE,
    target_value        NUMERIC(10, 2),   -- minimum or exact target
    target_max_value    NUMERIC(10, 2),   -- NULL unless range (e.g. 5 for "3–5 litres")
    target_unit         TEXT,             -- 'litres', 'steps', 'glasses', etc.
    UNIQUE (plan_version_id, position),

    CONSTRAINT habit_target_required_for_numeric CHECK (
        is_boolean = TRUE OR
        (is_boolean = FALSE AND target_value IS NOT NULL AND target_unit IS NOT NULL)
    ),
    CONSTRAINT habit_range_valid CHECK (
        target_max_value IS NULL OR target_max_value >= target_value
    )
);

-- ---------------------------------------------------------------------------
-- Log Model
-- ---------------------------------------------------------------------------

-- One row per day a member has interacted with the app.
-- plan_version_id is SET AT FIRST TICK TIME and never changes for that day.
-- A mid-day plan republish does not affect the current day's log.
-- log_date is computed as (NOW() AT TIME ZONE members.timezone)::DATE at write time;
-- it is stored, not re-derived on read.
CREATE TABLE daily_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id       UUID NOT NULL REFERENCES members(id)        ON DELETE RESTRICT,
    plan_version_id UUID NOT NULL REFERENCES plan_versions(id)  ON DELETE RESTRICT,
    log_date        DATE NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (member_id, log_date)
);

-- One row per plan_item per day. Upsert on conflict to handle double-taps and retries.
-- chosen_food_id: the actual food eaten (required when eaten=TRUE for choice/veg items;
--                 NULL for fixed items where the plan food is implied).
-- quantity_eaten_g: gram-level input from kitchen scale; NULL = ate as planned (no deviation recorded).
--                   Members are expected to weigh every item; this captures actual vs. planned.
CREATE TABLE meal_ticks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_id        UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    plan_item_id        UUID NOT NULL REFERENCES plan_items(id) ON DELETE RESTRICT,
    -- For choice/open_veg items: which food was actually selected and eaten
    chosen_food_id      UUID REFERENCES foods(id) ON DELETE RESTRICT,
    eaten               BOOL NOT NULL DEFAULT FALSE,
    -- Actual grams eaten from kitchen scale. NULL means member confirmed but didn't log weight.
    -- Enables "ate 180g instead of planned 200g" precision tracking.
    quantity_eaten_g    NUMERIC(8, 2),
    ticked_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (daily_log_id, plan_item_id)
);

-- One row per plan_habit per day. Upsert on conflict.
-- For boolean habits: done=TRUE/FALSE, value/value_unit NULL.
-- For numeric habits: done derived from value >= target_value; value and value_unit set.
CREATE TABLE habit_ticks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_id    UUID NOT NULL REFERENCES daily_logs(id)     ON DELETE CASCADE,
    plan_habit_id   UUID NOT NULL REFERENCES plan_habits(id)    ON DELETE RESTRICT,
    done            BOOL NOT NULL DEFAULT FALSE,
    value           NUMERIC(10, 2),  -- actual measured value (e.g. 3.8 for 3.8 litres)
    value_unit      TEXT,            -- should match plan_habits.target_unit
    ticked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (daily_log_id, plan_habit_id)
);

-- ---------------------------------------------------------------------------
-- Weight Readings
-- ---------------------------------------------------------------------------

-- Raw output from scale PDF/photo vision extraction.
-- Created when a file is uploaded; stays in 'pending' until user confirms.
-- Re-extraction: create a new row with status='pending'; the confirmed
-- weight_reading row is preserved until explicitly superseded.
CREATE TABLE scale_extractions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id               UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    source_file_url         TEXT NOT NULL,
    status                  extraction_status NOT NULL DEFAULT 'pending',
    raw_extraction_json     JSONB,      -- raw LLM/vision model output
    extracted_values        JSONB,      -- parsed key-value pairs pre-confirmation
    confirmed_at            TIMESTAMPTZ,
    confirmed_by_user_id    UUID,       -- clinic staff who confirmed
    confirmed_by_member_id  UUID REFERENCES members(id) ON DELETE SET NULL,  -- family admin who confirmed
    uploaded_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UNIQUE on (member_id, reading_date): two admins entering the same day's reading
-- should resolve to one record, not create a doubled chart point.
-- Use ON CONFLICT (member_id, reading_date) DO UPDATE for idempotent entry.
CREATE TABLE weight_readings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id               UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    reading_date            DATE NOT NULL,
    weight_kg               NUMERIC(6, 2) NOT NULL,
    -- Body composition (from smart scale / Fitelo / Tanita / Omron reports)
    fat_mass_kg             NUMERIC(6, 2),   -- total fat in kg (e.g. 45.7 kg)
    lean_mass_kg            NUMERIC(6, 2),   -- lean mass in kg = weight - fat (e.g. 49.5 kg)
    muscle_mass_kg          NUMERIC(6, 2),   -- skeletal muscle mass (subset of lean mass)
    bone_mass_kg            NUMERIC(5, 2),
    -- Fat distribution
    body_fat_pct            NUMERIC(5, 2),   -- total body fat as % of weight (e.g. 48%)
    subcutaneous_fat_pct    NUMERIC(5, 2),   -- fat beneath skin as % (e.g. 44%) — reported separately by Fitelo/Tanita
    visceral_fat            NUMERIC(5, 1),   -- visceral fat index (e.g. 13, unitless scale 1–59)
    -- Metabolic indicators
    bmr_kcal                NUMERIC(7, 1),
    protein_pct             NUMERIC(5, 2),
    metabolic_age           INT,
    bmi                     NUMERIC(5, 2),
    note                    TEXT,
    -- Links this reading to its extraction row; NULL for manually entered readings.
    -- Never store source_file_url directly here; it lives on scale_extractions.
    scale_extraction_id     UUID REFERENCES scale_extractions(id) ON DELETE SET NULL,
    entered_by_user_id      UUID,       -- clinic staff
    entered_by_member_id    UUID REFERENCES members(id) ON DELETE SET NULL,  -- family admin
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (member_id, reading_date)
);

-- ---------------------------------------------------------------------------
-- Audit Trail
-- (DPDP Act 2023 compliance deferred; audit trail is required regardless
--  for investigation of plan changes, weight entry disputes, billing questions)
-- ---------------------------------------------------------------------------

CREATE TABLE audit_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name      TEXT NOT NULL,
    row_id          UUID NOT NULL,
    action          TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data        JSONB,
    new_data        JSONB,
    actor_user_id   UUID,       -- Supabase Auth user (clinic staff)
    actor_member_id UUID,       -- PIN-auth member (family admin / patient)
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Tenancy / lookup
CREATE INDEX idx_households_clinic          ON households (clinic_id);
CREATE INDEX idx_members_household          ON members (household_id);
CREATE INDEX idx_members_auth_user          ON members (auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX idx_clinic_members_user        ON clinic_members (user_id);
CREATE INDEX idx_clinic_members_clinic      ON clinic_members (clinic_id);

-- Plan hierarchy
CREATE INDEX idx_plan_versions_member       ON plan_versions (member_id);
CREATE INDEX idx_plan_versions_clinic       ON plan_versions (clinic_id) WHERE clinic_id IS NOT NULL;
CREATE INDEX idx_plan_versions_status       ON plan_versions (member_id, status);
CREATE INDEX idx_meal_slots_version         ON meal_slots (plan_version_id);
CREATE INDEX idx_plan_items_version         ON plan_items (plan_version_id);
CREATE INDEX idx_plan_items_slot            ON plan_items (meal_slot_id);
CREATE INDEX idx_plan_item_alts_item        ON plan_item_alternates (plan_item_id);
CREATE INDEX idx_plan_item_alts_food        ON plan_item_alternates (food_id) WHERE food_id IS NOT NULL;
CREATE INDEX idx_plan_habits_version        ON plan_habits (plan_version_id);
CREATE INDEX idx_plan_allowed_vegs_version  ON plan_allowed_vegs (plan_version_id);

-- Logs (critical for adherence queries and RLS subqueries)
CREATE INDEX idx_daily_logs_member          ON daily_logs (member_id);
CREATE INDEX idx_daily_logs_date            ON daily_logs (member_id, log_date DESC);
CREATE INDEX idx_daily_logs_plan_version    ON daily_logs (plan_version_id);
CREATE INDEX idx_meal_ticks_log             ON meal_ticks (daily_log_id);
CREATE INDEX idx_habit_ticks_log            ON habit_ticks (daily_log_id);

-- Weight
CREATE INDEX idx_weight_readings_member     ON weight_readings (member_id, reading_date DESC);
CREATE INDEX idx_scale_extractions_member   ON scale_extractions (member_id, uploaded_at DESC);

-- Foods
CREATE INDEX idx_foods_category             ON foods (category);
CREATE INDEX idx_foods_en_name              ON foods (en_name);
CREATE INDEX idx_food_aliases_name          ON food_aliases (alias_name);
CREATE INDEX idx_food_aliases_food          ON food_aliases (food_id);

-- Audit
CREATE INDEX idx_audit_events_table_row     ON audit_events (table_name, row_id);
CREATE INDEX idx_audit_events_occurred      ON audit_events (occurred_at DESC);
CREATE INDEX idx_audit_events_actor         ON audit_events (actor_member_id) WHERE actor_member_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

-- Returns the PIN-authenticated member_id from session config.
-- Set this via: set_config('app.current_member_id', member_id::text, true)
-- in your PIN validation server function before any data queries.
-- Returns NULL when not set (unauthenticated or clinic-auth session).
CREATE OR REPLACE FUNCTION current_member_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT NULLIF(current_setting('app.current_member_id', true), '')::uuid;
$$;

-- Returns true when the session member is a family admin
CREATE OR REPLACE FUNCTION session_is_family_admin()
RETURNS BOOL
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT COALESCE(
        (SELECT is_family_admin FROM members WHERE id = current_member_id()),
        FALSE
    );
$$;

-- Returns the household_id of the session member
CREATE OR REPLACE FUNCTION session_household_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT household_id FROM members WHERE id = current_member_id();
$$;

-- Returns the clinic_id of the authenticated Supabase Auth user (nutritionist/staff)
CREATE OR REPLACE FUNCTION session_clinic_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- 1. updated_at maintenance
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER clinics_updated_at
    BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER households_updated_at
    BEFORE UPDATE ON households FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER members_updated_at
    BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER foods_updated_at
    BEFORE UPDATE ON foods FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. Nutrition snapshot: when content_version is incremented on foods,
--    archive the PREVIOUS values into food_nutrition_versions before the update applies.
--    This preserves the snapshot for any plan_item_alternates that pinned the old version.
CREATE OR REPLACE FUNCTION snapshot_food_nutrition()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.content_version <> OLD.content_version THEN
        IF NEW.content_version != OLD.content_version + 1 THEN
            RAISE EXCEPTION 'content_version must increment by exactly 1 (was %, new %)',
                OLD.content_version, NEW.content_version;
        END IF;
        INSERT INTO food_nutrition_versions (
            food_id, content_version,
            cal, protein_g, carbs_g, fat_g, fiber_g,
            iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg,
            zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
            thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug
        ) VALUES (
            OLD.id, OLD.content_version,
            OLD.cal, OLD.protein_g, OLD.carbs_g, OLD.fat_g, OLD.fiber_g,
            OLD.iron_mg, OLD.calcium_mg, OLD.magnesium_mg, OLD.phosphorus_mg, OLD.potassium_mg, OLD.sodium_mg,
            OLD.zinc_mg, OLD.vit_a_ug, OLD.vit_c_mg, OLD.vit_d_ug, OLD.vit_e_mg, OLD.vit_k_ug,
            OLD.thiamin_mg, OLD.riboflavin_mg, OLD.niacin_mg, OLD.vit_b6_mg, OLD.folate_ug, OLD.vit_b12_ug
        )
        ON CONFLICT (food_id, content_version) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER foods_snapshot_nutrition
    BEFORE UPDATE ON foods
    FOR EACH ROW EXECUTE FUNCTION snapshot_food_nutrition();

-- 2b. On initial INSERT, immediately create the v1 snapshot in food_nutrition_versions.
--     The UPDATE trigger above only fires when content_version is incremented.
--     Without this, plan_item_alternates pinned at content_version=1 would find no
--     matching row in food_nutrition_versions and historical calorie queries would fail.
CREATE OR REPLACE FUNCTION snapshot_food_nutrition_on_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO food_nutrition_versions (
        food_id, content_version,
        cal, protein_g, carbs_g, fat_g, fiber_g,
        iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg,
        zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
        thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug
    ) VALUES (
        NEW.id, NEW.content_version,
        NEW.cal, NEW.protein_g, NEW.carbs_g, NEW.fat_g, NEW.fiber_g,
        NEW.iron_mg, NEW.calcium_mg, NEW.magnesium_mg, NEW.phosphorus_mg, NEW.potassium_mg, NEW.sodium_mg,
        NEW.zinc_mg, NEW.vit_a_ug, NEW.vit_c_mg, NEW.vit_d_ug, NEW.vit_e_mg, NEW.vit_k_ug,
        NEW.thiamin_mg, NEW.riboflavin_mg, NEW.niacin_mg, NEW.vit_b6_mg, NEW.folate_ug, NEW.vit_b12_ug
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER foods_snapshot_on_insert
    AFTER INSERT ON foods
    FOR EACH ROW EXECUTE FUNCTION snapshot_food_nutrition_on_insert();

-- 3. Plan version immutability: block structural changes to plan_items,
--    meal_slots, plan_item_alternates, plan_habits, and plan_allowed_vegs
--    once the plan_version is no longer in 'draft' status.
--    Nutritionists must clone to a new draft to make structural changes.
--    (The `note` column on plan_versions is always editable — cosmetic only.)
CREATE OR REPLACE FUNCTION guard_plan_structure_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_version_id UUID;
    v_status     plan_version_status;
    v_row        JSONB;
BEGIN
    -- Field access via to_jsonb(): PL/pgSQL resolves NEW.<col> at parse time,
    -- not lazily inside CASE branches. Direct references like NEW.plan_item_id
    -- would fail when the trigger fires on a table (e.g. meal_slots) that has
    -- no such column, even though that CASE branch isn't taken. JSON extraction
    -- is dynamic and works uniformly across all trigger tables.
    v_row := to_jsonb(COALESCE(NEW, OLD));

    v_version_id := CASE TG_TABLE_NAME
        WHEN 'meal_slots'            THEN (v_row ->> 'plan_version_id')::UUID
        WHEN 'plan_items'            THEN (v_row ->> 'plan_version_id')::UUID
        WHEN 'plan_habits'           THEN (v_row ->> 'plan_version_id')::UUID
        WHEN 'plan_allowed_vegs'     THEN (v_row ->> 'plan_version_id')::UUID
        WHEN 'plan_item_alternates'  THEN (
            SELECT plan_version_id FROM plan_items
            WHERE id = (v_row ->> 'plan_item_id')::UUID
        )
    END;

    SELECT status INTO v_status FROM plan_versions WHERE id = v_version_id;

    IF v_status IS DISTINCT FROM 'draft' THEN
        RAISE EXCEPTION
            'Cannot modify % on a % plan version. Clone to a new draft first.',
            TG_TABLE_NAME, v_status;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER meal_slots_immutability
    BEFORE INSERT OR UPDATE OR DELETE ON meal_slots
    FOR EACH ROW EXECUTE FUNCTION guard_plan_structure_immutable();

CREATE TRIGGER plan_items_immutability
    BEFORE INSERT OR UPDATE OR DELETE ON plan_items
    FOR EACH ROW EXECUTE FUNCTION guard_plan_structure_immutable();

CREATE TRIGGER plan_item_alts_immutability
    BEFORE INSERT OR UPDATE OR DELETE ON plan_item_alternates
    FOR EACH ROW EXECUTE FUNCTION guard_plan_structure_immutable();

CREATE TRIGGER plan_habits_immutability
    BEFORE INSERT OR UPDATE OR DELETE ON plan_habits
    FOR EACH ROW EXECUTE FUNCTION guard_plan_structure_immutable();

CREATE TRIGGER plan_allowed_vegs_immutability
    BEFORE INSERT OR UPDATE OR DELETE ON plan_allowed_vegs
    FOR EACH ROW EXECUTE FUNCTION guard_plan_structure_immutable();

-- 3b. Validate that only vegetable-category foods are added to plan_allowed_vegs.
--     Done as a trigger (not a CHECK constraint) so the check re-runs
--     whenever the plan_allowed_vegs row is modified.
CREATE OR REPLACE FUNCTION validate_allowed_veg_category()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_category food_category;
BEGIN
    SELECT category INTO v_category FROM foods WHERE id = NEW.food_id;
    IF v_category IS DISTINCT FROM 'vegetable' THEN
        RAISE EXCEPTION
            'food_id % cannot be added to plan_allowed_vegs: category is %, expected ''vegetable''',
            NEW.food_id, v_category;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER plan_allowed_vegs_validate_category
    BEFORE INSERT OR UPDATE ON plan_allowed_vegs
    FOR EACH ROW EXECUTE FUNCTION validate_allowed_veg_category();

-- 4. When a plan_version is published (draft → active), set published_at
--    and supersede the previous active version for the same member.
CREATE OR REPLACE FUNCTION on_plan_version_publish()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Only act when status changes to 'active'
    IF OLD.status = 'draft' AND NEW.status = 'active' THEN
        -- Timestamp the publish event
        NEW.published_at = NOW();

        -- Supersede the currently active version for this member
        UPDATE plan_versions
        SET status = 'superseded'
        WHERE member_id = NEW.member_id
          AND id        <> NEW.id
          AND status    = 'active';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER plan_version_publish
    BEFORE UPDATE ON plan_versions
    FOR EACH ROW EXECUTE FUNCTION on_plan_version_publish();

-- 5. Audit triggers (generic: captures before/after as JSONB)
CREATE OR REPLACE FUNCTION write_audit_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO audit_events (
        table_name, row_id, action, old_data, new_data,
        actor_user_id, actor_member_id
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END,
        auth.uid(),
        current_member_id()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Audit on the tables that matter for accountability
CREATE TRIGGER audit_plan_versions
    AFTER INSERT OR UPDATE OR DELETE ON plan_versions
    FOR EACH ROW EXECUTE FUNCTION write_audit_event();
CREATE TRIGGER audit_plan_items
    AFTER INSERT OR UPDATE OR DELETE ON plan_items
    FOR EACH ROW EXECUTE FUNCTION write_audit_event();
CREATE TRIGGER audit_weight_readings
    AFTER INSERT OR UPDATE OR DELETE ON weight_readings
    FOR EACH ROW EXECUTE FUNCTION write_audit_event();
CREATE TRIGGER audit_members
    AFTER INSERT OR UPDATE OR DELETE ON members
    FOR EACH ROW EXECUTE FUNCTION write_audit_event();
CREATE TRIGGER audit_households
    AFTER INSERT OR UPDATE OR DELETE ON households
    FOR EACH ROW EXECUTE FUNCTION write_audit_event();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE clinics                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE households              ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_clinic_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE members                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_aliases            ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_clinic_overrides   ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_nutrition_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE serving_units           ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_versions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_slots              ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_items              ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_item_alternates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_allowed_vegs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_habits             ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_ticks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_ticks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_readings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE scale_extractions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events            ENABLE ROW LEVEL SECURITY;

-- ── Members ──────────────────────────────────────────────────────────────────
-- A member can see themselves.
-- A family admin can see all members in their household.
-- A clinic member can see all members in households belonging to their clinic.
CREATE POLICY members_select ON members FOR SELECT USING (
    id = current_member_id()
    OR (session_is_family_admin() AND household_id = session_household_id())
    OR household_id IN (
        SELECT h.id FROM households h
        INNER JOIN clinic_members cm ON cm.clinic_id = h.clinic_id
        WHERE cm.user_id = auth.uid()
    )
);

CREATE POLICY members_update_self ON members FOR UPDATE
    USING (id = current_member_id());

CREATE POLICY members_family_admin_update ON members FOR UPDATE
    USING (session_is_family_admin() AND household_id = session_household_id());

-- ── Daily Logs ───────────────────────────────────────────────────────────────
-- Patient: own logs only.
-- Family admin: all logs for members in their household.
-- Nutritionist: logs for members in their clinic's households.
CREATE POLICY daily_logs_select ON daily_logs FOR SELECT USING (
    member_id = current_member_id()
    OR (session_is_family_admin() AND member_id IN (
        SELECT id FROM members WHERE household_id = session_household_id()
    ))
    OR member_id IN (
        SELECT m.id FROM members m
        INNER JOIN households h ON h.id = m.household_id
        INNER JOIN clinic_members cm ON cm.clinic_id = h.clinic_id
        WHERE cm.user_id = auth.uid()
    )
);

CREATE POLICY daily_logs_insert ON daily_logs FOR INSERT WITH CHECK (
    member_id = current_member_id()
    OR (session_is_family_admin() AND member_id IN (
        SELECT id FROM members WHERE household_id = session_household_id()
    ))
);

-- ── Meal Ticks ───────────────────────────────────────────────────────────────
-- Access follows the parent daily_log's member.
CREATE POLICY meal_ticks_select ON meal_ticks FOR SELECT USING (
    daily_log_id IN (SELECT id FROM daily_logs)
);

CREATE POLICY meal_ticks_write ON meal_ticks FOR ALL WITH CHECK (
    daily_log_id IN (
        SELECT id FROM daily_logs
        WHERE member_id = current_member_id()
           OR (session_is_family_admin() AND member_id IN (
               SELECT id FROM members WHERE household_id = session_household_id()
           ))
    )
);

-- ── Habit Ticks ──────────────────────────────────────────────────────────────
CREATE POLICY habit_ticks_select ON habit_ticks FOR SELECT USING (
    daily_log_id IN (SELECT id FROM daily_logs)
);

CREATE POLICY habit_ticks_write ON habit_ticks FOR ALL WITH CHECK (
    daily_log_id IN (
        SELECT id FROM daily_logs
        WHERE member_id = current_member_id()
           OR (session_is_family_admin() AND member_id IN (
               SELECT id FROM members WHERE household_id = session_household_id()
           ))
    )
);

-- ── Plan Versions ─────────────────────────────────────────────────────────────
-- Members see their own plans.
-- Family admins see plans for all members in their household.
-- Clinic members see plans they authored (clinic_id match), regardless of current household assignment.
CREATE POLICY plan_versions_select ON plan_versions FOR SELECT USING (
    member_id = current_member_id()
    OR (session_is_family_admin() AND member_id IN (
        SELECT id FROM members WHERE household_id = session_household_id()
    ))
    OR clinic_id IN (
        SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid()
    )
);

-- Only clinic staff (via Supabase Auth) or the authoring family admin can insert/update plan structures
CREATE POLICY plan_versions_write ON plan_versions FOR INSERT WITH CHECK (
    authored_by_user_id = auth.uid()
    OR authored_by_member_id = current_member_id()
);

-- ── Plan sub-tables: follow parent plan_version access ───────────────────────
CREATE POLICY meal_slots_select ON meal_slots FOR SELECT USING (
    plan_version_id IN (SELECT id FROM plan_versions)
);
CREATE POLICY plan_items_select ON plan_items FOR SELECT USING (
    plan_version_id IN (SELECT id FROM plan_versions)
);
CREATE POLICY plan_item_alts_select ON plan_item_alternates FOR SELECT USING (
    plan_item_id IN (SELECT id FROM plan_items)
);
CREATE POLICY plan_allowed_vegs_select ON plan_allowed_vegs FOR SELECT USING (
    plan_version_id IN (SELECT id FROM plan_versions)
);
CREATE POLICY plan_habits_select ON plan_habits FOR SELECT USING (
    plan_version_id IN (SELECT id FROM plan_versions)
);

-- ── Weight Readings ──────────────────────────────────────────────────────────
CREATE POLICY weight_readings_select ON weight_readings FOR SELECT USING (
    member_id = current_member_id()
    OR (session_is_family_admin() AND member_id IN (
        SELECT id FROM members WHERE household_id = session_household_id()
    ))
    OR member_id IN (
        SELECT m.id FROM members m
        INNER JOIN households h ON h.id = m.household_id
        INNER JOIN clinic_members cm ON cm.clinic_id = h.clinic_id
        WHERE cm.user_id = auth.uid()
    )
);

CREATE POLICY weight_readings_write ON weight_readings FOR ALL WITH CHECK (
    member_id = current_member_id()
    OR (session_is_family_admin() AND member_id IN (
        SELECT id FROM members WHERE household_id = session_household_id()
    ))
    OR member_id IN (
        SELECT m.id FROM members m
        INNER JOIN households h ON h.id = m.household_id
        INNER JOIN clinic_members cm ON cm.clinic_id = h.clinic_id
        WHERE cm.user_id = auth.uid()
    )
);

-- ── Scale Extractions ────────────────────────────────────────────────────────
CREATE POLICY scale_extractions_select ON scale_extractions FOR SELECT USING (
    member_id = current_member_id()
    OR (session_is_family_admin() AND member_id IN (
        SELECT id FROM members WHERE household_id = session_household_id()
    ))
    OR member_id IN (
        SELECT m.id FROM members m
        INNER JOIN households h ON h.id = m.household_id
        INNER JOIN clinic_members cm ON cm.clinic_id = h.clinic_id
        WHERE cm.user_id = auth.uid()
    )
);

-- ── Foods ─────────────────────────────────────────────────────────────────────
-- All authenticated users (PIN or Supabase Auth) can read global foods.
-- Only super-admin (clinic owner with no scoped household) can insert/update global foods.
CREATE POLICY foods_select ON foods FOR SELECT USING (
    current_member_id() IS NOT NULL OR auth.uid() IS NOT NULL
);

CREATE POLICY foods_insert_superadmin ON foods FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM clinic_members WHERE user_id = auth.uid() AND role = 'owner'
    )
);

CREATE POLICY foods_update_superadmin ON foods FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM clinic_members WHERE user_id = auth.uid() AND role = 'owner'
    )
);

-- food_nutrition_versions: readable by anyone who can read foods
CREATE POLICY food_nutrition_versions_select ON food_nutrition_versions FOR SELECT USING (
    current_member_id() IS NOT NULL OR auth.uid() IS NOT NULL
);

-- food_aliases: readable by same rules as foods
CREATE POLICY food_aliases_select ON food_aliases FOR SELECT USING (
    current_member_id() IS NOT NULL OR auth.uid() IS NOT NULL
);
CREATE POLICY food_aliases_write ON food_aliases FOR ALL WITH CHECK (
    EXISTS (SELECT 1 FROM clinic_members WHERE user_id = auth.uid() AND role IN ('owner', 'nutritionist', 'staff'))
);

-- food_clinic_overrides: readable/writable by the owning clinic
CREATE POLICY food_clinic_overrides_select ON food_clinic_overrides FOR SELECT USING (
    clinic_id IN (SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid())
);
CREATE POLICY food_clinic_overrides_write ON food_clinic_overrides FOR ALL WITH CHECK (
    clinic_id IN (SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid())
);

-- serving_units: readable by all authenticated users, managed by super-admin
CREATE POLICY serving_units_select ON serving_units FOR SELECT USING (
    current_member_id() IS NOT NULL OR auth.uid() IS NOT NULL
);

-- ── Audit Events ──────────────────────────────────────────────────────────────
-- Only clinic owners and nutritionists can read audit events.
-- Members cannot read audit events (privacy: don't expose who else changed things).
CREATE POLICY audit_events_select ON audit_events FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM clinic_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'nutritionist')
    )
);

-- ── Households ────────────────────────────────────────────────────────────────
CREATE POLICY households_select ON households FOR SELECT USING (
    id = session_household_id()
    OR id IN (
        SELECT h.id FROM households h
        INNER JOIN clinic_members cm ON cm.clinic_id = h.clinic_id
        WHERE cm.user_id = auth.uid()
    )
);

-- ---------------------------------------------------------------------------
-- Seed: Default serving units (Indian household measures)
-- ---------------------------------------------------------------------------

INSERT INTO serving_units (name, food_category, grams_per_unit) VALUES
    ('katori',          NULL,           150.00),
    ('wati',            NULL,           120.00),
    ('glass',           'beverage',     240.00),
    ('glass',           NULL,           200.00),
    ('cup',             NULL,           240.00),
    ('medium bowl',     NULL,           300.00),
    ('large bowl',      NULL,           450.00),
    ('tsp',             'spice',        3.00),
    ('tsp',             NULL,           5.00),
    ('tbsp',            NULL,           15.00),
    ('chamach',         NULL,           5.00),   -- same as tsp; alternate Hindi term used in plans
    ('piece',           'fruit',        100.00), -- default; override via foods.piece_grams
    ('slice',           NULL,           25.00);
