import * as XLSX from "xlsx";

type UserRow = { id: string; name: string; role: string; created_at: string };
type ProjectRow = {
  id: string;
  title: string;
  description: string | null;
  domain: string | null;
  status: string;
  faculty_id: string | null;
  created_at: string;
  lead_full_name?: string | null;
  lead_roll_number?: string | null;
  lead_course?: string | null;
  lead_semester?: string | null;
  progress_summary?: string | null;
  mvp_timeline?: string | null;
  funds_requested?: number | string | null;
};
type MemberRow = { project_id: string; user_id: string };
type TeamStudentRow = {
  project_id: string;
  full_name: string;
  roll_number: string | null;
  course: string | null;
  semester: string | null;
  sort_order: number;
};
type ExternalFacultyRow = {
  project_id: string;
  full_name: string;
  contribution: string | null;
};
type PaymentRow = {
  id: string;
  project_id: string;
  approved_amount: number | string;
  status: string;
  receipt_url: string | null;
  created_at: string;
};
type PaymentDetailsRow = {
  project_id: string;
  account_number: string;
  ifsc: string;
  holder_name: string;
  qr_code_url: string | null;
  paytm_qr_url?: string | null;
};
type ExpenseRow = {
  project_id: string;
  amount: number | string;
  description: string | null;
  bill_url: string | null;
  created_at: string;
};
type ProgressRow = {
  project_id: string;
  title: string;
  description: string | null;
  created_at: string;
};

export type DeanExportTables = {
  allUsers: UserRow[];
  students: UserRow[];
  projects: ProjectRow[];
  projectMembers: MemberRow[];
  teamStudents: TeamStudentRow[];
  externalFaculty: ExternalFacultyRow[];
  payments: PaymentRow[];
  paymentDetails: PaymentDetailsRow[];
  expenses: ExpenseRow[];
  progressUpdates: ProgressRow[];
};

function projectTitleMap(projects: ProjectRow[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const p of projects) m.set(p.id, p.title);
  return m;
}

function userNameMap(users: UserRow[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const u of users) m.set(u.id, u.name);
  return m;
}

function appendJsonSheet(
  wb: XLSX.WorkBook,
  name: string,
  rows: Record<string, unknown>[],
) {
  const safeName = name.slice(0, 31);
  const data =
    rows.length > 0 ? rows : [{ _message: "No records" as const }];
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, safeName);
}

export function buildDeanExportWorkbook(tables: DeanExportTables): Buffer {
  const { projects, allUsers, students } = tables;
  const pTitle = projectTitleMap(projects);
  const uName = userNameMap(allUsers);

  const memberCountByUser = new Map<string, number>();
  for (const m of tables.projectMembers) {
    memberCountByUser.set(m.user_id, (memberCountByUser.get(m.user_id) ?? 0) + 1);
  }

  const studentsSheet = students.map((s) => ({
    user_id: s.id,
    name: s.name,
    created_at: s.created_at,
    projects_as_account_member: memberCountByUser.get(s.id) ?? 0,
  }));

  const projectsSheet = projects.map((p) => ({
    project_id: p.id,
    title: p.title,
    status: p.status,
    domain: p.domain ?? "",
    faculty_name: p.faculty_id ? uName.get(p.faculty_id) ?? "" : "",
    created_at: p.created_at,
    lead_full_name: p.lead_full_name ?? "",
    lead_roll_number: p.lead_roll_number ?? "",
    lead_course: p.lead_course ?? "",
    lead_semester: p.lead_semester ?? "",
    funds_requested_inr:
      p.funds_requested != null ? Number(p.funds_requested) : "",
    progress_summary: p.progress_summary ?? "",
    mvp_timeline: p.mvp_timeline ?? "",
    description: p.description ?? "",
  }));

  const membersSheet = tables.projectMembers.map((m) => ({
    project_id: m.project_id,
    project_title: pTitle.get(m.project_id) ?? m.project_id,
    user_id: m.user_id,
    member_name: uName.get(m.user_id) ?? "",
  }));

  const teamSheet = tables.teamStudents.map((t) => ({
    project_id: t.project_id,
    project_title: pTitle.get(t.project_id) ?? t.project_id,
    full_name: t.full_name,
    roll_number: t.roll_number ?? "",
    course: t.course ?? "",
    semester: t.semester ?? "",
    sort_order: t.sort_order,
  }));

  const paymentsSheet = tables.payments.map((pay) => ({
    payment_id: pay.id,
    project_id: pay.project_id,
    project_title: pTitle.get(pay.project_id) ?? pay.project_id,
    approved_amount_inr: Number(pay.approved_amount),
    status: pay.status,
    receipt_url: pay.receipt_url ?? "",
    created_at: pay.created_at,
  }));

  const detailsSheet = tables.paymentDetails.map((d) => ({
    project_id: d.project_id,
    project_title: pTitle.get(d.project_id) ?? d.project_id,
    holder_name: d.holder_name,
    account_number: d.account_number,
    ifsc: d.ifsc,
    qr_code_url: d.qr_code_url ?? "",
    paytm_qr_url: d.paytm_qr_url ?? "",
  }));

  const expensesSheet = tables.expenses.map((e) => ({
    project_id: e.project_id,
    project_title: pTitle.get(e.project_id) ?? e.project_id,
    amount_inr: Number(e.amount),
    description: e.description ?? "",
    bill_url: e.bill_url ?? "",
    created_at: e.created_at,
  }));

  const extFacultySheet = tables.externalFaculty.map((f) => ({
    project_id: f.project_id,
    project_title: pTitle.get(f.project_id) ?? f.project_id,
    full_name: f.full_name,
    contribution: f.contribution ?? "",
  }));

  const progressSheet = tables.progressUpdates.map((pr) => ({
    project_id: pr.project_id,
    project_title: pTitle.get(pr.project_id) ?? pr.project_id,
    title: pr.title,
    description: pr.description ?? "",
    created_at: pr.created_at,
  }));

  const wb = XLSX.utils.book_new();
  appendJsonSheet(wb, "Students", studentsSheet);
  appendJsonSheet(wb, "Projects", projectsSheet);
  appendJsonSheet(wb, "Project members", membersSheet);
  appendJsonSheet(wb, "Team students", teamSheet);
  appendJsonSheet(wb, "Payments", paymentsSheet);
  appendJsonSheet(wb, "Payment details", detailsSheet);
  appendJsonSheet(wb, "Expenses", expensesSheet);
  appendJsonSheet(wb, "External faculty", extFacultySheet);
  appendJsonSheet(wb, "Progress updates", progressSheet);

  return Buffer.from(
    XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer,
  );
}
