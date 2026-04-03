import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow, UserRole } from "@/lib/types";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { error: rpcError } = await supabase.rpc("ensure_auth_profile");
  if (rpcError && process.env.NODE_ENV === "development") {
    console.warn("[ensure_auth_profile]", rpcError.message);
  }

  const { data } = await supabase
    .from("users")
    .select("id, name, role, created_at")
    .eq("id", user.id)
    .single();
  return data as ProfileRow | null;
}

export async function requireProfile(): Promise<ProfileRow> {
  const profile = await getProfile();
  if (!profile) redirect("/login?error=profile");
  return profile;
}

export async function requireRole(role: UserRole): Promise<ProfileRow> {
  const profile = await requireProfile();
  if (profile.role !== role) {
    redirect(`/dashboard/${profile.role}`);
  }
  return profile;
}
