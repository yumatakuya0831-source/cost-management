import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type AppUser = {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "viewer";
  is_active: boolean;
};

export const getCurrentAppUser = cache(async (): Promise<AppUser | null> => {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data, error } = await supabase
    .from("app_users")
    .select("id,email,display_name,role,is_active")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as AppUser;
});

export async function requireAdmin() {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "admin") {
    throw new Error("管理者権限が必要です。");
  }
  return user;
}
