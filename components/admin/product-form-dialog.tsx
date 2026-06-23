"use client";

import { useState } from "react";
import { toast } from "sonner";
import { upsertProduct } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type {
  ProductCategory,
  Manufacturer,
  ColorPalette,
  Product,
  ProductVariant,
} from "@/types";

interface ProductFormDialogProps {
  categories: ProductCategory[];
  manufacturers: Manufacturer[];
  palettes: ColorPalette[];
  product?: Product;
  variants?: ProductVariant[];
  children: React.ReactNode;
}

interface PalettePrice {
  palette_id: string;
  price_net: number;
  is_available: boolean;
}

export function ProductFormDialog({
  categories,
  manufacturers,
  palettes,
  product,
  variants = [],
  children,
}: ProductFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [manufacturerId, setManufacturerId] = useState(
    product?.manufacturer_id ?? ""
  );
  const [fullWidth, setFullWidth] = useState(
    product?.full_width?.toString() ?? ""
  );
  const [usefulWidth, setUsefulWidth] = useState(
    product?.useful_width?.toString() ?? ""
  );
  const [thickness, setThickness] = useState(product?.thickness ?? "");
  const [isActive, setIsActive] = useState(product?.is_active ?? true);

  // Palette-based variant prices
  const [palettePrices, setPalettePrices] = useState<PalettePrice[]>(() => {
    return variants
      .filter((v) => v.palette_id)
      .map((v) => ({
        palette_id: v.palette_id!,
        price_net: v.price_net,
        is_available: v.is_available,
      }));
  });

  const mfrPalettes = palettes.filter(
    (p) => !manufacturerId || p.manufacturer_id === manufacturerId
  );

  function togglePalette(paletteId: string, checked: boolean) {
    if (checked) {
      setPalettePrices((prev) => [
        ...prev,
        { palette_id: paletteId, price_net: 0, is_available: true },
      ]);
    } else {
      setPalettePrices((prev) =>
        prev.filter((pp) => pp.palette_id !== paletteId)
      );
    }
  }

  function updatePrice(paletteId: string, price: number) {
    setPalettePrices((prev) =>
      prev.map((pp) =>
        pp.palette_id === paletteId ? { ...pp, price_net: price } : pp
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !categoryId || !manufacturerId) {
      toast.error("Töltse ki a kötelező mezőket");
      return;
    }
    setLoading(true);
    try {
      await upsertProduct(
        {
          name,
          category_id: categoryId,
          manufacturer_id: manufacturerId,
          full_width: fullWidth ? parseFloat(fullWidth) : null,
          useful_width: usefulWidth ? parseFloat(usefulWidth) : null,
          thickness,
          is_active: isActive,
          sort_order: product?.sort_order ?? 0,
          palette_prices: palettePrices,
        },
        product?.id
      );
      toast.success(
        product ? "Termék frissítve" : "Termék létrehozva"
      );
      setOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Hiba történt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Termék szerkesztése" : "Új termék hozzáadása"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>Terméknév *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="pl. T-8, Bona Plus"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Kategória *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Gyártó *</Label>
              <Select
                value={manufacturerId}
                onValueChange={(v) => {
                  setManufacturerId(v);
                  setPalettePrices([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon..." />
                </SelectTrigger>
                <SelectContent>
                  {manufacturers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Teljes szélesség (m)</Label>
              <Input
                type="number"
                step={0.001}
                value={fullWidth}
                onChange={(e) => setFullWidth(e.target.value)}
                placeholder="pl. 1.19"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Hasznos szélesség (m)</Label>
              <Input
                type="number"
                step={0.001}
                value={usefulWidth}
                onChange={(e) => setUsefulWidth(e.target.value)}
                placeholder="pl. 1.10"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Vastagság</Label>
              <Input
                value={thickness}
                onChange={(e) => setThickness(e.target.value)}
                placeholder="pl. 0.45mm"
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Aktív</Label>
            </div>
          </div>

          {/* Palette price assignment */}
          {manufacturerId && mfrPalettes.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Elérhető szín-palettók és árak (Ft/{categoryId ? categories.find(c => c.id === categoryId)?.unit ?? "m2" : "m2"})
              </Label>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {mfrPalettes.map((palette) => {
                  const pp = palettePrices.find(
                    (p) => p.palette_id === palette.id
                  );
                  const checked = !!pp;

                  return (
                    <div
                      key={palette.id}
                      className="flex items-center gap-3 p-2 rounded-lg border"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          togglePalette(palette.id, !!v)
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{palette.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {(palette.colors as string[]).slice(0, 5).join(", ")}
                          {(palette.colors as string[]).length > 5 &&
                            ` +${(palette.colors as string[]).length - 5}`}
                        </p>
                      </div>
                      {checked && (
                        <Input
                          type="number"
                          min={0}
                          className="w-32 h-7 text-sm"
                          placeholder="Ár (Ft)"
                          value={pp?.price_net ?? ""}
                          onChange={(e) =>
                            updatePrice(
                              palette.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Mégsem
            </Button>
            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {product ? "Mentés" : "Létrehozás"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
