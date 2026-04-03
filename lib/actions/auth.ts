"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types";

/**
 * Supabase hosted projects rate-limit `signUp` (e.g. "only request after 55 seconds").
 * For local development you can set SIGNUP_BYPASS_RATE_LIMIT=true and
 * SUPABASE_SERVICE_ROLE_KEY so sign-up uses the Admin API instead (no public rate limit).
 * Do not enable the bypass in production.
 */
function shouldBypassSignupRateLimit() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.SIGNUP_BYPASS_RATE_LIMIT === "true" &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/dashboard");
}

export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim() || email.split("@")[0];
  const role = String(formData.get("role") ?? "student") as UserRole;
  const safeRole: UserRole =
    role === "faculty" || role === "dean" ? role : "student";

  if (shouldBypassSignupRateLimit()) {
    try {
      const admin = createAdminClient();
      const { error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: safeRole },
      });
      if (error) {
        redirect(`/signup?error=${encodeURIComponent(error.message)}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Signup failed";
      redirect(`/signup?error=${encodeURIComponent(msg)}`);
    }
    redirect("/login?notice=dev-account-ready");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role: safeRole },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback?next=/dashboard`,
    },
  });
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/login?notice=confirm-email");
}
