-- =============================================================================
-- plan_item_ingredients: compound meal item composition
-- =============================================================================
-- A plan_item's total nutrition = its selected alternate's food + sum(ingredients).
-- Use cases:
--   • Isabgol prep = isabgol (primary alternate) + lemon + salt (ingredients)
--   • Chaas       = dahi   (primary alternate) + jeera + salt (ingredients)
--   • Palak+dhaniya juice = palak (primary) + hara dhaniya (ingredient)
-- Ingredients are ALWAYS added, regardless of which alternate the member picks.
-- They are pinned to a food_content_version at plan creation, same as alternates.
-- =============================================================================

CREATE TABLE plan_item_ingredients (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_item_id         UUID NOT NULL REFERENCES plan_items(id) ON DELETE CASCADE,
    position             INT  NOT NULL,
    food_id              UUID NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,
    food_content_version INT  NOT NULL,
    quantity             NUMERIC(8, 2) NOT NULL,
    unit                 unit_type NOT NULL DEFAULT 'g',
    note                 TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (plan_item_id, position)
);

CREATE INDEX idx_plan_item_ingredients_item ON plan_item_ingredients (plan_item_id);
CREATE INDEX idx_plan_item_ingredients_food ON plan_item_ingredients (food_id);

-- ---------------------------------------------------------------------------
-- Extend guard_plan_structure_immutable to cover the new table
-- ---------------------------------------------------------------------------
-- The function must know how to resolve plan_version_id from a
-- plan_item_ingredients row (via its plan_item). Uses the same JSONB-based
-- dynamic field extraction as the other cases to stay uniform.
CREATE OR REPLACE FUNCTION guard_plan_structure_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_version_id UUID;
    v_status     plan_version_status;
    v_row        JSONB;
BEGIN
    v_row := to_jsonb(COALESCE(NEW, OLD));

    v_version_id := CASE TG_TABLE_NAME
        WHEN 'meal_slots'              THEN (v_row ->> 'plan_version_id')::UUID
        WHEN 'plan_items'              THEN (v_row ->> 'plan_version_id')::UUID
        WHEN 'plan_habits'             THEN (v_row ->> 'plan_version_id')::UUID
        WHEN 'plan_allowed_vegs'       THEN (v_row ->> 'plan_version_id')::UUID
        WHEN 'plan_item_alternates'    THEN (
            SELECT plan_version_id FROM plan_items
            WHERE id = (v_row ->> 'plan_item_id')::UUID
        )
        WHEN 'plan_item_ingredients'   THEN (
            SELECT plan_version_id FROM plan_items
            WHERE id = (v_row ->> 'plan_item_id')::UUID
        )
    END;

    IF v_version_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    SELECT status INTO v_status FROM plan_versions WHERE id = v_version_id;

    IF v_status IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    IF v_status <> 'draft' THEN
        RAISE EXCEPTION
            'Cannot modify % on a % plan version. Clone to a new draft first.',
            TG_TABLE_NAME, v_status;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER plan_item_ingredients_immutability
    BEFORE INSERT OR UPDATE OR DELETE ON plan_item_ingredients
    FOR EACH ROW EXECUTE FUNCTION guard_plan_structure_immutable();

-- Audit trigger for structural changes
CREATE TRIGGER audit_plan_item_ingredients
    AFTER INSERT OR UPDATE OR DELETE ON plan_item_ingredients
    FOR EACH ROW EXECUTE FUNCTION write_audit_event();
