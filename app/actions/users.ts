"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleUserRole(userId: string, newRole: "admin" | "user") {
  const supabase = await createClient();
  await supabase
    .from("user_profiles")
    .update({ role: newRole })
    .eq("id", userId);
  revalidatePath("/admin/users");
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase
    .from("user_profiles")
    .update({ is_active: isActive })
    .eq("id", userId);
  revalidatePath("/admin/users");
}

export async function inviteUser(email: string, name: string, role: "admin" | "user") {
  const supabase = await createClient();

  // Create user via admin API
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name, role },
  });

  if (error) throw new Error(error.message);

  // The trigger will auto-create user_profiles, but we can update the name/role
  if (data.user) {
    await supabase
      .from("user_profiles")
      .update({ name, role })
      .eq("id", data.user.id);
  }

  revalidatePath("/admin/users");
}
