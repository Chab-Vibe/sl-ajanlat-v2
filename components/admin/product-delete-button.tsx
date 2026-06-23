"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteProduct } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

export function ProductDeleteButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Biztosan törli a terméket? (Csak akkor lehetséges, ha nincs ajánlatban.)"))
      return;
    setLoading(true);
    try {
      await deleteProduct(productId);
      toast.success("Termék törölve");
    } catch {
      toast.error("Hiba a törléskor (valószínűleg ajánlatban szerepel)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive"
      disabled={loading}
      onClick={handleDelete}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}
