"use client";

import { useState } from "react";
import { toast } from "sonner";
import { toggleUserRole, toggleUserActive } from "@/app/actions/users";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ShieldCheck, User, UserX, UserCheck } from "lucide-react";

interface UserRoleButtonProps {
  userId: string;
  currentRole: string;
  isActive: boolean;
}

export function UserRoleButton({
  userId,
  currentRole,
  isActive,
}: UserRoleButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleAction(action: () => Promise<void>) {
    setLoading(true);
    try {
      await action();
      toast.success("Frissítve");
    } catch {
      toast.error("Hiba történt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentRole === "user" ? (
          <DropdownMenuItem
            onClick={() =>
              handleAction(() => toggleUserRole(userId, "admin"))
            }
          >
            <ShieldCheck className="h-4 w-4" />
            Admin jogkör adása
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() =>
              handleAction(() => toggleUserRole(userId, "user"))
            }
          >
            <User className="h-4 w-4" />
            Admin jog elvétele
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {isActive ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() =>
              handleAction(() => toggleUserActive(userId, false))
            }
          >
            <UserX className="h-4 w-4" />
            Letiltás
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() =>
              handleAction(() => toggleUserActive(userId, true))
            }
          >
            <UserCheck className="h-4 w-4" />
            Aktiválás
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
