-- Migration: antikondenzációs filc sor-szintű opció
-- Futtatás: Supabase SQL Editor

-- Kategória szintű alapértelmezett
ALTER TABLE public.product_categories
  ADD COLUMN IF NOT EXISTS default_anticondens BOOLEAN NOT NULL DEFAULT false;

-- Cserepeslemez: alapból filces
UPDATE public.product_categories
  SET default_anticondens = true
  WHERE name = 'Cserepeslemez';

-- Sor szintű jelölők a quote_items táblán
-- (Ha már futott az előző migráció, ADD COLUMN IF NOT EXISTS biztonságos)
ALTER TABLE public.quote_items
  ADD COLUMN IF NOT EXISTS with_anticondens BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anticondens_price NUMERIC(10,2) NOT NULL DEFAULT 0;
