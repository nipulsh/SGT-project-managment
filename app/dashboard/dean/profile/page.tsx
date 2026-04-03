import { redirect } from "next/navigation";
import { AccountHeader } from "@/components/dashboard/account-header";
import { ProfileClient } from "@/components/dashboard/profile-client";
import { getProfile, requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const BASE = "/dashboard/dean";

export default async function DeanProfilePage() {
  await requireRole("dean");
  const profile = await getProfile();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!profile || !user) redirect("/login");

  return (
    <>
      <AccountHeader
        title="Your profile"
        subtitle="Name and account details"
        backHref={BASE}
        backLabel="Back to dashboard"
      />
      <ProfileClient
        initialName={profile.name}
        email={user.email ?? ""}
        role={profile.role}
        memberSinceLabel={formatDate(profile.created_at)}
        revalidateBase={BASE}
        settingsHref={`${BASE}/settings`}
      />
    </>
  );
}
