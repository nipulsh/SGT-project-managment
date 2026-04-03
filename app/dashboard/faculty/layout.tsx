import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { HashScroll } from "@/components/dashboard/hash-scroll";
import { requireRole } from "@/lib/auth";

export default async function FacultyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("faculty");
  return (
    <div className="bg-surface flex min-h-screen">
      <HashScroll />
      <DashboardSidebar role="faculty" />
      <div className="flex min-h-screen flex-1 flex-col md:pl-64">
        {children}
      </div>
    </div>
  );
}
