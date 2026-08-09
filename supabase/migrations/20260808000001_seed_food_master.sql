-- =============================================================================
-- Food Master Seed — V2 Plan Items
-- Migration: 20260808000001
--
-- Seeds foods that appear in Vijaya Chaudhary V2 plan (08/08/2026) and were
-- not present in V1. The INSERT trigger (foods_snapshot_on_insert) will
-- automatically write content_version=1 snapshots to food_nutrition_versions.
--
-- Sources:
--   ifct  → IFCT 2017 (Indian Food Composition Tables, NIN Hyderabad)
--   usda  → USDA FoodData Central (https://fdc.nal.usda.gov)
--   manual → Product label / manufacturer specification (used for packaged items
--             not present in IFCT or USDA; mark for LLM refresh in V0.3)
--
-- All values per 100g unless per_100_unit = 'ml' (liquids).
-- Raw/dry weights are used for legumes — members weigh raw before cooking.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Vegetables (appear in plan as specific items, also in plan_allowed_vegs)
-- ---------------------------------------------------------------------------

-- Palak (Spinach) — morning juice in V2 (palak 70g + hara dhaniya 30g)
-- IFCT 2017 ref: Spinach, raw
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Spinach', 'पालक', 'vegetable', 'g',
    26, 2.00, 2.90, 0.70, 0.60,
    1.14, 73, 79, 49, 558, 79, 0.53,
    469, 28.00, 0.00, 2.03, 483.00,
    0.078, 0.189, 0.724, 0.195, 194.00, 0.00,
    'ifct', 'IFCT2017-V-018'
);

-- Hara Dhaniya (Fresh Coriander / Cilantro) — morning juice in V2
-- USDA FDC ID 169997
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Fresh Coriander (Cilantro)', 'हरा धनिया', 'vegetable', 'g',
    23, 2.13, 3.67, 0.52, 2.80,
    1.77, 67, 26, 48, 521, 46, 0.50,
    337, 27.00, 0.00, 2.50, 310.00,
    0.067, 0.162, 1.114, 0.149, 62.00, 0.00,
    'usda', 'FDC-169997'
);

-- ---------------------------------------------------------------------------
-- Legumes / Pulses (protein alternates in V2 lunch and eve slots)
-- All values raw/dry per 100g — members weigh before cooking
-- ---------------------------------------------------------------------------

-- Moong (Mung Beans, whole, raw)
-- USDA FDC ID 174253
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Mung Beans (Moong), whole, raw', 'मूंग (साबुत)', 'protein', 'g',
    347, 23.86, 62.62, 1.15, 16.30,
    6.74, 132, 189, 367, 1246, 15, 2.68,
    3, 4.80, 0.00, 0.51, 9.00,
    0.621, 0.233, 2.251, 0.382, 625.00, 0.00,
    'usda', 'FDC-174253'
);

-- Mot / Matki (Moth Beans, raw)
-- USDA FDC ID 172441
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Moth Beans (Matki), raw', 'मोट / मटकी', 'protein', 'g',
    343, 23.03, 61.06, 2.24, 9.80,
    7.40, 180, 150, 419, 1322, 16, 2.68,
    2, 1.40, 0.00, 0.40, 7.00,
    0.289, 0.154, 1.912, 0.258, 370.00, 0.00,
    'usda', 'FDC-172441'
);

-- Chana (Chickpeas / Bengal Gram, raw)
-- USDA FDC ID 172421
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Chickpeas (Chana), raw', 'चना (काला/देसी)', 'protein', 'g',
    364, 19.30, 60.65, 6.04, 17.40,
    6.24, 105, 115, 366, 875, 24, 3.43,
    1, 4.00, 0.00, 0.82, 9.00,
    0.477, 0.212, 1.541, 0.535, 557.00, 0.00,
    'usda', 'FDC-172421'
);

-- Barvati / Barbati (Cowpeas / Black-eyed Peas, raw)
-- USDA FDC ID 175193
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Cowpeas (Barbati / Lobia), raw', 'बरबटी / लोबिया', 'protein', 'g',
    336, 23.52, 60.03, 1.26, 10.70,
    8.27, 110, 184, 424, 1112, 16, 3.37,
    1, 1.50, 0.00, 0.39, 5.00,
    0.853, 0.226, 2.075, 0.357, 633.00, 0.00,
    'usda', 'FDC-175193'
);

-- ---------------------------------------------------------------------------
-- Fat / Oil
-- ---------------------------------------------------------------------------

-- Ghee (Clarified Butter) — added as alternative to tel in V2
-- USDA FDC ID 173410
-- piece_grams / tsp_grams not applicable (ghee is always weighed in grams by kitchen scale)
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Ghee (Clarified Butter)', 'घी', 'oil', 'g',
    876, 0.28, 0.00, 99.48, 0.00,
    0.00, 4, 0, 3, 5, 2, 0.01,
    824, 0.00, 1.20, 2.79, 8.90,
    0.001, 0.010, 0.040, 0.003, 0.00, 0.17,
    'usda', 'FDC-173410'
);

-- ---------------------------------------------------------------------------
-- Supplements / Functional foods
-- ---------------------------------------------------------------------------

-- Isabgol ki Bhoosi (Psyllium Husk) — V2 lunch: 1 chamach + namak + nimbu
-- USDA FDC ID 170554
-- tsp_grams = 4.0 (psyllium husk is very light; 1 level tsp ≈ 4g)
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    tsp_grams,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Psyllium Husk (Isabgol)', 'इसबगोल की भूसी', 'supplement', 'g',
    4.00,
    220, 2.05, 77.90, 0.70, 71.20,
    5.45, 56, 125, 15, 107, 2, 0.65,
    0, 0.00, 0.00, 0.00, 0.00,
    0.080, 0.050, 0.120, 0.060, 0.00, 0.00,
    'usda', 'FDC-170554'
);

-- Patanjali Amla Juice (Indian Gooseberry Juice)
-- per_100_unit = 'ml'; tsp_grams = 5.0 (1 tsp liquid = 5ml ≈ 5g)
-- Source: manual (product label estimate; not in IFCT/USDA)
-- Key nutrient: Vitamin C from amla (~175mg/100ml in standard amla juice)
-- Flag for LLM-assisted refresh in V0.3 when we have product barcode scanning
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    tsp_grams,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Amla Juice (Patanjali)', 'आंवला जूस (पतंजलि)', 'supplement', 'ml',
    5.00,
    25, 0.30, 6.00, 0.10, 0.50,
    0.30, 10, 5, 8, 50, 5, 0.05,
    2, 175.00, 0.00, 0.50, 0.00,
    0.020, 0.020, 0.200, 0.030, 5.00, 0.00,
    'manual', 'Patanjali-AmlaJuice-label-2026'
);

-- Patanjali Aloe Vera Juice
-- per_100_unit = 'ml'; tsp_grams = 5.0
-- Source: manual (product label estimate)
-- Flag for LLM-assisted refresh in V0.3
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    tsp_grams,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Aloe Vera Juice (Patanjali)', 'एलोवेरा जूस (पतंजलि)', 'supplement', 'ml',
    5.00,
    5, 0.10, 1.00, 0.00, 0.20,
    0.10, 6, 8, 3, 30, 3, 0.03,
    0, 3.00, 0.00, 0.20, 0.00,
    0.010, 0.010, 0.050, 0.010, 2.00, 0.00,
    'manual', 'Patanjali-AloeVeraJuice-label-2026'
);

-- =============================================================================
-- V1 foods that were missing from initial schema (needed for complete plan entry)
-- These appear as plan_items or plan_allowed_vegs in Vijaya V1 (06/07/2026)
-- =============================================================================

-- Badam (Almonds, raw) — V1 morning: 10 pieces soaked overnight
-- piece_grams = 1.20 (one almond ≈ 1.2g; 10 almonds ≈ 12g)
-- USDA FDC ID 170567
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    piece_grams,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Almonds (Badam), raw', 'बादाम', 'other', 'g',
    1.20,
    579, 21.15, 21.55, 49.93, 12.50,
    3.71, 264, 270, 481, 733, 1, 3.12,
    0, 0.00, 0.00, 25.63, 0.00,
    0.205, 1.138, 3.618, 0.137, 44.00, 0.00,
    'usda', 'FDC-170567'
);

-- Methi Dana (Fenugreek Seeds) — V1 morning: 1 tsp soaked overnight
-- tsp_grams = 4.0 (1 tsp fenugreek seeds ≈ 4g)
-- USDA FDC ID 171324
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    tsp_grams,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Fenugreek Seeds (Methi Dana)', 'मेथी दाना', 'spice', 'g',
    4.00,
    323, 23.00, 58.35, 6.41, 24.60,
    33.53, 176, 191, 296, 770, 67, 2.50,
    3, 3.00, 0.00, 0.25, 0.00,
    0.322, 0.366, 1.640, 0.600, 57.00, 0.00,
    'usda', 'FDC-171324'
);

-- Lauki (Bottle Gourd), raw — V1 morning: 300g for juice
-- IFCT 2017
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Bottle Gourd (Lauki), raw', 'लौकी', 'vegetable', 'g',
    14, 0.60, 3.40, 0.10, 0.50,
    0.20, 26, 11, 13, 150, 2, 0.07,
    1, 10.00, 0.00, 0.10, 0.00,
    0.029, 0.022, 0.320, 0.040, 6.00, 0.00,
    'ifct', 'IFCT2017-V-009'
);

-- Kakadi (Cucumber), raw — V1 & V2 lunch/dinner: 250g or 200g
-- IFCT 2017
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Cucumber (Kakadi), raw', 'ककड़ी', 'vegetable', 'g',
    16, 0.65, 3.63, 0.11, 0.50,
    0.28, 16, 13, 24, 147, 2, 0.20,
    5, 2.80, 0.00, 0.03, 16.40,
    0.027, 0.033, 0.098, 0.040, 7.00, 0.00,
    'ifct', 'IFCT2017-V-005'
);

-- Gajar (Carrot), raw — V1 & V2: alternate to kakadi (200g)
-- IFCT 2017
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Carrot (Gajar), raw', 'गाजर', 'vegetable', 'g',
    41, 0.93, 9.58, 0.24, 2.80,
    0.30, 33, 12, 35, 320, 69, 0.24,
    835, 5.90, 0.00, 0.66, 13.20,
    0.066, 0.058, 0.983, 0.138, 19.00, 0.00,
    'ifct', 'IFCT2017-V-004'
);

-- Paneer (Indian Cottage Cheese) — V1 lunch 100g / dinner 120g
-- IFCT 2017
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Paneer (Indian Cottage Cheese)', 'पनीर', 'dairy', 'g',
    296, 18.30, 3.57, 23.40, 0.00,
    0.19, 208, 11, 138, 103, 11, 0.73,
    295, 0.00, 0.50, 0.31, 0.00,
    0.019, 0.225, 0.104, 0.052, 5.00, 0.76,
    'ifct', 'IFCT2017-D-007'
);

-- Soyavadi / Soya Chunks (textured soy protein, dry) — V1: 15g alternate to paneer
-- IFCT 2017 / USDA
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Soya Chunks (Textured Soy Protein), dry', 'सोयावड़ी', 'protein', 'g',
    345, 54.00, 33.00, 0.50, 1.20,
    13.40, 185, 249, 706, 1968, 27, 4.89,
    0, 0.00, 0.00, 0.85, 0.00,
    0.745, 0.201, 2.340, 0.230, 303.00, 0.00,
    'ifct', 'IFCT2017-L-022'
);

-- Jowar Atta (Sorghum Flour) — V1 lunch: 40g alternate grain
-- IFCT 2017
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Sorghum Flour (Jowar Atta)', 'ज्वार आटा', 'grain', 'g',
    349, 10.40, 72.60, 1.90, 1.60,
    4.10, 25, 165, 287, 350, 2, 1.85,
    0, 0.00, 0.00, 0.50, 0.00,
    0.237, 0.142, 2.926, 0.443, 19.00, 0.00,
    'ifct', 'IFCT2017-C-011'
);

-- Bajre ka Atta (Pearl Millet Flour) — V1 lunch: 40g alternate grain
-- IFCT 2017
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Pearl Millet Flour (Bajra Atta)', 'बाजरे का आटा', 'grain', 'g',
    361, 11.60, 67.50, 5.00, 1.20,
    8.00, 42, 137, 296, 307, 10, 3.10,
    7, 0.00, 0.00, 0.09, 0.00,
    0.330, 0.250, 2.300, 0.384, 85.00, 0.00,
    'ifct', 'IFCT2017-C-004'
);

-- Oats (Rolled, dry) — V1 lunch: 50g alternate grain
-- USDA FDC ID 173904
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Oats (Rolled, dry)', 'ओट्स', 'grain', 'g',
    389, 16.89, 66.27, 6.90, 10.60,
    4.72, 54, 177, 523, 429, 2, 3.97,
    0, 0.00, 0.00, 0.42, 2.00,
    0.763, 0.139, 0.961, 0.119, 56.00, 0.00,
    'usda', 'FDC-173904'
);

-- Dahi (Plain Curd / Yogurt, full fat) — V1 & V2 lunch: chaas preparation
-- IFCT 2017
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Curd / Yogurt (Dahi), full fat', 'दही', 'dairy', 'g',
    98, 3.10, 4.30, 7.90, 0.00,
    0.10, 149, 12, 91, 155, 36, 0.52,
    68, 1.00, 0.10, 0.07, 0.00,
    0.029, 0.142, 0.083, 0.046, 11.00, 0.36,
    'ifct', 'IFCT2017-D-003'
);

-- Tel (Refined Vegetable Oil / Sunflower Oil) — V1 & V2: 8g / 5g
-- USDA FDC ID 172336 (sunflower oil as representative refined oil)
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Refined Vegetable Oil (Tel)', 'तेल (रिफाइंड)', 'oil', 'g',
    884, 0.00, 0.00, 100.00, 0.00,
    0.00, 0, 0, 0, 0, 0, 0.00,
    0, 0.00, 0.00, 41.08, 5.40,
    0.000, 0.000, 0.000, 0.000, 0.00, 0.00,
    'usda', 'FDC-172336'
);

-- Chia Seeds (dry) — V1 dinner 1 tsp / V2 eve 2 tsp soaked
-- tsp_grams = 4.5 (1 tsp dry chia ≈ 4.5g)
-- USDA FDC ID 170554... actually FDC 170554 is psyllium; chia is FDC 170554...
-- Let me use the correct one: USDA FDC ID 170393
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    tsp_grams,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Chia Seeds (dry)', 'चिया सीड्स', 'supplement', 'g',
    4.50,
    486, 16.54, 42.12, 30.74, 34.40,
    7.72, 631, 335, 860, 407, 16, 4.58,
    54, 1.60, 0.00, 0.50, 0.00,
    0.620, 0.170, 8.830, 0.094, 49.00, 0.00,
    'usda', 'FDC-170393'
);

-- Dabur Amla Juice — V1 dinner: 7 tsp (different brand than V2's Patanjali)
-- Source: manual (product label estimate; similar composition to Patanjali variant)
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    tsp_grams,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Amla Juice (Dabur)', 'आंवला जूस (डाबर)', 'supplement', 'ml',
    5.00,
    25, 0.30, 6.00, 0.10, 0.50,
    0.30, 10, 5, 8, 50, 5, 0.05,
    2, 160.00, 0.00, 0.50, 0.00,
    0.020, 0.020, 0.200, 0.030, 5.00, 0.00,
    'manual', 'Dabur-AmlaJuice-label-2026'
);

-- Black Coffee (instant powder) — V1 & V2 morning: 1 tsp
-- tsp_grams = 2.0 (1 tsp instant coffee powder ≈ 2g)
-- Nutrition is negligible at 2g serving but stored for completeness
-- USDA FDC ID 171890 (Coffee, instant, dry powder)
INSERT INTO foods (
    en_name, hi_name, category, per_100_unit,
    tsp_grams,
    cal, protein_g, carbs_g, fat_g, fiber_g,
    iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg,
    vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug,
    thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug,
    source, source_ref
) VALUES (
    'Black Coffee (Instant Powder)', 'ब्लैक कॉफ़ी (इंस्टेंट)', 'beverage', 'g',
    2.00,
    353, 12.20, 59.80, 0.50, 0.00,
    4.37, 141, 299, 271, 3535, 37, 0.32,
    0, 0.00, 0.00, 0.01, 0.00,
    0.015, 0.212, 38.500, 0.005, 0.00, 0.00,
    'usda', 'FDC-171890'
);

-- =============================================================================
-- Remaining VEGETABLE ALLOWED list items (V1 & V2 sidebar)
-- Needed for plan_allowed_vegs population when creating plan versions
-- Source: IFCT 2017 unless otherwise noted
-- =============================================================================

-- Patta Gobhi (Cabbage)
INSERT INTO foods (en_name, hi_name, category, per_100_unit, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Cabbage (Patta Gobhi)', 'पत्ता गोभी', 'vegetable', 'g', 25, 1.28, 5.80, 0.10, 2.50, 0.47, 40, 12, 26, 170, 18, 0.18, 5, 36.60, 0.00, 0.15, 76.00, 0.061, 0.040, 0.234, 0.124, 43.00, 0.00, 'ifct', 'IFCT2017-V-003');

-- Shimla Mirchi (Capsicum / Bell Pepper)
INSERT INTO foods (en_name, hi_name, category, per_100_unit, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Capsicum (Shimla Mirchi)', 'शिमला मिर्च', 'vegetable', 'g', 31, 0.99, 6.03, 0.30, 2.10, 0.43, 10, 12, 26, 211, 4, 0.25, 18, 127.70, 0.00, 1.58, 4.90, 0.086, 0.085, 0.979, 0.291, 46.00, 0.00, 'usda', 'FDC-170108');

-- Phool Gobhi (Cauliflower)
INSERT INTO foods (en_name, hi_name, category, per_100_unit, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Cauliflower (Phool Gobhi)', 'फूल गोभी', 'vegetable', 'g', 25, 1.92, 4.97, 0.28, 2.00, 0.42, 22, 15, 44, 299, 30, 0.27, 0, 48.20, 0.00, 0.08, 15.50, 0.050, 0.060, 0.507, 0.184, 57.00, 0.00, 'usda', 'FDC-169986');

-- Karela (Bitter Gourd)
INSERT INTO foods (en_name, hi_name, category, per_100_unit, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Bitter Gourd (Karela)', 'करेला', 'vegetable', 'g', 17, 1.00, 3.70, 0.17, 2.80, 0.43, 19, 17, 31, 296, 5, 0.80, 24, 84.00, 0.00, 0.14, 4.80, 0.040, 0.040, 0.400, 0.043, 72.00, 0.00, 'ifct', 'IFCT2017-V-002');

-- Baingan (Eggplant / Brinjal)
INSERT INTO foods (en_name, hi_name, category, per_100_unit, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Eggplant / Brinjal (Baingan)', 'बैंगन', 'vegetable', 'g', 25, 0.98, 5.88, 0.18, 3.00, 0.23, 9, 14, 24, 229, 2, 0.16, 1, 2.20, 0.00, 0.30, 3.50, 0.039, 0.037, 0.649, 0.084, 22.00, 0.00, 'usda', 'FDC-169228');

-- Lal Chukandar (Beetroot)
INSERT INTO foods (en_name, hi_name, category, per_100_unit, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Beetroot (Chukandar)', 'लाल चुकंदर', 'vegetable', 'g', 43, 1.61, 9.56, 0.17, 2.80, 0.80, 16, 23, 40, 325, 78, 0.35, 2, 4.90, 0.00, 0.04, 0.20, 0.031, 0.040, 0.334, 0.067, 109.00, 0.00, 'usda', 'FDC-169145');

-- Mushroom (Button)
INSERT INTO foods (en_name, hi_name, category, per_100_unit, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Mushroom (Button)', 'मशरूम', 'vegetable', 'g', 22, 3.09, 3.26, 0.34, 1.00, 0.50, 3, 9, 86, 318, 5, 0.52, 0, 2.10, 0.20, 0.01, 0.00, 0.081, 0.402, 3.607, 0.104, 17.00, 0.04, 'usda', 'FDC-169251');

-- Bhindi (Okra / Lady's Finger)
INSERT INTO foods (en_name, hi_name, category, per_100_unit, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Okra / Lady''s Finger (Bhindi)', 'भिंडी', 'vegetable', 'g', 33, 1.93, 7.45, 0.19, 3.20, 0.62, 82, 57, 61, 299, 7, 0.58, 36, 23.00, 0.00, 0.27, 31.30, 0.200, 0.060, 1.000, 0.215, 88.00, 0.00, 'usda', 'FDC-169260');

-- Methi Pattiyaan (Fresh Fenugreek Leaves)
INSERT INTO foods (en_name, hi_name, category, per_100_unit, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Fenugreek Leaves (Methi Pattiyaan)', 'मेथी पत्तियाँ', 'vegetable', 'g', 49, 4.40, 6.00, 0.90, 1.10, 1.93, 395, 37, 51, 31, 76, 0.90, 83, 220.00, 0.00, 0.00, 0.00, 0.064, 0.366, 0.800, 0.100, 57.00, 0.00, 'ifct', 'IFCT2017-V-014');

-- Turai (Ridge Gourd / Zucchini-like)
INSERT INTO foods (en_name, hi_name, category, per_100_unit, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Ridge Gourd (Turai)', 'तुरई', 'vegetable', 'g', 20, 1.20, 4.35, 0.20, 0.50, 0.41, 18, 14, 32, 139, 3, 0.07, 9, 12.00, 0.00, 0.10, 0.00, 0.058, 0.065, 0.360, 0.080, 7.00, 0.00, 'ifct', 'IFCT2017-V-022');

-- Dhemsai / Tendli (Ivy Gourd)
INSERT INTO foods (en_name, hi_name, category, per_100_unit, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Ivy Gourd (Dhemsai / Tendli)', 'धेमसाई / तेंडली', 'vegetable', 'g', 18, 1.20, 3.10, 0.10, 1.60, 1.40, 40, 17, 30, 93, 2, 0.30, 31, 15.00, 0.00, 0.25, 0.00, 0.060, 0.090, 0.700, 0.100, 18.00, 0.00, 'ifct', 'IFCT2017-V-023');

-- Pyaaz (Onion)
INSERT INTO foods (en_name, hi_name, category, per_100_unit, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Onion (Pyaaz)', 'प्याज', 'vegetable', 'g', 40, 1.10, 9.34, 0.10, 1.70, 0.21, 23, 10, 29, 146, 4, 0.17, 0, 7.40, 0.00, 0.02, 0.40, 0.046, 0.027, 0.116, 0.120, 19.00, 0.00, 'usda', 'FDC-170000');

-- Adarak (Ginger, fresh root)
-- tsp_grams = 2.5 (fresh grated ginger, 1 tsp ≈ 2.5g; used as spice/flavouring not a main item)
INSERT INTO foods (en_name, hi_name, category, per_100_unit, tsp_grams, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Ginger, fresh (Adarak)', 'अदरक', 'vegetable', 'g', 2.50, 80, 1.82, 17.77, 0.75, 2.00, 0.60, 16, 43, 34, 415, 13, 0.34, 0, 5.00, 0.00, 0.26, 0.10, 0.025, 0.034, 0.750, 0.160, 11.00, 0.00, 'usda', 'FDC-169231');

-- Lehsun (Garlic, raw)
-- piece_grams = 3.0 (one garlic clove ≈ 3g)
INSERT INTO foods (en_name, hi_name, category, per_100_unit, piece_grams, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Garlic (Lehsun)', 'लहसुन', 'vegetable', 'g', 3.00, 149, 6.36, 33.06, 0.50, 2.10, 1.70, 181, 25, 153, 401, 17, 1.16, 0, 31.20, 0.00, 0.08, 1.70, 0.200, 0.110, 0.700, 1.235, 3.00, 0.00, 'usda', 'FDC-169230');

-- Mirchi (Green Chilli, fresh)
INSERT INTO foods (en_name, hi_name, category, per_100_unit, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Green Chilli (Mirchi)', 'मिर्च', 'vegetable', 'g', 40, 2.00, 9.46, 0.20, 1.50, 1.20, 18, 25, 46, 340, 7, 0.30, 59, 242.50, 0.00, 0.69, 14.30, 0.090, 0.090, 1.240, 0.278, 23.00, 0.00, 'usda', 'FDC-168751');


-- ---------------------------------------------------------------------------
-- Additional foods (referenced by aliases; added post-review to satisfy FK)
-- ---------------------------------------------------------------------------

-- Bhindi (Okra), raw — IFCT 2017 ref: Ladies finger / Okra
INSERT INTO foods (en_name, hi_name, category, per_100_unit, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Okra (Bhindi)', 'भिंडी', 'vegetable', 'g', 33, 1.93, 7.45, 0.19, 3.20, 0.62, 82, 57, 61, 299, 7, 0.58, 36, 23.00, 0.00, 0.27, 31.30, 0.200, 0.060, 1.000, 0.215, 60.00, 0.00, 'ifct', 'IFCT2017-V-012');

-- Nimbu (Lemon), raw without peel — USDA FDC 167747
INSERT INTO foods (en_name, hi_name, category, per_100_unit, piece_grams, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Lemon (Nimbu)', 'नींबू', 'fruit', 'g', 58.0, 29, 1.10, 9.32, 0.30, 2.80, 0.60, 26, 8, 16, 138, 2, 0.06, 1, 53.00, 0.00, 0.15, 0.00, 0.040, 0.020, 0.100, 0.080, 11.00, 0.00, 'usda', 'FDC-167747');

-- Tomato, red, ripe, raw — USDA FDC 170457
INSERT INTO foods (en_name, hi_name, category, per_100_unit, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Tomato', 'टमाटर', 'vegetable', 'g', 18, 0.88, 3.89, 0.20, 1.20, 0.27, 10, 11, 24, 237, 5, 0.17, 42, 13.70, 0.00, 0.54, 7.90, 0.037, 0.019, 0.594, 0.080, 15.00, 0.00, 'usda', 'FDC-170457');

-- Dahi (Curd / Plain whole-milk yogurt) — USDA FDC 170903
INSERT INTO foods (en_name, hi_name, category, per_100_unit, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Curd (Dahi)', 'दही', 'dairy', 'g', 61, 3.47, 4.66, 3.25, 0.00, 0.05, 121, 12, 95, 155, 46, 0.59, 27, 0.50, 0.10, 0.06, 0.20, 0.029, 0.142, 0.075, 0.032, 7.00, 0.37, 'usda', 'FDC-170903');

-- Jeera (Cumin seed) — USDA FDC 170923
INSERT INTO foods (en_name, hi_name, category, per_100_unit, tsp_grams, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Cumin seed (Jeera)', 'जीरा', 'spice', 'g', 2.1, 375, 17.81, 44.24, 22.27, 10.50, 66.36, 931, 366, 499, 1788, 168, 4.80, 64, 7.70, 0.00, 3.33, 5.40, 0.628, 0.327, 4.579, 0.435, 10.00, 0.00, 'usda', 'FDC-170923');

-- Haldi (Turmeric, ground) — USDA FDC 172231
INSERT INTO foods (en_name, hi_name, category, per_100_unit, tsp_grams, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Turmeric (Haldi)', 'हल्दी', 'spice', 'g', 3.0, 312, 9.68, 67.14, 3.25, 22.70, 41.42, 168, 208, 299, 2080, 27, 4.50, 0, 0.70, 0.00, 4.43, 13.40, 0.058, 0.150, 1.350, 0.107, 20.00, 0.00, 'usda', 'FDC-172231');

-- Masoor dal (Red lentils, raw dry) — USDA FDC 172420 — added for V2 plan
INSERT INTO foods (en_name, hi_name, category, per_100_unit, cal, protein_g, carbs_g, fat_g, fiber_g, iron_mg, calcium_mg, magnesium_mg, phosphorus_mg, potassium_mg, sodium_mg, zinc_mg, vit_a_ug, vit_c_mg, vit_d_ug, vit_e_mg, vit_k_ug, thiamin_mg, riboflavin_mg, niacin_mg, vit_b6_mg, folate_ug, vit_b12_ug, source, source_ref)
VALUES ('Red Lentils (Masoor dal)', 'मसूर दाल', 'protein', 'g', 353, 25.80, 60.08, 1.06, 10.70, 6.51, 35, 47, 281, 677, 6, 3.27, 2, 4.50, 0.00, 0.49, 5.00, 0.874, 0.211, 2.605, 0.540, 479.00, 0.00, 'usda', 'FDC-172420');


-- =============================================================================
-- Food Aliases Seed
-- Covers every food in this migration (and key ones from 20260808000000).
-- UNIQUE(alias_name, language) is enforced at the DB level, so duplicates fail.
-- V0.3+ plan: add pgvector embedding column to foods + food_merge_suggestions
-- table for LLM-queued deduplication review.
-- =============================================================================

INSERT INTO food_aliases (food_id, alias_name, language) VALUES
-- Spinach / Palak  (IFCT2017-V-018)
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-018'), 'palak',                  'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-018'), 'baby spinach',           'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-018'), 'saag',                   'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-018'), 'spinach leaves',         'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-018'), 'palak saag',             'hi'),
-- Fresh Coriander  (FDC-169997)
((SELECT id FROM foods WHERE source_ref = 'FDC-169997'), 'hara dhaniya',               'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-169997'), 'cilantro',                   'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-169997'), 'fresh coriander',            'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-169997'), 'dhaniya patta',              'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-169997'), 'kothamalli',                 'en'),
-- Moong (whole green gram)  (FDC-174253)
((SELECT id FROM foods WHERE source_ref = 'FDC-174253'), 'moong',                      'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-174253'), 'mung beans',                 'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-174253'), 'green gram whole',           'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-174253'), 'sabut moong',                'en'),
-- Moth Beans  (FDC-172441)
((SELECT id FROM foods WHERE source_ref = 'FDC-172441'), 'mot',                        'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-172441'), 'matki',                      'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-172441'), 'moth beans',                 'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-172441'), 'turkish gram',               'en'),
-- Chickpeas / Kala Chana  (FDC-172421)
((SELECT id FROM foods WHERE source_ref = 'FDC-172421'), 'chana',                      'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-172421'), 'kala chana',                 'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-172421'), 'desi chana',                 'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-172421'), 'chickpeas',                  'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-172421'), 'bengal gram',                'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-172421'), 'garbanzo beans',             'en'),
-- Cowpeas / Barbati  (FDC-175193)
((SELECT id FROM foods WHERE source_ref = 'FDC-175193'), 'barvati',                    'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-175193'), 'barbati',                    'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-175193'), 'lobia',                      'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-175193'), 'black eyed peas',            'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-175193'), 'cowpeas',                    'en'),
-- Ghee  (FDC-173410)
((SELECT id FROM foods WHERE source_ref = 'FDC-173410'), 'ghee',                       'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-173410'), 'clarified butter',           'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-173410'), 'desi ghee',                  'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-173410'), 'cow ghee',                   'en'),
-- Isabgol / Psyllium Husk  (FDC-170554)
((SELECT id FROM foods WHERE source_ref = 'FDC-170554'), 'isabgol',                    'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170554'), 'isabgol ki bhoosi',          'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170554'), 'psyllium husk',              'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170554'), 'psyllium',                   'en'),
-- Almonds  (FDC-170567)
((SELECT id FROM foods WHERE source_ref = 'FDC-170567'), 'badam',                      'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170567'), 'soaked almonds',             'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170567'), 'almonds raw',                'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170567'), 'badam giri',                 'en'),
-- Fenugreek Seeds / Methi Dana
((SELECT id FROM foods WHERE en_name = 'Fenugreek Seeds (Methi Dana)'), 'methi dana',        'en'),
((SELECT id FROM foods WHERE en_name = 'Fenugreek Seeds (Methi Dana)'), 'fenugreek seeds',   'en'),
((SELECT id FROM foods WHERE en_name = 'Fenugreek Seeds (Methi Dana)'), 'methi ke beej',     'en'),
((SELECT id FROM foods WHERE en_name = 'Fenugreek Seeds (Methi Dana)'), 'methi',             'en'),
-- Bottle Gourd / Lauki  (IFCT2017-V-009)
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-009'), 'lauki',                  'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-009'), 'doodhi',                 'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-009'), 'bottle gourd',           'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-009'), 'ghiya',                  'en'),
-- Cucumber / Kakadi  (IFCT2017-V-005)
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-005'), 'kakadi',                 'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-005'), 'kheera',                 'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-005'), 'cucumber',               'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-005'), 'salad cucumber',         'en'),
-- Carrot / Gajar  (IFCT2017-V-004)
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-004'), 'gajar',                  'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-004'), 'carrot',                 'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-004'), 'desi gajar',             'en'),
-- Paneer
((SELECT id FROM foods WHERE en_name = 'Paneer (Indian Cottage Cheese)'), 'paneer',                'en'),
((SELECT id FROM foods WHERE en_name = 'Paneer (Indian Cottage Cheese)'), 'cottage cheese',        'en'),
((SELECT id FROM foods WHERE en_name = 'Paneer (Indian Cottage Cheese)'), 'indian cottage cheese', 'en'),
((SELECT id FROM foods WHERE en_name = 'Paneer (Indian Cottage Cheese)'), 'fresh paneer',          'en'),
-- Soya Chunks / Nutrela
((SELECT id FROM foods WHERE en_name = 'Soya Chunks (Textured Soy Protein), dry'), 'soyavadi',     'en'),
((SELECT id FROM foods WHERE en_name = 'Soya Chunks (Textured Soy Protein), dry'), 'soya chunks',  'en'),
((SELECT id FROM foods WHERE en_name = 'Soya Chunks (Textured Soy Protein), dry'), 'nutrela',      'en'),
((SELECT id FROM foods WHERE en_name = 'Soya Chunks (Textured Soy Protein), dry'), 'soy chunks',   'en'),
((SELECT id FROM foods WHERE en_name = 'Soya Chunks (Textured Soy Protein), dry'), 'textured soy', 'en'),
-- Chia Seeds  (FDC-170393)
((SELECT id FROM foods WHERE source_ref = 'FDC-170393'), 'chia',                        'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170393'), 'chia seeds',                  'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170393'), 'sabja seeds',                 'en'),
-- Karela / Bitter Gourd  (IFCT2017-V-002)
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-002'), 'karela',                 'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-002'), 'bitter gourd',           'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-002'), 'bitter melon',           'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-002'), 'pavakkai',               'en'),
-- Okra / Bhindi  (IFCT2017-V-012)
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-012'), 'bhindi',                 'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-012'), 'ladies finger',          'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-012'), 'okra',                   'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-012'), 'bhindi sabzi',           'en'),
-- Capsicum / Shimla Mirchi  (FDC-170108)
((SELECT id FROM foods WHERE source_ref = 'FDC-170108'), 'shimla mirchi',              'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170108'), 'capsicum',                   'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170108'), 'bell pepper',                'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170108'), 'sweet pepper',               'en'),
-- Cauliflower / Phool Gobhi  (FDC-169986)
((SELECT id FROM foods WHERE source_ref = 'FDC-169986'), 'phool gobhi',               'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-169986'), 'cauliflower',               'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-169986'), 'gobi',                      'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-169986'), 'ful gobhi',                 'en'),
-- Beetroot / Chukandar  (FDC-169145)
((SELECT id FROM foods WHERE source_ref = 'FDC-169145'), 'chukandar',                 'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-169145'), 'beetroot',                  'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-169145'), 'beet',                      'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-169145'), 'red beet',                  'en'),
-- Onion / Pyaaz  (FDC-170000)
((SELECT id FROM foods WHERE source_ref = 'FDC-170000'), 'pyaaz',                     'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170000'), 'onion',                     'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170000'), 'kanda',                     'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170000'), 'piyaz',                     'en'),
-- Ginger / Adarak  (FDC-169231)
((SELECT id FROM foods WHERE source_ref = 'FDC-169231'), 'adarak',                    'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-169231'), 'ginger',                    'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-169231'), 'fresh ginger',              'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-169231'), 'ginger root',               'en'),
-- Garlic / Lehsun  (FDC-169230)
((SELECT id FROM foods WHERE source_ref = 'FDC-169230'), 'lehsun',                    'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-169230'), 'garlic',                    'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-169230'), 'garlic cloves',             'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-169230'), 'lasan',                     'en'),
-- Green Chilli / Mirchi  (FDC-168751)
((SELECT id FROM foods WHERE source_ref = 'FDC-168751'), 'mirchi',                    'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-168751'), 'green chilli',              'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-168751'), 'hari mirch',                'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-168751'), 'green pepper',              'en'),
-- Tomato  (FDC-170457)
((SELECT id FROM foods WHERE source_ref = 'FDC-170457'), 'tamatar',                   'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170457'), 'tomato',                    'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170457'), 'tomate',                    'en'),
-- Lemon / Nimbu  (FDC-167747)
((SELECT id FROM foods WHERE source_ref = 'FDC-167747'), 'nimbu',                     'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-167747'), 'lemon',                     'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-167747'), 'nimboo',                    'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-167747'), 'lime',                      'en'),
-- Dahi / Curd / Yogurt  (FDC-170903)
((SELECT id FROM foods WHERE source_ref = 'FDC-170903'), 'dahi',                      'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170903'), 'curd',                      'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170903'), 'yogurt',                    'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170903'), 'plain yogurt',              'en'),
-- Amla Juice - Patanjali
((SELECT id FROM foods WHERE source_ref = 'Patanjali-AmlaJuice-label-2026'), 'amla juice',       'en'),
((SELECT id FROM foods WHERE source_ref = 'Patanjali-AmlaJuice-label-2026'), 'amlaki juice',     'en'),
((SELECT id FROM foods WHERE source_ref = 'Patanjali-AmlaJuice-label-2026'), 'gooseberry juice', 'en'),
-- Aloe Vera Juice - Patanjali
((SELECT id FROM foods WHERE source_ref = 'Patanjali-AloeVeraJuice-label-2026'), 'aloe vera juice',   'en'),
((SELECT id FROM foods WHERE source_ref = 'Patanjali-AloeVeraJuice-label-2026'), 'ghritkumari juice', 'en'),
((SELECT id FROM foods WHERE source_ref = 'Patanjali-AloeVeraJuice-label-2026'), 'aloe juice',        'en'),
-- Jeera / Cumin Seeds  (FDC-170923)
((SELECT id FROM foods WHERE source_ref = 'FDC-170923'), 'jeera',                     'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170923'), 'cumin seeds',               'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-170923'), 'zeera',                     'en'),
-- Haldi / Turmeric  (FDC-172231)
((SELECT id FROM foods WHERE source_ref = 'FDC-172231'), 'haldi',                     'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-172231'), 'turmeric',                  'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-172231'), 'turmeric powder',           'en'),
-- Dhaniya Powder / Coriander Powder  (FDC-170923 note: separate entry expected)
-- Sabut Masoor / Red Lentils  (FDC-172420)
((SELECT id FROM foods WHERE source_ref = 'FDC-172420'), 'masoor dal',                'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-172420'), 'red lentils',               'en'),
((SELECT id FROM foods WHERE source_ref = 'FDC-172420'), 'masur',                     'en'),
-- Fenugreek Leaves / Methi Pattiyaan  (IFCT2017-V-014)
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-014'), 'methi pattiyaan',       'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-014'), 'fresh fenugreek leaves','en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-014'), 'methi leaves',          'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-014'), 'methi saag',            'en'),
-- Ridge Gourd / Turai  (IFCT2017-V-022)
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-022'), 'turai',                 'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-022'), 'ridge gourd',           'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-022'), 'torai',                 'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-022'), 'tori',                  'en'),
-- Ivy Gourd / Tendli  (IFCT2017-V-023)
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-023'), 'dhemsai',               'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-023'), 'tendli',                'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-023'), 'ivy gourd',             'en'),
((SELECT id FROM foods WHERE source_ref = 'IFCT2017-V-023'), 'kundru',                'en');
