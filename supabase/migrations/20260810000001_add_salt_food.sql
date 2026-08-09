-- =============================================================================
-- Add Salt (Namak) to foods master
-- =============================================================================
-- Used as an ingredient in isabgol prep, chaas, and general seasoning.
-- 100g NaCl → 38.76g sodium (USDA rounded). All other nutrients ≈ 0.
-- tsp_grams = 6.0 (one level teaspoon of table salt ≈ 6g)
-- =============================================================================

INSERT INTO foods (
    en_name, hi_name, category, per_100_unit, tsp_grams,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Salt (Namak)', 'नमक', 'spice', 'g', 6.0,
    0, 0.00, 0.00, 0.00, 0.00,
    0.33, 24, 1, 0, 8, 38758, 0.10,
    0, 0.00, 0.00, 0.00, 0.00,
    0.000, 0.000, 0.000, 0.000, 0.00, 0.00,
    'usda', 'FDC-746775'
);

-- Aliases
INSERT INTO food_aliases (food_id, alias_name, language) VALUES
    ((SELECT id FROM foods WHERE source_ref = 'FDC-746775'), 'namak',      'en'),
    ((SELECT id FROM foods WHERE source_ref = 'FDC-746775'), 'salt',       'en'),
    ((SELECT id FROM foods WHERE source_ref = 'FDC-746775'), 'table salt', 'en'),
    ((SELECT id FROM foods WHERE source_ref = 'FDC-746775'), 'sea salt',   'en'),
    ((SELECT id FROM foods WHERE source_ref = 'FDC-746775'), 'sendha namak','en');
