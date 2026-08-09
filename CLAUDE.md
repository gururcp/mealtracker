# Meal-Tracker — Claude Code Context

## What this project is
Multi-tenant SaaS diet + weight tracker built for nutrition clinics.
Stack: Next.js + Tailwind (frontend), Supabase (Postgres + Auth + RLS + Storage), Vercel (hosting).
Owner: Gaurav Choudhari (IBM / LightHouse).

---

## Session log

### 2026-08-08 — Schema phase COMPLETE
**Status: Ready for UI design. Do not re-open schema discussions unless a new product requirement surfaces.**

Work completed this session:
1. Full adversarial schema review (19-point interrogation) — all gaps identified and fixed.
2. Migration 1 written: `20260808000000_initial_schema.sql` — complete schema (~1100 lines).
3. Migration 2 written: `20260808000001_seed_food_master.sql` — 40 foods + ~140 aliases.
4. Codebase memory indexed + ADR written.
5. This CLAUDE.md created.

Real member used as design reference (identifying details redacted — reference material is gitignored locally).
- Baseline weight reading captured via Fitelo Smart Scale: weight_kg, fat_mass_kg, lean_mass_kg, subcutaneous_fat_pct — informs `weight_readings` column choice.
- Two physical plan versions on file (V1 = 3 meals, V2 = updated quantities + new foods: turai, tendli, methi pattiyaan, masoor dal).

---

## Migration files (both finalised — do not re-create)

| File | Purpose | Lines |
|------|---------|-------|
| `supabase/migrations/20260808000000_initial_schema.sql` | Full schema: enums, tables, indexes, triggers, RLS, helper functions | ~1100 |
| `supabase/migrations/20260808000001_seed_food_master.sql` | 40 foods (24 micronutrients each) + ~140 food aliases | ~500 |

Reference images (physical plans from nutritionist) are stored locally and gitignored — see `.gitignore`. Not committed to the repo because they contain a real member's plan.

---

## Architecture summary (load full ADR with `manage_adr(mode='get')`)

### Tenancy
Clinic → Household → Member.
Staff roles on `clinic_staff`: owner, nutritionist, staff.
`households.billing_status`: trialing / active / past_due / canceled / paused.

### Auth (two-phase)
- V0.1: `members.pin_hash` set, `auth_user_id` NULL. RLS works via `set_config('app.current_member_id', …)` + `current_setting()` because `auth.uid()` is NULL for PIN sessions.
- V0.2: Supabase Auth. `auth_user_id` populated. Both columns nullable; CHECK: `pin_hash IS NOT NULL OR auth_user_id IS NOT NULL`.
- RLS helpers: `current_member_id()`, `session_is_family_admin()`, `session_household_id()`, `session_clinic_id()`.

### Plan versioning
- Status ENUM: draft → active → superseded.
- Trigger `guard_plan_structure_immutable` blocks edits to meal_slots / plan_items / plan_item_alternates / plan_habits / plan_allowed_vegs when status != 'draft'.
- Trigger `on_plan_version_publish`: draft→active sets published_at, supersedes previous active version.
- Plans named by date (YYYY-MM-DD), not V1/V2.

### Meal slots
`meal_slots` table (not ENUM) — each plan version defines its own slots. Supports 3-meal standard or 5-6 meal diabetic/athlete structures without a schema change.

### Food master
- Global `foods` table — no `clinic_id`/`member_id`. All clinic staff share one master; no re-entry per member.
- `food_aliases(food_id, alias_name, language)` — UNIQUE(alias_name, language). Handles palak/spinach/saag, karela/bitter gourd, kakadi/kheera/cucumber etc.
- UI must enforce search-before-create: type a name → search `foods.en_name` + `food_aliases.alias_name` → surface existing match → only allow "Add new food" if no match found.
- V0.3: add pgvector embedding column to `foods` for semantic search.
- V0.4: `food_merge_suggestions` table for LLM-queued deduplication review.

### Nutrition history integrity
- `foods.content_version` (integer) increments on each nutrition data update.
- `food_nutrition_versions` snapshots the full row at each content_version.
- `plan_item_alternates.food_content_version` pins each plan item to the version when the plan was drafted.
- Two triggers: `snapshot_food_nutrition` (BEFORE UPDATE, fires on content_version increment) + `snapshot_food_nutrition_on_insert` (AFTER INSERT, creates mandatory v1 snapshot).

### Plan items
- `plan_item_kind`: `fixed` | `choice`. Paneer/soya are protein choices, not vegetables.
- `plan_item_alternates`: one default (partial unique index: `WHERE is_default = TRUE`), N alternatives.
- `alternate_kind`: `specific` (food_id required) | `open_veg` (food_id NULL — member picks any vegetable from the plan's allowed list).
- `plan_allowed_vegs`: per-plan-version allowed vegetable list from the physical plan sidebar.
- Trigger `validate_allowed_veg_category`: blocks non-vegetable foods from `plan_allowed_vegs`.
- IFCT 2017 classification: onion, ginger, garlic, green chilli are category=`'vegetable'` (Vegetables chapter) — correct for `plan_allowed_vegs`.

### Weight readings
Columns on `weight_readings`: `weight_kg`, `fat_mass_kg`, `lean_mass_kg`, `subcutaneous_fat_pct`. BMI, body fat %, visceral fat, BMR, metabolic age are derived at query time — not stored.

### Daily logs
`daily_logs.plan_version_id` pins each log day to a specific plan version — prevents cross-version tick contamination ("floating log" problem).

### Units
ENUM: `g, ml, piece, tsp, tbsp`. Kitchen scale gram input is the norm. piece/tsp/tbsp used for: almonds, coffee, isabgol, ginger (tsp), garlic (piece), ghee/oil (tsp/tbsp).

### Billing
Stripe subscription; quantity = active_member_count. `households.billing_status` updated via Stripe webhooks.

### Audit
`audit_events` table + `write_audit_event()` Postgres function called by triggers on all write operations.

---

## Locked decisions (with rationale — do not re-litigate)

| # | Decision | Why locked |
|---|----------|-----------|
| 1 | Global food master (no clinic scoping) | Staff asked "why re-enter palak for every member?" — sharing one master solves this entirely |
| 2 | food_aliases table, LLM deferred to V0.3 | Handles palak/spinach/saag immediately without infra cost; LLM/pgvector is a scaling improvement, not a blocker |
| 3 | Two nutrition snapshot triggers (INSERT + UPDATE) | UPDATE-only trigger left content_version=1 with no snapshot; historical calorie queries against pinned plan items would find no row — bug caught and fixed |
| 4 | validate_allowed_veg_category as trigger, not CHECK | Cross-table CHECK constraints in Postgres are unreliable (not re-evaluated on referenced row change); trigger is the correct pattern |
| 5 | Onion/ginger/garlic/green chilli = category 'vegetable' | IFCT 2017 classifies them in the Vegetables chapter; setting them as 'spice' would block them from plan_allowed_vegs (trigger would reject the insert) |
| 6 | meal_slots table not ENUM | ENUM requires a migration for each new meal type; diabetic/athlete plans routinely need 5-6 meals; table approach costs nothing extra |
| 7 | plan_item_kind 'fixed'/'choice' (no 'veg_slot') | Paneer and soya are protein choices, not vegetables — 'veg_slot' was a naming confusion from early design |
| 8 | daily_logs.plan_version_id pinning | Without pinning, changing a member's active plan retroactively "moves" old log ticks to the new plan's structure — corrupts completion rates |
| 9 | Plan naming by date | Nutritionist told member "V2 plan"; member confused about which is current — date names are self-evident to both parties |
| 10 | DPDP Act deferred | Owner's explicit instruction: implement when substantial paid subscriptions exist |
| 11 | Weight body-composition columns on weight_readings | Fitelo Smart Scale outputs fat_mass_kg, lean_mass_kg, subcutaneous_fat_pct directly — storing these avoids recalculation from percentages and matches what the hardware exports |
| 12 | plan_items.note TEXT column | Physical plans have preparation notes inline (e.g., "isabgol + namak + nimbu + 1 glass paani") — needed for staff to encode these |

---

## Bugs caught and fixed during schema review (do not re-introduce)

1. **CHECK constraint on cross-table reference** — `plan_allowed_vegs` originally had `CHECK (EXISTS (SELECT 1 FROM foods …))`. This is unreliable in Postgres; replaced with trigger.
2. **Missing v1 nutrition snapshot** — only an UPDATE trigger meant first-insert foods had no snapshot at content_version=1. Fixed by adding AFTER INSERT trigger.
3. **Adarak/lehsun/mirchi as 'spice'** — initial seed had category='spice'; this caused the veg-category trigger to block them from `plan_allowed_vegs`. Fixed to category='vegetable' per IFCT 2017.
4. **No `plan_item_single_default_idx`** — without the partial unique index on `plan_item_alternates (plan_item_id) WHERE is_default = TRUE`, multiple defaults per plan item were possible. Index added.

---

## Food master completeness

All foods appearing in both V1 (06/07/2026) and V2 (08/08/2026) physical plans are seeded.
40 foods total. Nutrition values from:
- IFCT 2017 (NIN Hyderabad) — all Indian vegetables, pulses, spices
- USDA FoodData Central — items IFCT doesn't cover well
- Manual (product label) — Patanjali Amla Juice, Patanjali Aloe Vera Juice

New foods added for V2 (not in V1): turai (ridge gourd), dhemsai/tendli (ivy gourd), methi pattiyaan (fresh fenugreek leaves), masoor dal (red lentils).

---

## Phasing

| Phase | Scope |
|-------|-------|
| V0.1 | PIN auth · plan builder · meal logging · weight logging · food search |
| V0.2 | Supabase Auth migration · family admin portal · member-facing app |
| V0.3 | pgvector embeddings on foods · semantic food search UI |
| V0.4 | LLM food deduplication queue (`food_merge_suggestions` table) |
| V0.5 | DPDP Act compliance (data export, consent, retention policies) |

---

## Next session: UI design

**Start here.** Schema is done. Do not re-open schema unless a new product requirement is raised.

### Nutritionist portal (build first)
1. Plan builder
   - Create plan version for a member (name = date, e.g., "2026-08-08")
   - Add meal slots (breakfast, lunch, dinner; or more for diabetics)
   - Add plan items per slot: fixed or choice
   - For choice items: add alternates (specific food or open_veg)
   - Add plan_allowed_vegs list (the sidebar vegetable list from physical plans)
   - Publish plan (draft → active; previous active auto-superseded)
2. Food search with alias-aware search-before-create
   - Search box queries `foods.en_name`, `foods.hi_name`, AND `food_aliases.alias_name` (ILIKE or full-text)
   - Staff types "palak" → surfaces "Spinach (Palak)" — no duplicate entry
   - "Add new food" button only appears if no match found
3. Member management: create household, add members, assign plans
4. Weight log entry (with body composition fields from smart scale)

### Member portal (build second)
1. View today's plan (slots + items + alternates)
2. Log meals: tick items, enter gram weights, pick open_veg from allowed list
3. View nutrition summary for the day (calculated from logged entries + food master)
4. Log weight reading (+ optional body composition)
5. View progress (weight trend, body fat trend)

### Key UI rules carried from schema design
- Food search must always show alias-matched results, not just en_name matches.
- Plan items with `plan_item_kind = 'choice'` show alternates picker (not just the default).
- `open_veg` alternates show a dropdown filtered to `plan_allowed_vegs` for that plan version.
- Gram input is primary; piece/tsp/tbsp shown only for foods where those columns are set.
- Weight readings: show fat_mass_kg and lean_mass_kg fields (match Fitelo Smart Scale output labels).
