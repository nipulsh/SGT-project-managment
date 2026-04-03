"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateDisplayName(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const revalidateBase = String(formData.get("revalidateBase") ?? "").trim();

  if (!name || name.length > 120) {
    return { error: "Name must be between 1 and 120 characters." };
  }

  const allowedPrefixes = [
    "/dashboard/student",
    "/dashboard/faculty",
    "/dashboard/dean",
  ] as const;
  const base = allowedPrefixes.find((p) => revalidateBase === p);
  if (!base) {
    return { error: "Invalid request." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in." };
  }

  const { error } = await supabase
    .from("users")
    .update({ name })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(base, "layout");
  revalidatePath(`${base}/profile`);
  revalidatePath(`${base}/settings`);
  return { ok: true as const };
}
