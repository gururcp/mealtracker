-- =============================================================================
-- Fix: guard_plan_structure_immutable — parse-time field access bug
-- =============================================================================
-- Original function referenced NEW.plan_version_id and NEW.plan_item_id directly
-- inside a CASE TG_TABLE_NAME branch. PL/pgSQL resolves those field references
-- at plan time against the actual row type of the triggering table, not lazily
-- inside the CASE branch. So a trigger firing on `meal_slots` (which has no
-- plan_item_id column) failed at plan time — even though the plan_item_id
-- branch is only supposed to run for plan_item_alternates.
--
-- Fix: convert NEW/OLD to JSONB and extract fields dynamically. This bypasses
-- the parse-time column check entirely.
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
