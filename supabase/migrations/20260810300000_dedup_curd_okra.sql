-- =============================================================================
-- Deduplicate Curd (Dahi) and Okra (Bhindi) food rows
-- =============================================================================
-- Background: the original food seed had aliases pointing to source_refs that
-- were never inserted (IFCT2017-V-012, FDC-170903). Our fix migration added
-- both foods so the aliases would resolve — but the ORIGINAL foods table
-- already had equivalent entries under different names + source_refs:
--   • Okra / Lady's Finger (Bhindi)  (FDC-169260) — identical nutrition
--   • Curd / Yogurt (Dahi), full fat (IFCT2017-D-003, 98 kcal) — slightly different
--
-- Curd note: the 98-kcal IFCT entry is too high for common home-made cow-milk
-- dahi. USDA plain whole-milk yogurt (FDC-170903, 61 kcal) matches everyday
-- Indian dahi from full-fat cow milk closely. We keep that entry, rename it
-- for clarity, and delete the 98-kcal duplicate.
--
-- Okra: both entries have identical nutrition. We keep the older FDC-169260
-- entry (referenced by plan_allowed_vegs) and delete the IFCT2017-V-012
-- duplicate, repointing the 4 aliases that were on it.
-- =============================================================================

DO $dedup$
DECLARE
    v_curd_keep     UUID;  -- Curd (Dahi) — FDC-170903, 61 kcal
    v_curd_delete   UUID;  -- Curd / Yogurt (Dahi), full fat — IFCT2017-D-003, 98 kcal
    v_okra_keep     UUID;  -- Okra / Lady's Finger (Bhindi) — FDC-169260
    v_okra_delete   UUID;  -- Okra (Bhindi) — IFCT2017-V-012
BEGIN
    SELECT id INTO v_curd_keep   FROM foods WHERE en_name = 'Curd (Dahi)';
    SELECT id INTO v_curd_delete FROM foods WHERE en_name = 'Curd / Yogurt (Dahi), full fat';
    SELECT id INTO v_okra_keep   FROM foods WHERE en_name = 'Okra / Lady''s Finger (Bhindi)';
    SELECT id INTO v_okra_delete FROM foods WHERE en_name = 'Okra (Bhindi)';

    IF v_curd_keep IS NULL OR v_curd_delete IS NULL THEN
        RAISE EXCEPTION 'Curd rows not in the expected state (keep=% delete=%)',
            v_curd_keep, v_curd_delete;
    END IF;
    IF v_okra_keep IS NULL OR v_okra_delete IS NULL THEN
        RAISE EXCEPTION 'Okra rows not in the expected state (keep=% delete=%)',
            v_okra_keep, v_okra_delete;
    END IF;

    ----------------------------------------------------------------------------
    -- CURD: repoint all references from delete→keep, then delete
    ----------------------------------------------------------------------------

    -- plan_item_alternates + ingredients need the immutability trigger to allow
    -- writes. Downgrade any active plan_versions that reference the deleted
    -- curd to 'draft' temporarily, then republish. There is exactly 1 known
    -- reference (Vijaya's chaas alternate).
    UPDATE plan_versions SET status = 'draft'
    WHERE status = 'active'
      AND id IN (
        SELECT pi.plan_version_id FROM plan_items pi
        JOIN plan_item_alternates pia ON pia.plan_item_id = pi.id
        WHERE pia.food_id = v_curd_delete
      );

    UPDATE plan_item_alternates SET food_id = v_curd_keep WHERE food_id = v_curd_delete;
    UPDATE plan_item_ingredients SET food_id = v_curd_keep WHERE food_id = v_curd_delete;
    UPDATE plan_allowed_vegs     SET food_id = v_curd_keep WHERE food_id = v_curd_delete;
    UPDATE meal_ticks            SET chosen_food_id = v_curd_keep WHERE chosen_food_id = v_curd_delete;
    UPDATE meal_tick_veg_selections SET food_id = v_curd_keep WHERE food_id = v_curd_delete;
    UPDATE food_aliases          SET food_id = v_curd_keep WHERE food_id = v_curd_delete;

    -- Republish plan_versions that were downgraded
    UPDATE plan_versions SET status = 'active'
    WHERE status = 'draft'
      AND id IN (
        SELECT pi.plan_version_id FROM plan_items pi
        JOIN plan_item_alternates pia ON pia.plan_item_id = pi.id
        WHERE pia.food_id = v_curd_keep
      );

    -- Rename kept curd to reflect what it really is
    UPDATE foods
    SET en_name = 'Curd (Dahi), whole milk',
        hi_name = 'दही (गाय का दूध)'
    WHERE id = v_curd_keep;

    -- Delete the 98-kcal duplicate. food_nutrition_versions cascades.
    DELETE FROM foods WHERE id = v_curd_delete;

    ----------------------------------------------------------------------------
    -- OKRA: identical nutrition on both, just merge aliases and delete
    ----------------------------------------------------------------------------

    UPDATE plan_versions SET status = 'draft'
    WHERE status = 'active'
      AND id IN (
        SELECT plan_version_id FROM plan_allowed_vegs WHERE food_id = v_okra_delete
        UNION
        SELECT pi.plan_version_id FROM plan_items pi
        JOIN plan_item_alternates pia ON pia.plan_item_id = pi.id
        WHERE pia.food_id = v_okra_delete
      );

    UPDATE plan_item_alternates SET food_id = v_okra_keep WHERE food_id = v_okra_delete;
    UPDATE plan_item_ingredients SET food_id = v_okra_keep WHERE food_id = v_okra_delete;
    UPDATE plan_allowed_vegs     SET food_id = v_okra_keep WHERE food_id = v_okra_delete;
    UPDATE meal_ticks            SET chosen_food_id = v_okra_keep WHERE chosen_food_id = v_okra_delete;
    UPDATE meal_tick_veg_selections SET food_id = v_okra_keep WHERE food_id = v_okra_delete;
    UPDATE food_aliases          SET food_id = v_okra_keep WHERE food_id = v_okra_delete;

    UPDATE plan_versions SET status = 'active'
    WHERE status = 'draft'
      AND id IN (
        SELECT plan_version_id FROM plan_allowed_vegs WHERE food_id = v_okra_keep
        UNION
        SELECT pi.plan_version_id FROM plan_items pi
        JOIN plan_item_alternates pia ON pia.plan_item_id = pi.id
        WHERE pia.food_id = v_okra_keep
      );

    DELETE FROM foods WHERE id = v_okra_delete;

    RAISE NOTICE 'Deduplication complete: 2 duplicate foods removed.';
END $dedup$;
