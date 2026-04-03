import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { HashScroll } from "@/components/dashboard/hash-scroll";
import { requireRole } from "@/lib/auth";

export default async function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("student");
  return (
    <div className="bg-surface flex min-h-screen">
      <HashScroll />
      <DashboardSidebar role="student" />
      <div className="flex min-h-screen flex-1 flex-col md:pl-64">
        {children}
      </div>
    </div>
  );
}
