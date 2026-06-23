"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deletePalette } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

export function PaletteDeleteButton({ paletteId }: { paletteId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Biztosan törli a palettát?")) return;
    setLoading(true);
    try {
      await deletePalette(paletteId);
      toast.success("Paletta törölve");
    } catch {
      toast.error("Hiba a törléskor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
      disabled={loading}
      onClick={handleDelete}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
