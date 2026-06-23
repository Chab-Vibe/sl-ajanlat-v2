"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateQuoteNumber } from "@/lib/utils";
import type { QuoteFormData } from "@/types";

export async function createQuote(data: QuoteFormData, saveOnly: boolean = true) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nincs bejelentkezve");

  // Generate quote number
  const year = new Date().getFullYear();
  const { data: seq } = await supabase.rpc("next_quote_sequence", { p_year: year });
  const quoteNumber = generateQuoteNumber(seq ?? 1, year);

  // Insert quote
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      quote_number: quoteNumber,
      status: "draft",
      customer_type: data.customer_type,
      customer_name: data.customer_name.trim(),
      customer_email: data.customer_email || null,
      customer_phone: data.customer_phone || null,
      customer_address: data.customer_address || null,
      customer_tax_number: data.customer_tax_number || null,
      vat_type: data.vat_type,
      global_discount: data.global_discount,
      notes: data.notes || null,
      valid_until: data.valid_until || null,
      created_by: user.id,
      is_saved: saveOnly,
    })
    .select()
    .single();

  if (quoteError || !quote) throw new Error(quoteError?.message ?? "Hiba az ajánlat mentésekor");

  // Insert items – flatten quantity_rows → one DB row each
  if (data.items.length > 0) {
    const items = data.items.flatMap((item, groupIdx) =>
      item.quantity_rows.map((row, rowIdx) => ({
        quote_id: quote.id,
        sort_order: groupIdx * 100 + rowIdx,
        product_id: item.product_id || null,
        variant_id: item.variant_id || null,
        custom_description: item.custom_description || null,
        piece_count: row.piece_count ?? null,
        quantity: row.quantity,
        unit: item.unit,
        unit_price_base: item.unit_price_base,
        unit_price_override: item.unit_price_override,
        discount_percent: item.discount_percent,
        color_code: item.color_code || null,
      }))
    );

    const { error: itemsError } = await supabase.from("quote_items").insert(items);
    if (itemsError) throw new Error(itemsError.message);
  }

  revalidatePath("/quotes");
  revalidatePath("/dashboard");

  return quote.id;
}

export async function updateQuote(
  id: string,
  data: QuoteFormData
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nincs bejelentkezve");

  const { error: quoteError } = await supabase
    .from("quotes")
    .update({
      customer_type: data.customer_type,
      customer_name: data.customer_name.trim(),
      customer_email: data.customer_email || null,
      customer_phone: data.customer_phone || null,
      customer_address: data.customer_address || null,
      customer_tax_number: data.customer_tax_number || null,
      vat_type: data.vat_type,
      global_discount: data.global_discount,
      notes: data.notes || null,
      valid_until: data.valid_until || null,
    })
    .eq("id", id);

  if (quoteError) throw new Error(quoteError.message);

  // Replace items
  await supabase.from("quote_items").delete().eq("quote_id", id);

  if (data.items.length > 0) {
    const items = data.items.flatMap((item, groupIdx) =>
      item.quantity_rows.map((row, rowIdx) => ({
        quote_id: id,
        sort_order: groupIdx * 100 + rowIdx,
        product_id: item.product_id || null,
        variant_id: item.variant_id || null,
        custom_description: item.custom_description || null,
        piece_count: row.piece_count ?? null,
        quantity: row.quantity,
        unit: item.unit,
        unit_price_base: item.unit_price_base,
        unit_price_override: item.unit_price_override,
        discount_percent: item.discount_percent,
        color_code: item.color_code || null,
      }))
    );

    await supabase.from("quote_items").insert(items);
  }

  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
}

export async function updateQuoteStatus(id: string, status: "draft" | "sent" | "accepted" | "declined") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nincs bejelentkezve");

  await supabase.from("quotes").update({ status }).eq("id", id);
  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
  revalidatePath("/dashboard");
}

export async function deleteQuote(id: string) {
  const supabase = await createClient();
  await supabase.from("quotes").delete().eq("id", id);
  revalidatePath("/quotes");
  revalidatePath("/dashboard");
  redirect("/quotes");
}
