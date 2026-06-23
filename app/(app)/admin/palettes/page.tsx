import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaletteFormDialog } from "@/components/admin/palette-form-dialog";
import { PaletteDeleteButton } from "@/components/admin/palette-delete-button";
import { ManufacturerFormDialog } from "@/components/admin/manufacturer-form-dialog";
import { Plus, Edit, Palette } from "lucide-react";

export default async function AdminPalettesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const [{ data: manufacturers }, { data: palettes }] = await Promise.all([
    supabase.from("manufacturers").select("*").order("sort_order"),
    supabase.from("color_palettes").select("*"),
  ]);

  const palettesByMfr = new Map<string, typeof palettes>();
  for (const p of palettes ?? []) {
    if (!palettesByMfr.has(p.manufacturer_id))
      palettesByMfr.set(p.manufacturer_id, []);
    palettesByMfr.get(p.manufacturer_id)!.push(p);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Szín-palettók</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Elérhető szín-csoportok gyártónként
          </p>
        </div>
        <div className="flex gap-2">
          <ManufacturerFormDialog>
            <Button variant="outline">
              <Plus className="h-4 w-4" />
              Új gyártó
            </Button>
          </ManufacturerFormDialog>
          <PaletteFormDialog manufacturers={manufacturers ?? []}>
            <Button variant="accent">
              <Plus className="h-4 w-4" />
              Új paletta
            </Button>
          </PaletteFormDialog>
        </div>
      </div>

      {(manufacturers ?? []).map((mfr) => {
        const mfrPalettes = palettesByMfr.get(mfr.id) ?? [];

        return (
          <Card key={mfr.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {mfr.name}
                  <Badge variant="secondary" className="text-xs">
                    {mfrPalettes.length} paletta
                  </Badge>
                </CardTitle>
                <ManufacturerFormDialog manufacturer={mfr}>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-3.5 w-3.5" />
                    Szerkesztés
                  </Button>
                </ManufacturerFormDialog>
              </div>
            </CardHeader>
            <CardContent>
              {mfrPalettes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Még nincs paletta ehhez a gyártóhoz.
                </p>
              ) : (
                <div className="space-y-3">
                  {mfrPalettes.map((palette) => {
                    const colors = palette.colors as string[];
                    return (
                      <div
                        key={palette.id}
                        className="flex items-start justify-between gap-3 p-3 rounded-lg border"
                      >
                        <div className="flex items-start gap-3">
                          <Palette className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{palette.name}</p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {colors.map((c) => (
                                <span
                                  key={c}
                                  className="text-xs bg-muted px-1.5 py-0.5 rounded"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <PaletteFormDialog
                            manufacturers={manufacturers ?? []}
                            palette={palette}
                          >
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </PaletteFormDialog>
                          <PaletteDeleteButton paletteId={palette.id} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-3">
                <PaletteFormDialog
                  manufacturers={manufacturers ?? []}
                  defaultManufacturerId={mfr.id}
                >
                  <Button variant="outline" size="sm">
                    <Plus className="h-3.5 w-3.5" />
                    Paletta hozzáadása
                  </Button>
                </PaletteFormDialog>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
