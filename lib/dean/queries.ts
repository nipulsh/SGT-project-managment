import { createClient } from "@/lib/supabase/server";
import { getSignedFileUrl } from "@/lib/storage";
import type { ProfileRow, ProjectRow } from "@/lib/types";

export type DeanProjectReviewDetail = {
  project: ProjectRow;
  facultyName: string | null;
  memberNames: string[];
  teamStudentLabels: string[];
  externalFacultyLines: string[];
  pptHref: string | null;
  budgetDocHref: string | null;
  imageHrefs: string[];
};

export async function fetchDeanProjectReviewDetail(
  projectId: string,
): Promise<DeanProjectReviewDetail | null> {
  const supabase = await createClient();
  const { data: projectRaw, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (error || !projectRaw) return null;

  const project = projectRaw as ProjectRow;

  const [{ data: teamS }, { data: extFac }] = await Promise.all([
    supabase
      .from("project_team_students")
      .select("full_name, roll_number")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("project_external_faculty")
      .select("full_name, contribution")
      .eq("project_id", project.id),
  ]);

  const teamStudentLabels =
    teamS?.map((r) => {
      const roll = r.roll_number?.trim();
      return roll ? `${r.full_name} (${roll})` : r.full_name;
    }) ?? [];

  const externalFacultyLines =
    extFac?.map((r) =>
      r.contribution?.trim()
        ? `${r.full_name} — ${r.contribution.trim()}`
        : r.full_name,
    ) ?? [];

  let facultyName: string | null = null;
  if (project.faculty_id) {
    const { data: fu } = await supabase
      .from("users")
      .select("name")
      .eq("id", project.faculty_id)
      .single();
    facultyName = fu?.name ?? null;
  }

  const { data: mems } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", project.id);
  const mids = mems?.map((m) => m.user_id) ?? [];
  let memberNames: string[] = [];
  if (mids.length) {
    const { data: unames } = await supabase
      .from("users")
      .select("name")
      .in("id", mids);
    memberNames = unames?.map((u) => u.name) ?? [];
  }

  const paths = project.project_image_paths ?? [];
  const [pptHref, budgetDocHref, ...imageResults] = await Promise.all([
    project.ppt_storage_path
      ? getSignedFileUrl("project-files", project.ppt_storage_path)
      : Promise.resolve(null),
    project.budget_doc_storage_path
      ? getSignedFileUrl("project-files", project.budget_doc_storage_path)
      : Promise.resolve(null),
    ...paths.map((p) => getSignedFileUrl("project-files", p)),
  ]);
  const imageHrefs = imageResults.filter((h): h is string => Boolean(h));

  return {
    project,
    facultyName,
    memberNames,
    teamStudentLabels,
    externalFacultyLines,
    pptHref,
    budgetDocHref,
    imageHrefs,
  };
}

export async function fetchDeanApprovalsData() {
  const supabase = await createClient();
  const [{ data: pendingProjects }, { data: facultyList }] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase.from("users").select("id, name").eq("role", "faculty"),
  ]);
  return {
    pending: (pendingProjects ?? []) as ProjectRow[],
    faculty: (facultyList ?? []) as Pick<ProfileRow, "id" | "name">[],
  };
}

export async function fetchDeanDirectory() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as ProjectRow[];
}

export async function fetchDeanApprovedProjects() {
  const directory = await fetchDeanDirectory();
  return directory.filter((p) => p.status === "approved");
}

async function fetchPaymentsWithTitles(status: "pending" | "paid") {
  const supabase = await createClient();
  let q = supabase
    .from("payments")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });
  if (status === "pending") {
    q = q.gt("approved_amount", 0);
  }
  const { data: rows } = await q;
  const list = rows ?? [];
  if (list.length === 0) return [];

  const ids = [...new Set(list.map((r) => r.project_id))];
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title")
    .in("id", ids);
  const titleByProject = new Map(
    (projects ?? []).map((p) => [p.id, p.title ?? ""]),
  );

  return list.map((r) => ({
    ...r,
    title: titleByProject.get(r.project_id) ?? r.project_id,
  }));
}

export type DeanPendingDisbursement = {
  id: string;
  project_id: string;
  approved_amount: number;
  status: string;
  receipt_url: string | null;
  created_at: string;
  title: string;
  payment_details: {
    account_number: string;
    ifsc: string;
    holder_name: string;
    qr_code_url: string | null;
    paytm_qr_url: string | null;
  } | null;
};

/** Pending payments with student bank / QR metadata for dean disbursement. */
export async function fetchDeanPendingDisbursements(): Promise<
  DeanPendingDisbursement[]
> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("payments")
    .select("*")
    .eq("status", "pending")
    .gt("approved_amount", 0)
    .order("created_at", { ascending: false });

  const list = rows ?? [];
  if (list.length === 0) return [];

  const ids = [...new Set(list.map((r) => r.project_id))];
  const [{ data: projects }, { data: detailsRows }] = await Promise.all([
    supabase.from("projects").select("id, title").in("id", ids),
    supabase.from("payment_details").select("*").in("project_id", ids),
  ]);

  const titleBy = new Map(
    (projects ?? []).map((p) => [p.id, p.title ?? ""]),
  );
  const detailsBy = new Map(
    (detailsRows ?? []).map((d) => [
      d.project_id,
      {
        account_number: d.account_number,
        ifsc: d.ifsc,
        holder_name: d.holder_name,
        qr_code_url: d.qr_code_url,
        paytm_qr_url: d.paytm_qr_url ?? null,
      },
    ]),
  );

  return list.map((r) => ({
    id: r.id,
    project_id: r.project_id,
    approved_amount: Number(r.approved_amount),
    status: r.status,
    receipt_url: r.receipt_url,
    created_at: r.created_at,
    title: titleBy.get(r.project_id) ?? r.project_id,
    payment_details: detailsBy.get(r.project_id) ?? null,
  }));
}

export async function fetchDeanPastPaymentsWithTitles() {
  return fetchPaymentsWithTitles("paid");
}

export async function fetchDeanOverviewCounts() {
  const supabase = await createClient();
  const [pendingRes, paymentsRes, projectsRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .gt("approved_amount", 0),
    supabase.from("projects").select("id", { count: "exact", head: true }),
  ]);
  return {
    pendingApprovals: pendingRes.count ?? 0,
    pendingPayments: paymentsRes.count ?? 0,
    totalProjects: projectsRes.count ?? 0,
  };
}
