-- ============================================================
-- SL Ajánlatkezelő – Supabase Schema
-- Futtatsd a Supabase SQL Editor-ban
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- MANUFACTURERS (Gyártók)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.manufacturers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCT CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'm2' CHECK (unit IN ('m2', 'fm', 'db')),
  sort_order INT NOT NULL DEFAULT 0,
  default_anticondens BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COLOR PALETTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.color_palettes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manufacturer_id UUID NOT NULL REFERENCES public.manufacturers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  colors JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE RESTRICT,
  manufacturer_id UUID NOT NULL REFERENCES public.manufacturers(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  full_width NUMERIC(6,3) NULL,
  useful_width NUMERIC(6,3) NULL,
  thickness TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCT VARIANTS (szín + ár)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  palette_id UUID NULL REFERENCES public.color_palettes(id) ON DELETE SET NULL,
  color_code TEXT NULL,
  price_net NUMERIC(12,2) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- QUOTE NUMBER SEQUENCE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quote_sequences (
  year INT PRIMARY KEY,
  last_seq INT NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.next_quote_sequence(p_year INT)
RETURNS INT AS $$
DECLARE
  v_seq INT;
BEGIN
  INSERT INTO public.quote_sequences (year, last_seq)
  VALUES (p_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET last_seq = quote_sequences.last_seq + 1
  RETURNING last_seq INTO v_seq;
  RETURN v_seq;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- QUOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'declined')),
  customer_type TEXT NOT NULL DEFAULT 'magánszemély'
    CHECK (customer_type IN ('magánszemély', 'cég')),
  customer_name TEXT NOT NULL,
  customer_email TEXT NULL,
  customer_phone TEXT NULL,
  customer_address TEXT NULL,
  customer_tax_number TEXT NULL,
  vat_type TEXT NOT NULL DEFAULT 'normál'
    CHECK (vat_type IN ('normál', 'fordított')),
  global_discount NUMERIC(5,2) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  valid_until DATE NULL,
  created_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_saved BOOLEAN NOT NULL DEFAULT true
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS quotes_updated_at ON public.quotes;
CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

-- ============================================================
-- QUOTE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  product_id UUID NULL REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID NULL REFERENCES public.product_variants(id) ON DELETE SET NULL,
  custom_description TEXT NULL,
  piece_count INTEGER NULL,
  quantity NUMERIC(12,3) NOT NULL,
  unit TEXT NOT NULL,
  unit_price_base NUMERIC(12,2) NOT NULL,
  unit_price_override NUMERIC(12,2) NULL,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  color_code TEXT NULL,
  with_anticondens BOOLEAN NOT NULL DEFAULT false,
  anticondens_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.color_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_sequences ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- user_profiles
CREATE POLICY "Users see own profile" ON public.user_profiles
  FOR SELECT USING (id = auth.uid() OR public.current_user_role() = 'admin');
CREATE POLICY "Admin updates profiles" ON public.user_profiles
  FOR UPDATE USING (public.current_user_role() = 'admin' OR id = auth.uid());

-- manufacturers (read all, write admin)
CREATE POLICY "All read manufacturers" ON public.manufacturers
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin write manufacturers" ON public.manufacturers
  FOR ALL USING (public.current_user_role() = 'admin');

-- product_categories (read all, write admin)
CREATE POLICY "All read categories" ON public.product_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin write categories" ON public.product_categories
  FOR ALL USING (public.current_user_role() = 'admin');

-- color_palettes (read all, write admin)
CREATE POLICY "All read palettes" ON public.color_palettes
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin write palettes" ON public.color_palettes
  FOR ALL USING (public.current_user_role() = 'admin');

-- products (read all, write admin)
CREATE POLICY "All read products" ON public.products
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin write products" ON public.products
  FOR ALL USING (public.current_user_role() = 'admin');

-- product_variants (read all, write admin)
CREATE POLICY "All read variants" ON public.product_variants
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin write variants" ON public.product_variants
  FOR ALL USING (public.current_user_role() = 'admin');

-- quotes (own or admin)
CREATE POLICY "Users see own quotes" ON public.quotes
  FOR SELECT USING (created_by = auth.uid() OR public.current_user_role() = 'admin');
CREATE POLICY "Users create quotes" ON public.quotes
  FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users update own quotes" ON public.quotes
  FOR UPDATE USING (created_by = auth.uid() OR public.current_user_role() = 'admin');
CREATE POLICY "Users delete own quotes" ON public.quotes
  FOR DELETE USING (created_by = auth.uid() OR public.current_user_role() = 'admin');

-- quote_items (via quotes ownership)
CREATE POLICY "Users see own quote items" ON public.quote_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_id
        AND (q.created_by = auth.uid() OR public.current_user_role() = 'admin')
    )
  );
CREATE POLICY "Users manage own quote items" ON public.quote_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_id
        AND (q.created_by = auth.uid() OR public.current_user_role() = 'admin')
    )
  );

-- quote_sequences (authenticated can call function)
CREATE POLICY "Auth read sequences" ON public.quote_sequences
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update sequences" ON public.quote_sequences
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- SEED: CATEGORIES
-- ============================================================
INSERT INTO public.product_categories (name, unit, sort_order) VALUES
  ('Trapézlemez', 'm2', 1),
  ('Cserepeslemez', 'm2', 2),
  ('Kerítéselem', 'fm', 3),
  ('Csatornarendszer', 'db', 4),
  ('Szendvicspanel', 'm2', 5),
  ('Élhajlítás', 'fm', 6)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: MANUFACTURERS
-- ============================================================
INSERT INTO public.manufacturers (name, sort_order) VALUES
  ('Lengyel', 1),
  ('Saját gyártás', 2),
  ('MS', 3)
ON CONFLICT DO NOTHING;
