"use client";

import { useState } from "react";
import { toast } from "sonner";
import { upsertPalette } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Plus, X } from "lucide-react";
import type { Manufacturer, ColorPalette } from "@/types";

interface PaletteFormDialogProps {
  manufacturers: Manufacturer[];
  palette?: ColorPalette;
  defaultManufacturerId?: string;
  children: React.ReactNode;
}

export function PaletteFormDialog({
  manufacturers,
  palette,
  defaultManufacturerId,
  children,
}: PaletteFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manufacturerId, setManufacturerId] = useState(
    palette?.manufacturer_id ?? defaultManufacturerId ?? ""
  );
  const [name, setName] = useState(palette?.name ?? "");
  const [colors, setColors] = useState<string[]>(
    (palette?.colors as string[]) ?? []
  );
  const [newColor, setNewColor] = useState("");

  function addColor() {
    const c = newColor.trim();
    if (!c || colors.includes(c)) return;
    setColors((prev) => [...prev, c]);
    setNewColor("");
  }

  function removeColor(c: string) {
    setColors((prev) => prev.filter((x) => x !== c));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manufacturerId || !name.trim()) {
      toast.error("Töltse ki a kötelező mezőket");
      return;
    }
    setLoading(true);
    try {
      await upsertPalette(manufacturerId, name, colors, palette?.id);
      toast.success(palette ? "Paletta frissítve" : "Paletta létrehozva");
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {palette ? "Paletta szerkesztése" : "Új szín-paletta"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Gyártó *</Label>
            <Select value={manufacturerId} onValueChange={setManufacturerId}>
              <SelectTrigger>
                <SelectValue placeholder="Válasszon gyártót..." />
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
            <Label>Paletta neve *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="pl. Fényes, Ultra mat, Famintás egyoldalas"
            />
          </div>

          <div className="space-y-2">
            <Label>Színek / felületek</Label>
            <div className="flex gap-2">
              <Input
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addColor())}
                placeholder="pl. RAL7016 vagy Aranytölgy"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon" onClick={addColor}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter vagy + gombbal add hozzá a színt. Vesszővel elválasztva is beillesztheted.
            </p>

            {/* Bulk paste */}
            <textarea
              className="w-full text-xs p-2 border rounded-md resize-none h-16 text-muted-foreground"
              placeholder="Vagy illeszd be vesszővel elválasztva: RAL3000,RAL7016,Mat8017..."
              onPaste={(e) => {
                e.preventDefault();
                const text = e.clipboardData.getData("text");
                const parsed = text.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
                setColors(prev => [...new Set([...prev, ...parsed])]);
              }}
              onChange={(e) => {
                if (e.target.value) {
                  const parsed = e.target.value.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
                  setColors(prev => [...new Set([...prev, ...parsed])]);
                  e.target.value = "";
                }
              }}
            />

            <div className="flex flex-wrap gap-1.5 min-h-[36px]">
              {colors.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => removeColor(c)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {colors.length === 0 && (
                <p className="text-xs text-muted-foreground">Még nincs szín hozzáadva</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Mégsem
            </Button>
            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {palette ? "Mentés" : "Létrehozás"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
