"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function safeFileName(name: string) {
  return name.replace(/[^\w.-]/g, "_");
}

type TeamRow = {
  fullName: string;
  rollNumber?: string;
  course?: string;
  semester?: string;
};

type FacultyRow = {
  fullName: string;
  contribution?: string;
};

export async function submitProjectApplication(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "Unauthorized" };

  const { error: profileRpcErr } = await supabase.rpc("ensure_auth_profile");
  if (profileRpcErr) {
    return {
      ok: false as const,
      message: profileRpcErr.message,
    };
  }

  const title = String(formData.get("title") ?? "").trim();
  const domain = String(formData.get("domain") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const leadFullName = String(formData.get("lead_full_name") ?? "").trim();
  const leadRoll = String(formData.get("lead_roll_number") ?? "").trim();
  const leadCourse = String(formData.get("lead_course") ?? "").trim();
  const leadSemester = String(formData.get("lead_semester") ?? "").trim();
  const progressSummary = String(formData.get("progress_summary") ?? "").trim();
  const mvpTimeline = String(formData.get("mvp_timeline") ?? "").trim();
  const fundsRaw = String(formData.get("funds_requested") ?? "").trim();
  const fundsRequested = fundsRaw ? Number(fundsRaw) : NaN;

  const account_number = String(formData.get("account_number") ?? "").trim();
  const ifsc = String(formData.get("ifsc") ?? "").trim();
  const holder_name = String(formData.get("holder_name") ?? "").trim();

  if (!title) return { ok: false as const, message: "Project name is required" };
  if (!leadFullName)
    return { ok: false as const, message: "Student name is required" };
  if (!leadRoll)
    return { ok: false as const, message: "Roll number is required" };
  if (!leadCourse)
    return { ok: false as const, message: "Course is required" };
  if (!leadSemester)
    return { ok: false as const, message: "Semester is required" };
  if (!progressSummary)
    return { ok: false as const, message: "Progress so far is required" };
  if (!mvpTimeline)
    return { ok: false as const, message: "MVP timeline is required" };
  if (!Number.isFinite(fundsRequested) || fundsRequested < 0) {
    return { ok: false as const, message: "Valid funds requested is required" };
  }
  if (!account_number || !ifsc || !holder_name) {
    return { ok: false as const, message: "Bank account details are required" };
  }

  let team: TeamRow[] = [];
  let faculty: FacultyRow[] = [];
  try {
    team = JSON.parse(
      String(formData.get("team_students_json") ?? "[]"),
    ) as TeamRow[];
    faculty = JSON.parse(
      String(formData.get("external_faculty_json") ?? "[]"),
    ) as FacultyRow[];
  } catch {
    return { ok: false as const, message: "Invalid team or faculty payload" };
  }

  if (!Array.isArray(team)) team = [];
  if (!Array.isArray(faculty)) faculty = [];

  const { data: projectId, error: insErr } = await supabase.rpc(
    "create_student_project",
    {
      p_title: title,
      p_description: description,
      p_domain: domain,
      p_lead_full_name: leadFullName,
      p_lead_roll_number: leadRoll,
      p_lead_course: leadCourse,
      p_lead_semester: leadSemester,
      p_progress_summary: progressSummary,
      p_mvp_timeline: mvpTimeline,
      p_funds_requested: fundsRequested,
    },
  );

  if (insErr || !projectId) {
    return {
      ok: false as const,
      message: insErr?.message ?? "Could not create project",
    };
  }

  const pid = projectId as string;

  const storage =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
      ? createAdminClient().storage
      : supabase.storage;

  let pptPath: string | null = null;
  let budgetDocPath: string | null = null;
  const imagePaths: string[] = [];
  let bankQrPath: string | null = null;
  let paytmQrPath: string | null = null;

  const ppt = formData.get("ppt");
  if (ppt instanceof File && ppt.size > 0) {
    const path = `${pid}/ppt-${crypto.randomUUID()}-${safeFileName(ppt.name)}`;
    const { error: up } = await storage.from("project-files").upload(path, ppt);
    if (up) return { ok: false as const, message: up.message };
    pptPath = path;
  }

  for (const img of formData.getAll("images")) {
    if (img instanceof File && img.size > 0) {
      const path = `${pid}/img-${crypto.randomUUID()}-${safeFileName(img.name)}`;
      const { error: up } = await storage.from("project-files").upload(path, img);
      if (up) return { ok: false as const, message: up.message };
      imagePaths.push(path);
    }
  }

  const budgetDoc = formData.get("budget_doc");
  if (budgetDoc instanceof File && budgetDoc.size > 0) {
    const path = `${pid}/budget-${crypto.randomUUID()}-${safeFileName(budgetDoc.name)}`;
    const { error: up } = await storage.from("project-files").upload(path, budgetDoc);
    if (up) return { ok: false as const, message: up.message };
    budgetDocPath = path;
  }

  const bankQr = formData.get("bank_qr");
  if (bankQr instanceof File && bankQr.size > 0) {
    const path = `${pid}/bank-qr-${crypto.randomUUID()}-${safeFileName(bankQr.name)}`;
    const { error: up } = await storage.from("qr-codes").upload(path, bankQr);
    if (up) return { ok: false as const, message: up.message };
    bankQrPath = path;
  }

  const paytmQr = formData.get("paytm_qr");
  if (paytmQr instanceof File && paytmQr.size > 0) {
    const path = `${pid}/paytm-qr-${crypto.randomUUID()}-${safeFileName(paytmQr.name)}`;
    const { error: up } = await storage.from("qr-codes").upload(path, paytmQr);
    if (up) return { ok: false as const, message: up.message };
    paytmQrPath = path;
  }

  const { error: updErr } = await supabase.rpc(
    "update_student_project_submission_paths",
    {
      p_project_id: pid,
      p_ppt_storage_path: pptPath,
      p_budget_doc_storage_path: budgetDocPath,
      p_project_image_paths: imagePaths,
    },
  );
  if (updErr) return { ok: false as const, message: updErr.message };

  const { error: finErr } = await supabase.rpc("finalize_student_project_submission", {
    p_project_id: pid,
    p_team: team.map((row) => ({
      full_name: row.fullName,
      roll_number: row.rollNumber ?? "",
      course: row.course ?? "",
      semester: row.semester ?? "",
    })),
    p_faculty: faculty.map((row) => ({
      full_name: row.fullName,
      contribution: row.contribution ?? "",
    })),
    p_account_number: account_number,
    p_ifsc: ifsc,
    p_holder_name: holder_name,
    p_qr_bank: bankQrPath,
    p_qr_paytm: paytmQrPath,
  });
  if (finErr) return { ok: false as const, message: finErr.message };

  revalidatePath("/dashboard/student");
  return { ok: true as const, projectId: pid };
}
