import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  const role = profile?.role;
  if (role === "student" || role === "faculty" || role === "dean") {
    redirect(`/dashboard/${role}`);
  }

  redirect("/login?error=profile");
}
