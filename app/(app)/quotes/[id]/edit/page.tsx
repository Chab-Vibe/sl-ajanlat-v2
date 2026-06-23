import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuoteForm } from "@/components/quotes/quote-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { QuoteItemFormData } from "@/types";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: quote } = await supabase
    .from("quotes")
    .select(`*, items:quote_items(*)`)
    .eq("id", id)
    .single();

  if (!quote) notFound();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && quote.created_by !== user.id) {
    redirect(`/quotes/${id}`);
  }

  const [
    { data: categories },
    { data: manufacturers },
    { data: products },
    { data: palettes },
    { data: variants },
  ] = await Promise.all([
    supabase.from("product_categories").select("*").order("sort_order"),
    supabase.from("manufacturers").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("products").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("color_palettes").select("*"),
    supabase.from("product_variants").select("*").eq("is_available", true),
  ]);

  type RawItem = {
    id: string;
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
    sort_order: number;
    with_anticondens: boolean;
    anticondens_price: number;
  };

  const rawItems = ((quote.items ?? []) as RawItem[])
    .sort((a, b) => a.sort_order - b.sort_order);

  // Group consecutive rows with the same product+variant+color into one form item
  const groupedItems: QuoteItemFormData[] = [];
  for (const row of rawItems) {
    const last = groupedItems[groupedItems.length - 1];
    const sameProduct =
      last &&
      (row.product_id ?? "") === last.product_id &&
      (row.variant_id ?? "") === last.variant_id &&
      (row.color_code ?? null) === last.color_code &&
      row.unit === last.unit &&
      (row.anticondens_price ?? 0) === last.anticondens_price;
    if (sameProduct) {
      last.quantity_rows.push({
        piece_count: row.piece_count ?? null,
        quantity: row.quantity,
        with_anticondens: row.with_anticondens ?? false,
      });
    } else {
      groupedItems.push({
        id: row.id,
        product_id: row.product_id ?? "",
        variant_id: row.variant_id ?? "",
        custom_description: row.custom_description ?? "",
        quantity_rows: [{ piece_count: row.piece_count ?? null, quantity: row.quantity, with_anticondens: row.with_anticondens ?? false }],
        unit: row.unit,
        unit_price_base: row.unit_price_base,
        unit_price_override: row.unit_price_override,
        discount_percent: row.discount_percent,
        color_code: row.color_code ?? null,
        sort_order: row.sort_order,
        anticondens_price: row.anticondens_price ?? 0,
      });
    }
  }

  const initialData = {
    customer_type: quote.customer_type as "magánszemély" | "cég",
    customer_name: quote.customer_name,
    customer_email: quote.customer_email ?? "",
    customer_phone: quote.customer_phone ?? "",
    customer_address: quote.customer_address ?? "",
    customer_tax_number: quote.customer_tax_number ?? "",
    vat_type: quote.vat_type as "normál" | "fordított",
    global_discount: quote.global_discount,
    notes: quote.notes ?? "",
    valid_until: quote.valid_until ?? "",
    items: groupedItems,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/quotes/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Ajánlat szerkesztése</h1>
          <p className="text-muted-foreground text-sm">{quote.quote_number}</p>
        </div>
      </div>

      <QuoteForm
        categories={categories ?? []}
        manufacturers={manufacturers ?? []}
        products={products ?? []}
        palettes={palettes ?? []}
        variants={variants ?? []}
        initialData={initialData}
        quoteId={id}
      />
    </div>
  );
}
