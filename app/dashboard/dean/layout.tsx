import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DeanTopBar } from "@/components/dashboard/dean-top-bar";
import { requireRole } from "@/lib/auth";

export default async function DeanDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("dean");
  return (
    <div className="bg-surface flex min-h-screen">
      <DashboardSidebar role="dean" />
      <div className="flex min-h-screen flex-1 flex-col md:pl-64">
        <DeanTopBar name={profile.name} />
        {children}
      </div>
    </div>
  );
}
