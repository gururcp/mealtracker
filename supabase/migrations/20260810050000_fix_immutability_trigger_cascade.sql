-- =============================================================================
-- Fix: guard_plan_structure_immutable failing on cascade deletes
-- =============================================================================
-- When a plan_item is deleted (or a whole plan_version), PostgreSQL cascades
-- to plan_item_alternates / plan_item_ingredients. The BEFORE DELETE trigger
-- on the child fires and tries to look up the parent's plan_version_id — but
-- in some cascade scenarios that lookup returns NULL (parent effectively gone
-- from the trigger's point of view). The prior code treated NULL as "not
-- draft" and raised, blocking legitimate deletes.
--
-- Fix: when the parent lookup returns NULL, treat as "parent's trigger already
-- authorized this cascade" and allow. FK constraints still prevent creating
-- orphan children, so this doesn't open a hole for bad inserts.
-- =============================================================================

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

    -- Parent lookup returned NULL → parent is being cascaded/deleted.
    -- The parent's own trigger already authorized this operation; allow it.
    IF v_version_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    SELECT status INTO v_status FROM plan_versions WHERE id = v_version_id;

    -- Plan version itself is being deleted — allow child cascade.
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
