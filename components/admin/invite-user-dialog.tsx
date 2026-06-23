"use client";

import { useState } from "react";
import { toast } from "sonner";
import { inviteUser } from "@/app/actions/users";
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
import { Loader2 } from "lucide-react";

export function InviteUserDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      toast.error("Töltse ki az összes mezőt");
      return;
    }
    setLoading(true);
    try {
      await inviteUser(email, name, role);
      toast.success("Felhasználó létrehozva. Jelszó-beállítási emailt kap.");
      setOpen(false);
      setEmail("");
      setName("");
      setRole("user");
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
          <DialogTitle>Felhasználó meghívása</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Teljes név *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kiss János"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email cím *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pelda@sllemez.hu"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Szerepkör</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "user")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Felhasználó</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Mégsem
            </Button>
            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Meghívás
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
