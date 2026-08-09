# Meal-Tracker

Multi-tenant SaaS diet + weight tracker built for nutrition clinics.

**Stack:** Next.js · Tailwind · Supabase (Postgres + Auth + RLS + Storage) · Vercel

## Status

Schema phase complete. UI design phase in progress.

- `supabase/migrations/20260808000000_initial_schema.sql` — full schema (tenancy, plan versioning, food master, nutrition history integrity, RLS)
- `supabase/migrations/20260808000001_seed_food_master.sql` — 40 foods (24 micronutrients each) + ~140 aliases

## Architecture summary

**Tenancy:** Clinic → Household → Member. Staff roles: owner / nutritionist / staff.

**Auth (two-phase):**
- V0.1 — PIN auth. RLS via `set_config('app.current_member_id', …)` / `current_setting()`.
- V0.2 — Supabase Auth. Both `pin_hash` and `auth_user_id` nullable; CHECK enforces one is set.

**Plan versioning:** `draft → active → superseded`. Structure is immutable once published (enforced by trigger).

**Food master:** Global (no per-clinic scoping). Alias table backs search-before-create UX so "palak" / "spinach" / "saag" resolve to one row.

**Nutrition history integrity:** `foods.content_version` + `food_nutrition_versions` snapshots + `plan_item_alternates.food_content_version` pinning. Refreshing food data never corrupts historical logs.

**Weight readings:** Columns match Fitelo Smart Scale output (`weight_kg`, `fat_mass_kg`, `lean_mass_kg`, `subcutaneous_fat_pct`). Derived metrics (BMI, body-fat %, BMR) computed at query time.

## Phasing

| Phase | Scope |
|-------|-------|
| V0.1 | PIN auth · plan builder · meal logging · weight logging · food search |
| V0.2 | Supabase Auth migration · family admin portal · member-facing app |
| V0.3 | pgvector embeddings on foods · semantic food search UI |
| V0.4 | LLM food deduplication queue |
| V0.5 | DPDP Act compliance (data export, consent, retention) |

## License

Proprietary — all rights reserved.
