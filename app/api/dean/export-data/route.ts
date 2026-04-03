import { NextResponse } from "next/server";
import { buildDeanExportWorkbook } from "@/lib/export/dean-excel";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "dean") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    { data: allUsers, error: eUsers },
    { data: students, error: eStudents },
    { data: projects, error: eProjects },
    { data: projectMembers, error: eMembers },
    { data: teamStudents, error: eTeam },
    { data: externalFaculty, error: eExt },
    { data: payments, error: ePay },
    { data: paymentDetails, error: eDet },
    { data: expenses, error: eExp },
    { data: progressUpdates, error: eProg },
  ] = await Promise.all([
    supabase.from("users").select("id, name, role, created_at").order("name"),
    supabase.from("users").select("id, name, role, created_at").eq("role", "student").order("name"),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("project_members").select("project_id, user_id"),
    supabase.from("project_team_students").select("project_id, full_name, roll_number, course, semester, sort_order").order("project_id").order("sort_order"),
    supabase.from("project_external_faculty").select("project_id, full_name, contribution").order("project_id"),
    supabase.from("payments").select("id, project_id, approved_amount, status, receipt_url, created_at").order("created_at", { ascending: false }),
    supabase.from("payment_details").select("project_id, account_number, ifsc, holder_name, qr_code_url, paytm_qr_url"),
    supabase.from("expenses").select("project_id, amount, description, bill_url, created_at").order("created_at", { ascending: false }),
    supabase.from("progress_updates").select("project_id, title, description, created_at").order("created_at", { ascending: false }),
  ]);

  const firstErr =
    eUsers ??
    eStudents ??
    eProjects ??
    eMembers ??
    eTeam ??
    eExt ??
    ePay ??
    eDet ??
    eExp ??
    eProg;
  if (firstErr) {
    return NextResponse.json(
      { error: "Failed to load export data", detail: firstErr.message },
      { status: 500 },
    );
  }

  const buffer = buildDeanExportWorkbook({
    allUsers: allUsers ?? [],
    students: students ?? [],
    projects: projects ?? [],
    projectMembers: projectMembers ?? [],
    teamStudents: teamStudents ?? [],
    externalFaculty: externalFaculty ?? [],
    payments: payments ?? [],
    paymentDetails: paymentDetails ?? [],
    expenses: expenses ?? [],
    progressUpdates: progressUpdates ?? [],
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `students-projects-export-${stamp}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
