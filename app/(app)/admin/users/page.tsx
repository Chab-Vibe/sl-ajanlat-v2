import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRoleButton } from "@/components/admin/user-role-button";
import { InviteUserDialog } from "@/components/admin/invite-user-dialog";
import { Users, Plus } from "lucide-react";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: users } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Felhasználók</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Rendszer felhasználók kezelése
          </p>
        </div>
        <InviteUserDialog>
          <Button variant="accent">
            <Plus className="h-4 w-4" />
            Felhasználó meghívása
          </Button>
        </InviteUserDialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            {users?.length ?? 0} felhasználó
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {(users ?? []).map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{u.name}</p>
                      {!u.is_active && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Inaktív
                        </Badge>
                      )}
                      {u.id === user.id && (
                        <Badge variant="secondary" className="text-xs">
                          Te
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Regisztráció: {formatDate(u.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={u.role === "admin" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {u.role}
                  </Badge>
                  {u.id !== user.id && (
                    <UserRoleButton
                      userId={u.id}
                      currentRole={u.role}
                      isActive={u.is_active}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
