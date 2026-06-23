import type { Database } from "./database";

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type Manufacturer = Database["public"]["Tables"]["manufacturers"]["Row"];
export type ProductCategory = Database["public"]["Tables"]["product_categories"]["Row"];
export type ColorPalette = Database["public"]["Tables"]["color_palettes"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
export type Quote = Database["public"]["Tables"]["quotes"]["Row"];
export type QuoteItem = Database["public"]["Tables"]["quote_items"]["Row"];

export type ProductWithRelations = Product & {
  manufacturer: Manufacturer;
  category: ProductCategory;
  variants: (ProductVariant & { palette: ColorPalette | null })[];
};

export type QuoteWithItems = Quote & {
  items: (QuoteItem & {
    product: (Product & { category: ProductCategory }) | null;
    variant: (ProductVariant & { palette: ColorPalette | null }) | null;
  })[];
  creator: UserProfile;
};

export type QuoteFormData = {
  customer_type: "magánszemély" | "cég";
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_tax_number: string;
  vat_type: "normál" | "fordított";
  global_discount: number;
  notes: string;
  valid_until: string;
  items: QuoteItemFormData[];
};

export type QuoteItemQuantityRow = {
  piece_count: number | null;
  quantity: number;
};

export type QuoteItemFormData = {
  id?: string;
  product_id: string;
  variant_id: string;
  custom_description: string;
  quantity_rows: QuoteItemQuantityRow[];
  unit: string;
  unit_price_base: number;
  unit_price_override: number | null;
  discount_percent: number;
  color_code: string | null;
  sort_order: number;
};
