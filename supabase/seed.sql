-- ============================================================
-- SL Ajánlatkezelő – Reset + Cserepeslemez (Lengyel) seed
-- Futtatás: Supabase SQL Editor
-- Töröl MINDEN termék- és ajánlat-adatot, majd feltölti
-- kizárólag a Lengyel cserepeslemez katalógust.
-- ============================================================

-- 1. Összes adat törlése (FK sorrend szerint)
TRUNCATE TABLE
  quote_items,
  quotes,
  quote_sequences,
  product_variants,
  products,
  color_palettes,
  manufacturers,
  product_categories
RESTART IDENTITY CASCADE;

-- 2. Seed: Lengyel cserepeslemez
DO $$
DECLARE
  v_mfr       UUID;
  v_cat       UUID;
  v_fenyes    UUID;
  v_stdmat    UUID;
  v_ultramat  UUID;
  v_prod      UUID;
BEGIN

  -- ── Gyártó ──────────────────────────────────────────────
  INSERT INTO manufacturers (name, is_active, sort_order)
    VALUES ('Lengyel', true, 1)
    RETURNING id INTO v_mfr;

  -- ── Kategória ───────────────────────────────────────────
  INSERT INTO product_categories (name, unit, sort_order, default_anticondens)
    VALUES ('Cserepeslemez', 'm2', 1, true)
    RETURNING id INTO v_cat;

  -- ── Szín palettók ───────────────────────────────────────
  -- Fényes: 19 szín (+ Alucynk megtartva)
  INSERT INTO color_palettes (manufacturer_id, name, colors)
    VALUES (v_mfr, 'Fényes',
      '["RAL3000","RAL3005","RAL3009","RAL3011","RAL5010","RAL6005","RAL6011","RAL6020",
        "RAL7016","RAL7024","RAL7035","RAL8004","RAL8017","RAL9002","RAL9005","RAL9006",
        "RAL9007","RAL9010","Alucynk"]'::jsonb)
    RETURNING id INTO v_fenyes;

  -- Standard mat: 5 szín
  INSERT INTO color_palettes (manufacturer_id, name, colors)
    VALUES (v_mfr, 'Standard mat',
      '["Mat8017","Mat8004","Mat3009","Mat8019","Mat7016"]'::jsonb)
    RETURNING id INTO v_stdmat;

  -- Ultra mat: 10 szín
  INSERT INTO color_palettes (manufacturer_id, name, colors)
    VALUES (v_mfr, 'Ultra mat',
      '["Mat8017","Mat8004","Mat3009","Mat8019","Mat6020","Mat7024","Mat7016","Mat9005",
        "Mat3005","Mat6005"]'::jsonb)
    RETURNING id INTO v_ultramat;

  -- ── Bona Plus ───────────────────────────────────────────
  -- teljes szélesség: 1.19 m, hasznos: 1.10 m
  INSERT INTO products (category_id, manufacturer_id, name, full_width, useful_width, thickness, is_active, sort_order)
    VALUES (v_cat, v_mfr, 'Bona Plus', 1.19, 1.10, '0,45mm', true, 1)
    RETURNING id INTO v_prod;
  INSERT INTO product_variants (product_id, palette_id, price_net, is_available) VALUES
    (v_prod, v_fenyes,   3135, true),
    (v_prod, v_stdmat,   3015, true),
    (v_prod, v_ultramat, 3275, true);

  INSERT INTO products (category_id, manufacturer_id, name, full_width, useful_width, thickness, is_active, sort_order)
    VALUES (v_cat, v_mfr, 'Bona Plus', 1.19, 1.10, '0,5mm', true, 2)
    RETURNING id INTO v_prod;
  INSERT INTO product_variants (product_id, palette_id, price_net, is_available) VALUES
    (v_prod, v_fenyes,   3285, true),
    (v_prod, v_stdmat,   3150, true),
    (v_prod, v_ultramat, 3435, true);

  -- ── Perla Plus ──────────────────────────────────────────
  -- teljes szélesség: 1.15 m, hasznos: 1.06 m
  INSERT INTO products (category_id, manufacturer_id, name, full_width, useful_width, thickness, is_active, sort_order)
    VALUES (v_cat, v_mfr, 'Perla Plus', 1.15, 1.06, '0,45mm', true, 3)
    RETURNING id INTO v_prod;
  INSERT INTO product_variants (product_id, palette_id, price_net, is_available) VALUES
    (v_prod, v_fenyes,   3215, true),
    (v_prod, v_stdmat,   3075, true),
    (v_prod, v_ultramat, 3345, true);

  INSERT INTO products (category_id, manufacturer_id, name, full_width, useful_width, thickness, is_active, sort_order)
    VALUES (v_cat, v_mfr, 'Perla Plus', 1.15, 1.06, '0,5mm', true, 4)
    RETURNING id INTO v_prod;
  INSERT INTO product_variants (product_id, palette_id, price_net, is_available) VALUES
    (v_prod, v_fenyes,   3275, true),
    (v_prod, v_stdmat,   3225, true),
    (v_prod, v_ultramat, 3500, true);

  -- ── Amalfi Plus ─────────────────────────────────────────
  -- teljes szélesség: 1.20 m, hasznos: 1.14 m
  INSERT INTO products (category_id, manufacturer_id, name, full_width, useful_width, thickness, is_active, sort_order)
    VALUES (v_cat, v_mfr, 'Amalfi Plus', 1.20, 1.14, '0,45mm', true, 5)
    RETURNING id INTO v_prod;
  INSERT INTO product_variants (product_id, palette_id, price_net, is_available) VALUES
    (v_prod, v_fenyes,   3360, true),
    (v_prod, v_stdmat,   3215, true),
    (v_prod, v_ultramat, 3490, true);

  INSERT INTO products (category_id, manufacturer_id, name, full_width, useful_width, thickness, is_active, sort_order)
    VALUES (v_cat, v_mfr, 'Amalfi Plus', 1.20, 1.14, '0,5mm', true, 6)
    RETURNING id INTO v_prod;
  INSERT INTO product_variants (product_id, palette_id, price_net, is_available) VALUES
    (v_prod, v_fenyes,   3500, true),
    (v_prod, v_stdmat,   3370, true),
    (v_prod, v_ultramat, 3625, true);

  -- ── Beskid Plus ─────────────────────────────────────────
  -- teljes szélesség: 1.20 m, hasznos: 1.13 m
  INSERT INTO products (category_id, manufacturer_id, name, full_width, useful_width, thickness, is_active, sort_order)
    VALUES (v_cat, v_mfr, 'Beskid Plus', 1.20, 1.13, '0,45mm', true, 7)
    RETURNING id INTO v_prod;
  INSERT INTO product_variants (product_id, palette_id, price_net, is_available) VALUES
    (v_prod, v_fenyes,   3150, true),
    (v_prod, v_stdmat,   3035, true),
    (v_prod, v_ultramat, 3295, true);

  INSERT INTO products (category_id, manufacturer_id, name, full_width, useful_width, thickness, is_active, sort_order)
    VALUES (v_cat, v_mfr, 'Beskid Plus', 1.20, 1.13, '0,5mm', true, 8)
    RETURNING id INTO v_prod;
  INSERT INTO product_variants (product_id, palette_id, price_net, is_available) VALUES
    (v_prod, v_fenyes,   3315, true),
    (v_prod, v_stdmat,   3185, true),
    (v_prod, v_ultramat, 3465, true);

  -- ── Lima Plus ───────────────────────────────────────────
  -- teljes szélesség: 1.20 m, hasznos: 1.17 m
  INSERT INTO products (category_id, manufacturer_id, name, full_width, useful_width, thickness, is_active, sort_order)
    VALUES (v_cat, v_mfr, 'Lima Plus', 1.20, 1.17, '0,45mm', true, 9)
    RETURNING id INTO v_prod;
  INSERT INTO product_variants (product_id, palette_id, price_net, is_available) VALUES
    (v_prod, v_fenyes,   3250, true),
    (v_prod, v_stdmat,   3120, true),
    (v_prod, v_ultramat, 3390, true);

  INSERT INTO products (category_id, manufacturer_id, name, full_width, useful_width, thickness, is_active, sort_order)
    VALUES (v_cat, v_mfr, 'Lima Plus', 1.20, 1.17, '0,5mm', true, 10)
    RETURNING id INTO v_prod;
  INSERT INTO product_variants (product_id, palette_id, price_net, is_available) VALUES
    (v_prod, v_fenyes,   3400, true),
    (v_prod, v_stdmat,   3265, true),
    (v_prod, v_ultramat, 3550, true);

END $$;
