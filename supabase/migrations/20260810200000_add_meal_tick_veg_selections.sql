-- =============================================================================
-- meal_tick_veg_selections: multiple vegetables logged against one open_veg item
-- =============================================================================
-- Physical plan says "sabziyaan 140g" — the member may eat several allowed
-- vegetables that together add up to (roughly) 140g. Current meal_ticks stores
-- exactly one chosen_food_id. This new table lets ONE meal_tick fan out to N
-- veg selections, each with its own grams.
--
-- Nutrition math: item's contribution = sum(each selection's food scaled to
-- its grams) — computed at query time from food_nutrition_versions pinned to
-- food_content_version.
--
-- Applies only to open_veg items. For fixed / choice items, chosen_food_id on
-- meal_ticks remains the source of truth.
-- =============================================================================

CREATE TABLE meal_tick_veg_selections (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_tick_id         UUID NOT NULL REFERENCES meal_ticks(id) ON DELETE CASCADE,
    food_id              UUID NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,
    -- Pinned at write time so nutrition maths uses the value that was in effect
    -- when the member logged. Matches plan_item_alternates.food_content_version.
    food_content_version INT  NOT NULL,
    grams                NUMERIC(8, 2) NOT NULL CHECK (grams > 0),
    position             INT  NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (meal_tick_id, food_id)   -- one row per (tick, food); update grams to change
);

CREATE INDEX idx_meal_tick_veg_selections_tick ON meal_tick_veg_selections (meal_tick_id);
CREATE INDEX idx_meal_tick_veg_selections_food ON meal_tick_veg_selections (food_id);

-- Audit trail for changes
CREATE TRIGGER audit_meal_tick_veg_selections
    AFTER INSERT OR UPDATE OR DELETE ON meal_tick_veg_selections
    FOR EACH ROW EXECUTE FUNCTION write_audit_event();
