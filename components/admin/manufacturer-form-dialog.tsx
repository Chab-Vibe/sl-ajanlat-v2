"use client";

import { useState } from "react";
import { toast } from "sonner";
import { upsertManufacturer } from "@/app/actions/products";
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
import { Loader2 } from "lucide-react";
import type { Manufacturer } from "@/types";

interface ManufacturerFormDialogProps {
  manufacturer?: Manufacturer;
  children: React.ReactNode;
}

export function ManufacturerFormDialog({
  manufacturer,
  children,
}: ManufacturerFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(manufacturer?.name ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await upsertManufacturer(name, manufacturer?.id);
      toast.success(
        manufacturer ? "Gyártó frissítve" : "Gyártó létrehozva"
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {manufacturer ? "Gyártó szerkesztése" : "Új gyártó"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Gyártó neve *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="pl. Lengyel, MS, MB"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Mégsem
            </Button>
            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {manufacturer ? "Mentés" : "Létrehozás"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
