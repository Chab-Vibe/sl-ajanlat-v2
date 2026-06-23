import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuoteForm } from "@/components/quotes/quote-form";

export default async function NewQuotePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Új ajánlat</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Töltse ki az ajánlat adatait
        </p>
      </div>

      <QuoteForm
        categories={categories ?? []}
        manufacturers={manufacturers ?? []}
        products={products ?? []}
        palettes={palettes ?? []}
        variants={variants ?? []}
      />
    </div>
  );
}
