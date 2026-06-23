-- ============================================================
-- SL Ajánlatkezelő – Adatfeltöltés (seed)
-- Futtatsd a schema.sql UTÁN
-- ============================================================

-- ============================================================
-- COLOR PALETTES – LENGYEL
-- ============================================================
DO $$
DECLARE
  lengyel_id UUID;
  sajat_id UUID;
  ms_id UUID;
  -- palette ids
  l_fenyes UUID;
  l_std_mat UUID;
  l_ultra_mat UUID;
  l_fam_egy UUID;
  l_fam_ket UUID;
  s_fenyes UUID;
  s_mat UUID;
  s_fam_egy UUID;
  s_fam_ket UUID;
  ms_fenyes UUID;
  ms_mat UUID;
  ms_fam_egy UUID;
  ms_fam_ket UUID;
  -- category ids
  trapez_cat UUID;
  cserep_cat UUID;
  keretes_cat UUID;
BEGIN

  -- Get manufacturer IDs
  SELECT id INTO lengyel_id FROM public.manufacturers WHERE name = 'Lengyel' LIMIT 1;
  SELECT id INTO sajat_id FROM public.manufacturers WHERE name = 'Saját gyártás' LIMIT 1;
  SELECT id INTO ms_id FROM public.manufacturers WHERE name = 'MS' LIMIT 1;

  -- Get category IDs
  SELECT id INTO trapez_cat FROM public.product_categories WHERE name = 'Trapézlemez' LIMIT 1;
  SELECT id INTO cserep_cat FROM public.product_categories WHERE name = 'Cserepeslemez' LIMIT 1;
  SELECT id INTO keretes_cat FROM public.product_categories WHERE name = 'Kerítéselem' LIMIT 1;

  -- ---- LENGYEL PALETTES ----
  INSERT INTO public.color_palettes (manufacturer_id, name, colors) VALUES
    (lengyel_id, 'Fényes', '["RAL3000","RAL3005","RAL3009","RAL3011","RAL5010","RAL6020","RAL6005","RAL6011","RAL7016","RAL7024","RAL7035","RAL8004","RAL8017","RAL9002","RAL9010","RAL9005","RAL9006","RAL9007","Alucynk"]')
    RETURNING id INTO l_fenyes;

  INSERT INTO public.color_palettes (manufacturer_id, name, colors) VALUES
    (lengyel_id, 'Standard Mat', '["Mat8017","Mat8004","Mat3009","Mat8019","Mat7016"]')
    RETURNING id INTO l_std_mat;

  INSERT INTO public.color_palettes (manufacturer_id, name, colors) VALUES
    (lengyel_id, 'Ultra Mat', '["Mat8017","Mat8004","Mat3009","Mat8019","Mat6020","Mat7024","Mat7016","Mat9005","Mat3005","Mat6005"]')
    RETURNING id INTO l_ultra_mat;

  INSERT INTO public.color_palettes (manufacturer_id, name, colors) VALUES
    (lengyel_id, 'Famintás egyoldalas', '["Lengyel aranytölgy egyoldalas","Lengyel dió egyoldalas","Lengyel multigloss egyoldalas","Lengyel antracit famintás egyoldalas","Lengyel winchester egyoldalas"]')
    RETURNING id INTO l_fam_egy;

  INSERT INTO public.color_palettes (manufacturer_id, name, colors) VALUES
    (lengyel_id, 'Famintás kétoldalas', '["Lengyel aranytölgy kétoldalas","Lengyel dió kétoldalas","Lengyel multigloss kétoldalas","Lengyel antracit famintás kétoldalas"]')
    RETURNING id INTO l_fam_ket;

  -- ---- SAJÁT GYÁRTÁS PALETTES ----
  INSERT INTO public.color_palettes (manufacturer_id, name, colors) VALUES
    (sajat_id, 'Fényes', '["RAL3009","RAL3011","RAL7016","RAL8017","RAL9002"]')
    RETURNING id INTO s_fenyes;

  INSERT INTO public.color_palettes (manufacturer_id, name, colors) VALUES
    (sajat_id, 'Mat', '["Mat8017","Mat3009","Mat7016"]')
    RETURNING id INTO s_mat;

  INSERT INTO public.color_palettes (manufacturer_id, name, colors) VALUES
    (sajat_id, 'Famintás egyoldalas', '["Aranytölgy egyoldalas","Dió egyoldalas"]')
    RETURNING id INTO s_fam_egy;

  INSERT INTO public.color_palettes (manufacturer_id, name, colors) VALUES
    (sajat_id, 'Famintás kétoldalas', '["Dió kétoldalas"]')
    RETURNING id INTO s_fam_ket;

  -- ---- MS PALETTES ----
  INSERT INTO public.color_palettes (manufacturer_id, name, colors) VALUES
    (ms_id, 'Fényes', '["RAL1002","RAL1015","RAL3000","RAL3009","RAL3011","RAL5010","RAL6011","RAL6020","RAL7016","RAL7035","RAL8004","RAL8017","RAL9002","RAL9006","RAL9007","RAL9010"]')
    RETURNING id INTO ms_fenyes;

  INSERT INTO public.color_palettes (manufacturer_id, name, colors) VALUES
    (ms_id, 'Mat', '["Mat3009","Mat3011","Mat8017","Mat9005","Mat7016","Mat8004"]')
    RETURNING id INTO ms_mat;

  INSERT INTO public.color_palettes (manufacturer_id, name, colors) VALUES
    (ms_id, 'Famintás egyoldalas', '["Aranytölgy egyoldalas","Dió egyoldalas","Fenyő egyoldalas","Sonoma tölgy egyoldalas"]')
    RETURNING id INTO ms_fam_egy;

  INSERT INTO public.color_palettes (manufacturer_id, name, colors) VALUES
    (ms_id, 'Famintás kétoldalas', '["Aranytölgy kétoldalas","Dió kétoldalas"]')
    RETURNING id INTO ms_fam_ket;

  -- ============================================================
  -- LENGYEL CSEREPESLEMEZ
  -- ============================================================

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (cserep_cat, lengyel_id, 'Bona Plus', 1.19, 1.10, '0,45mm', 1) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3135 FROM p
  UNION ALL SELECT p.id, l_std_mat, 3015 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3275 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (cserep_cat, lengyel_id, 'Bona Plus', 1.19, 1.10, '0,5mm', 2) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3285 FROM p
  UNION ALL SELECT p.id, l_std_mat, 3150 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3435 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (cserep_cat, lengyel_id, 'Perla Plus', 1.15, 1.06, '0,45mm', 3) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3215 FROM p
  UNION ALL SELECT p.id, l_std_mat, 3075 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3345 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (cserep_cat, lengyel_id, 'Perla Plus', 1.15, 1.06, '0,5mm', 4) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3275 FROM p
  UNION ALL SELECT p.id, l_std_mat, 3225 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3500 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (cserep_cat, lengyel_id, 'Amalfi Plus', 1.20, 1.14, '0,45mm', 5) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3360 FROM p
  UNION ALL SELECT p.id, l_std_mat, 3215 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3490 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (cserep_cat, lengyel_id, 'Amalfi Plus', 1.20, 1.14, '0,5mm', 6) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3500 FROM p
  UNION ALL SELECT p.id, l_std_mat, 3370 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3625 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (cserep_cat, lengyel_id, 'Beskid Plus', 1.20, 1.13, '0,45mm', 7) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3150 FROM p
  UNION ALL SELECT p.id, l_std_mat, 3035 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3295 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (cserep_cat, lengyel_id, 'Beskid Plus', 1.20, 1.13, '0,5mm', 8) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3315 FROM p
  UNION ALL SELECT p.id, l_std_mat, 3185 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3465 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (cserep_cat, lengyel_id, 'Lima Plus', 1.202, 1.171, '0,45mm', 9) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3250 FROM p
  UNION ALL SELECT p.id, l_std_mat, 3120 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3390 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (cserep_cat, lengyel_id, 'Lima Plus', 1.202, 1.171, '0,5mm', 10) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3400 FROM p
  UNION ALL SELECT p.id, l_std_mat, 3265 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3550 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (cserep_cat, lengyel_id, 'PDT-19', 1.095, 1.065, '0,5mm', 11) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3470 FROM p
  UNION ALL SELECT p.id, l_std_mat, 3350 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3640 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (cserep_cat, lengyel_id, 'PD28/540', 0.54, 0.49, '0,5mm', 12) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 4370 FROM p
  UNION ALL SELECT p.id, l_std_mat, 4160 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 4520 FROM p;

  -- ============================================================
  -- LENGYEL TRAPÉZLEMEZ
  -- ============================================================

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, lengyel_id, 'T-8', 1.19, 1.17, '0,45mm', 1) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 2985 FROM p
  UNION ALL SELECT p.id, l_std_mat, 2870 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3120 FROM p
  UNION ALL SELECT p.id, l_fam_egy, 3890 FROM p
  UNION ALL SELECT p.id, l_fam_ket, 4250 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, lengyel_id, 'T-8', 1.19, 1.17, '0,5mm', 2) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3120 FROM p
  UNION ALL SELECT p.id, l_std_mat, 3015 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3275 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, lengyel_id, 'T-14', 1.16, 1.12, '0,45mm', 3) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3020 FROM p
  UNION ALL SELECT p.id, l_std_mat, 2920 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3170 FROM p
  UNION ALL SELECT p.id, l_fam_egy, 3890 FROM p
  UNION ALL SELECT p.id, l_fam_ket, 4250 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, lengyel_id, 'T-14', 1.16, 1.12, '0,5mm', 4) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3175 FROM p
  UNION ALL SELECT p.id, l_std_mat, 3060 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3330 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, lengyel_id, 'T-18', 1.14, 1.10, '0,45mm', 5) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3020 FROM p
  UNION ALL SELECT p.id, l_std_mat, 2920 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3195 FROM p
  UNION ALL SELECT p.id, l_fam_egy, 3890 FROM p
  UNION ALL SELECT p.id, l_fam_ket, 4250 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, lengyel_id, 'T-18', 1.14, 1.10, '0,5mm', 6) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3175 FROM p
  UNION ALL SELECT p.id, l_std_mat, 3060 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3370 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, lengyel_id, 'T-35', 1.08, 1.05, '0,45mm', 7) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3310 FROM p
  UNION ALL SELECT p.id, l_std_mat, 3175 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3455 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, lengyel_id, 'T-35', 1.08, 1.05, '0,5mm', 8) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3465 FROM p
  UNION ALL SELECT p.id, l_std_mat, 3350 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3640 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, lengyel_id, 'T-55', 1.04, 1.00, '0,5mm', 9) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 3555 FROM p
  UNION ALL SELECT p.id, l_std_mat, 3425 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 3725 FROM p;

  -- ============================================================
  -- SAJÁT GYÁRTÁS TRAPÉZLEMEZ
  -- ============================================================

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, sajat_id, 'T-8', 1.18, 1.13, '0,38mm', 1) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, s_fenyes, 2190 FROM p
  UNION ALL SELECT p.id, s_mat, 2190 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, sajat_id, 'T-8', 1.18, 1.13, '0,45mm', 2) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, s_fenyes, 2690 FROM p
  UNION ALL SELECT p.id, s_mat, 2690 FROM p
  UNION ALL SELECT p.id, s_fam_egy, 3490 FROM p
  UNION ALL SELECT p.id, s_fam_ket, 3990 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, sajat_id, 'T-14', 1.10, 1.02, '0,38mm', 3) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, s_fenyes, 2190 FROM p
  UNION ALL SELECT p.id, s_mat, 2190 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, sajat_id, 'T-14', 1.10, 1.02, '0,45mm', 4) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, s_fenyes, 2690 FROM p
  UNION ALL SELECT p.id, s_mat, 2690 FROM p
  UNION ALL SELECT p.id, s_fam_egy, 3490 FROM p
  UNION ALL SELECT p.id, s_fam_ket, 3990 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, sajat_id, 'T-18', 1.15, 1.10, '0,38mm', 5) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, s_fenyes, 2190 FROM p
  UNION ALL SELECT p.id, s_mat, 2190 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, sajat_id, 'T-18', 1.15, 1.10, '0,45mm', 6) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, s_fenyes, 2690 FROM p
  UNION ALL SELECT p.id, s_mat, 2690 FROM p
  UNION ALL SELECT p.id, s_fam_egy, 3490 FROM p
  UNION ALL SELECT p.id, s_fam_ket, 3990 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, sajat_id, 'T-35', 1.05, 0.98, '0,38mm', 7) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, s_fenyes, 2390 FROM p
  UNION ALL SELECT p.id, s_mat, 2390 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, sajat_id, 'T-35', 1.05, 0.98, '0,45mm', 8) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, s_fenyes, 2890 FROM p
  UNION ALL SELECT p.id, s_mat, 2890 FROM p
  UNION ALL SELECT p.id, s_fam_egy, 3690 FROM p
  UNION ALL SELECT p.id, s_fam_ket, 4190 FROM p;

  -- ============================================================
  -- MS TRAPÉZLEMEZ
  -- ============================================================

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, ms_id, 'T-8', 1.18, 1.13, '0,45mm', 1) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, ms_fenyes, 2795 FROM p
  UNION ALL SELECT p.id, ms_mat, 3325 FROM p
  UNION ALL SELECT p.id, ms_fam_egy, 3890 FROM p
  UNION ALL SELECT p.id, ms_fam_ket, 4250 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, ms_id, 'T-8', 1.18, 1.13, '0,5mm', 2) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, ms_fenyes, 3125 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, ms_id, 'T-20/1160', 1.16, 1.12, '0,45mm', 3) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, ms_fenyes, 2795 FROM p
  UNION ALL SELECT p.id, ms_mat, 3325 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, ms_id, 'T-20/1120', 1.12, 1.08, '0,45mm', 4) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, ms_fenyes, 2795 FROM p
  UNION ALL SELECT p.id, ms_mat, 3325 FROM p
  UNION ALL SELECT p.id, ms_fam_egy, 3890 FROM p
  UNION ALL SELECT p.id, ms_fam_ket, 4250 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, ms_id, 'T-38', 1.10, 1.00, '0,45mm', 5) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, ms_fenyes, 2795 FROM p
  UNION ALL SELECT p.id, ms_mat, 3325 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, ms_id, 'T-45', 1.05, 0.98, '0,45mm', 6) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, ms_fenyes, 2795 FROM p
  UNION ALL SELECT p.id, ms_mat, 3325 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, full_width, useful_width, thickness, sort_order)
    VALUES (trapez_cat, ms_id, 'T-50', 1.08, 1.04, '0,45mm', 7) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, ms_fenyes, 2795 FROM p
  UNION ALL SELECT p.id, ms_mat, 3325 FROM p;

  -- ============================================================
  -- KERÍTÉSELEMEK (fm áras, mindkét gyártó palettája)
  -- ============================================================
  -- A kerítéselemek mindkét gyártónál elérhetők, de a palettákat
  -- a lengyel gyártó alá vesszük (minden szín)

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, sort_order)
    VALUES (keretes_cat, lengyel_id, 'Dobozos 16 cm', 1) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 2490 FROM p
  UNION ALL SELECT p.id, l_std_mat, 2490 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 2490 FROM p
  UNION ALL SELECT p.id, l_fam_egy, 2590 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, sort_order)
    VALUES (keretes_cat, lengyel_id, 'Dobozos 15 cm', 2) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 2490 FROM p
  UNION ALL SELECT p.id, l_std_mat, 2490 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 2490 FROM p
  UNION ALL SELECT p.id, l_fam_egy, 2590 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, sort_order)
    VALUES (keretes_cat, lengyel_id, 'Dobozos 14 cm', 3) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 2490 FROM p
  UNION ALL SELECT p.id, l_std_mat, 2490 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 2490 FROM p
  UNION ALL SELECT p.id, l_fam_egy, 2590 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, sort_order)
    VALUES (keretes_cat, lengyel_id, 'Dobozos 13 cm', 4) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 2490 FROM p
  UNION ALL SELECT p.id, l_std_mat, 2490 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 2490 FROM p
  UNION ALL SELECT p.id, l_fam_egy, 2590 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, sort_order)
    VALUES (keretes_cat, lengyel_id, 'Dobozos 12 cm', 5) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 2490 FROM p
  UNION ALL SELECT p.id, l_std_mat, 2490 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 2490 FROM p
  UNION ALL SELECT p.id, l_fam_egy, 2590 FROM p;

  WITH p AS (INSERT INTO public.products (category_id, manufacturer_id, name, sort_order)
    VALUES (keretes_cat, lengyel_id, '"U" profil 3×3,2×3cm', 6) RETURNING id)
  INSERT INTO public.product_variants (product_id, palette_id, price_net) SELECT p.id, l_fenyes, 1800 FROM p
  UNION ALL SELECT p.id, l_std_mat, 1800 FROM p
  UNION ALL SELECT p.id, l_ultra_mat, 1800 FROM p
  UNION ALL SELECT p.id, l_fam_egy, 1800 FROM p;

END $$;
