"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProductFormInput {
  name: string;
  category_id: string;
  manufacturer_id: string;
  full_width: number | null;
  useful_width: number | null;
  thickness: string;
  is_active: boolean;
  sort_order: number;
  palette_prices: Array<{
    palette_id: string;
    price_net: number;
    is_available: boolean;
  }>;
}

export async function upsertProduct(input: ProductFormInput, productId?: string) {
  const supabase = await createClient();

  const productData = {
    name: input.name.trim(),
    category_id: input.category_id,
    manufacturer_id: input.manufacturer_id,
    full_width: input.full_width,
    useful_width: input.useful_width,
    thickness: input.thickness || null,
    is_active: input.is_active,
    sort_order: input.sort_order,
  };

  let id = productId;

  if (productId) {
    await supabase.from("products").update(productData).eq("id", productId);
  } else {
    const { data } = await supabase
      .from("products")
      .insert(productData)
      .select("id")
      .single();
    id = data?.id;
  }

  if (!id) throw new Error("Termék mentése sikertelen");

  // Replace palette-based variants
  if (productId) {
    await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", productId)
      .not("palette_id", "is", null);
  }

  const newVariants = input.palette_prices
    .filter((pp) => pp.palette_id)
    .map((pp) => ({
      product_id: id!,
      palette_id: pp.palette_id,
      color_code: null,
      price_net: pp.price_net,
      is_available: pp.is_available,
    }));

  if (newVariants.length > 0) {
    await supabase.from("product_variants").insert(newVariants);
  }

  revalidatePath("/admin/products");
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", productId);
  revalidatePath("/admin/products");
}

export async function upsertManufacturer(name: string, id?: string) {
  const supabase = await createClient();
  if (id) {
    await supabase.from("manufacturers").update({ name }).eq("id", id);
  } else {
    await supabase.from("manufacturers").insert({ name });
  }
  revalidatePath("/admin/products");
  revalidatePath("/admin/palettes");
}

export async function upsertPalette(
  manufacturerId: string,
  name: string,
  colors: string[],
  id?: string
) {
  const supabase = await createClient();
  if (id) {
    await supabase
      .from("color_palettes")
      .update({ name, colors })
      .eq("id", id);
  } else {
    await supabase.from("color_palettes").insert({
      manufacturer_id: manufacturerId,
      name,
      colors,
    });
  }
  revalidatePath("/admin/palettes");
  revalidatePath("/admin/products");
}

export async function deletePalette(id: string) {
  const supabase = await createClient();
  await supabase.from("color_palettes").delete().eq("id", id);
  revalidatePath("/admin/palettes");
}
