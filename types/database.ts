export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          name: string;
          role: "admin" | "user";
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          role?: "admin" | "user";
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          role?: "admin" | "user";
          is_active?: boolean;
        };
        Relationships: [];
      };
      manufacturers: {
        Row: {
          id: string;
          name: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          name?: string;
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      product_categories: {
        Row: {
          id: string;
          name: string;
          unit: "m2" | "fm" | "db";
          sort_order: number;
          default_anticondens: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          unit: "m2" | "fm" | "db";
          sort_order?: number;
          default_anticondens?: boolean;
        };
        Update: {
          name?: string;
          unit?: "m2" | "fm" | "db";
          sort_order?: number;
          default_anticondens?: boolean;
        };
        Relationships: [];
      };
      color_palettes: {
        Row: {
          id: string;
          manufacturer_id: string;
          name: string;
          colors: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          manufacturer_id: string;
          name: string;
          colors: Json;
        };
        Update: {
          name?: string;
          colors?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "color_palettes_manufacturer_id_fkey";
            columns: ["manufacturer_id"];
            referencedRelation: "manufacturers";
            referencedColumns: ["id"];
          }
        ];
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          manufacturer_id: string;
          name: string;
          full_width: number | null;
          useful_width: number | null;
          thickness: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          manufacturer_id: string;
          name: string;
          full_width?: number | null;
          useful_width?: number | null;
          thickness?: string | null;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          category_id?: string;
          manufacturer_id?: string;
          name?: string;
          full_width?: number | null;
          useful_width?: number | null;
          thickness?: string | null;
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "product_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_manufacturer_id_fkey";
            columns: ["manufacturer_id"];
            referencedRelation: "manufacturers";
            referencedColumns: ["id"];
          }
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          palette_id: string | null;
          color_code: string | null;
          price_net: number;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          palette_id?: string | null;
          color_code?: string | null;
          price_net: number;
          is_available?: boolean;
        };
        Update: {
          palette_id?: string | null;
          color_code?: string | null;
          price_net?: number;
          is_available?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variants_palette_id_fkey";
            columns: ["palette_id"];
            referencedRelation: "color_palettes";
            referencedColumns: ["id"];
          }
        ];
      };
      quotes: {
        Row: {
          id: string;
          quote_number: string;
          status: "draft" | "sent" | "accepted" | "declined";
          customer_type: "magánszemély" | "cég";
          customer_name: string;
          customer_email: string | null;
          customer_phone: string | null;
          customer_address: string | null;
          customer_tax_number: string | null;
          vat_type: "normál" | "fordított";
          global_discount: number;
          notes: string | null;
          valid_until: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          is_saved: boolean;
        };
        Insert: {
          id?: string;
          quote_number: string;
          status?: "draft" | "sent" | "accepted" | "declined";
          customer_type: "magánszemély" | "cég";
          customer_name: string;
          customer_email?: string | null;
          customer_phone?: string | null;
          customer_address?: string | null;
          customer_tax_number?: string | null;
          vat_type?: "normál" | "fordított";
          global_discount?: number;
          notes?: string | null;
          valid_until?: string | null;
          created_by: string;
          is_saved?: boolean;
        };
        Update: {
          status?: "draft" | "sent" | "accepted" | "declined";
          customer_type?: "magánszemély" | "cég";
          customer_name?: string;
          customer_email?: string | null;
          customer_phone?: string | null;
          customer_address?: string | null;
          customer_tax_number?: string | null;
          vat_type?: "normál" | "fordított";
          global_discount?: number;
          notes?: string | null;
          valid_until?: string | null;
          is_saved?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quotes_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      quote_items: {
        Row: {
          id: string;
          quote_id: string;
          sort_order: number;
          product_id: string | null;
          variant_id: string | null;
          custom_description: string | null;
          piece_count: number | null;
          quantity: number;
          unit: string;
          unit_price_base: number;
          unit_price_override: number | null;
          discount_percent: number;
          color_code: string | null;
          with_anticondens: boolean;
          anticondens_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          sort_order?: number;
          product_id?: string | null;
          variant_id?: string | null;
          custom_description?: string | null;
          piece_count?: number | null;
          quantity: number;
          unit: string;
          unit_price_base: number;
          unit_price_override?: number | null;
          discount_percent?: number;
          color_code?: string | null;
          with_anticondens?: boolean;
          anticondens_price?: number;
        };
        Update: {
          sort_order?: number;
          product_id?: string | null;
          variant_id?: string | null;
          custom_description?: string | null;
          piece_count?: number | null;
          quantity?: number;
          unit?: string;
          unit_price_base?: number;
          unit_price_override?: number | null;
          discount_percent?: number;
          color_code?: string | null;
          with_anticondens?: boolean;
          anticondens_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey";
            columns: ["quote_id"];
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_items_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_items_variant_id_fkey";
            columns: ["variant_id"];
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          }
        ];
      };
      quote_sequences: {
        Row: {
          year: number;
          last_seq: number;
        };
        Insert: {
          year: number;
          last_seq?: number;
        };
        Update: {
          last_seq?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      next_quote_sequence: {
        Args: { p_year: number };
        Returns: number;
      };
      current_user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
