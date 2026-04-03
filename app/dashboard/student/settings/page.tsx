import { redirect } from "next/navigation";
import { AccountHeader } from "@/components/dashboard/account-header";
import { SettingsClient } from "@/components/dashboard/settings-client";
import { getProfile, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const BASE = "/dashboard/student";

export default async function StudentSettingsPage() {
  await requireRole("student");
  const profile = await getProfile();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!profile || !user) redirect("/login");

  return (
    <>
      <AccountHeader
        title="Settings"
        subtitle="Account and session"
        backHref={BASE}
        backLabel="Back to dashboard"
      />
      <SettingsClient
        email={user.email ?? ""}
        role={profile.role}
        profileHref={`${BASE}/profile`}
      />
    </>
  );
}
