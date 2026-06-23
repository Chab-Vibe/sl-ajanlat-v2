import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";
import { ProductDeleteButton } from "@/components/admin/product-delete-button";
import { Plus, Package, Edit } from "lucide-react";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const [
    { data: categories },
    { data: manufacturers },
    { data: products },
    { data: palettes },
    { data: variants },
  ] = await Promise.all([
    supabase.from("product_categories").select("*").order("sort_order"),
    supabase.from("manufacturers").select("*").order("sort_order"),
    supabase.from("products").select("*").order("manufacturer_id").order("sort_order"),
    supabase.from("color_palettes").select("*"),
    supabase.from("product_variants").select("*"),
  ]);

  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c]));
  const mfrMap = new Map((manufacturers ?? []).map((m) => [m.id, m]));
  const variantsByProduct = new Map<string, typeof variants>();
  for (const v of variants ?? []) {
    if (!variantsByProduct.has(v.product_id)) variantsByProduct.set(v.product_id, []);
    variantsByProduct.get(v.product_id)!.push(v);
  }

  // Group products by manufacturer
  const byManufacturer = new Map<string, typeof products>();
  for (const p of products ?? []) {
    if (!byManufacturer.has(p.manufacturer_id)) byManufacturer.set(p.manufacturer_id, []);
    byManufacturer.get(p.manufacturer_id)!.push(p);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Termékek</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Termékek, árak és szín-hozzárendelések kezelése
          </p>
        </div>
        <ProductFormDialog
          categories={categories ?? []}
          manufacturers={manufacturers ?? []}
          palettes={palettes ?? []}
        >
          <Button variant="accent">
            <Plus className="h-4 w-4" />
            Új termék
          </Button>
        </ProductFormDialog>
      </div>

      {/* Manufacturers section */}
      {(manufacturers ?? []).map((mfr) => {
        const mfrProducts = byManufacturer.get(mfr.id) ?? [];
        if (mfrProducts.length === 0) return null;

        return (
          <Card key={mfr.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {mfr.name}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {mfrProducts.length} termék
                  </Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {mfrProducts.map((product) => {
                  const cat = categoryMap.get(product.category_id);
                  const pvs = variantsByProduct.get(product.id) ?? [];
                  const palettaIds = new Set(pvs.map((v) => v.palette_id).filter(Boolean));
                  const usedPalettes = (palettes ?? []).filter((p) => palettaIds.has(p.id));

                  return (
                    <div key={product.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{product.name}</p>
                              {product.thickness && (
                                <Badge variant="outline" className="text-xs">
                                  {product.thickness}
                                </Badge>
                              )}
                              {!product.is_active && (
                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                  Inaktív
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {cat?.name} · {cat?.unit ?? "—"}
                              {product.full_width && ` · ${product.full_width}m / ${product.useful_width}m`}
                            </p>

                            {/* Variants/Palettes summary */}
                            {pvs.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {usedPalettes.map((p) => {
                                  const v = pvs.find((v) => v.palette_id === p.id);
                                  return (
                                    <span
                                      key={p.id}
                                      className="text-xs bg-muted px-2 py-0.5 rounded"
                                    >
                                      {p.name}: {v ? formatCurrency(v.price_net) : "—"}
                                    </span>
                                  );
                                })}
                                {pvs
                                  .filter((v) => !v.palette_id && v.color_code)
                                  .map((v) => (
                                    <span
                                      key={v.id}
                                      className="text-xs bg-muted px-2 py-0.5 rounded"
                                    >
                                      {v.color_code}: {formatCurrency(v.price_net)}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <ProductFormDialog
                            categories={categories ?? []}
                            manufacturers={manufacturers ?? []}
                            palettes={palettes ?? []}
                            product={product}
                            variants={pvs}
                          >
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </ProductFormDialog>
                          <ProductDeleteButton productId={product.id} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {(products ?? []).length === 0 && (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Még nincs termék felvive</p>
            <ProductFormDialog
              categories={categories ?? []}
              manufacturers={manufacturers ?? []}
              palettes={palettes ?? []}
            >
              <Button variant="accent" size="sm" className="mt-3">
                <Plus className="h-4 w-4" />
                Első termék hozzáadása
              </Button>
            </ProductFormDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
