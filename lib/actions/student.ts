"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireStudentMember(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: row } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row) throw new Error("Forbidden");
  return { supabase, user };
}

export async function createProject(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const domain = String(formData.get("domain") ?? "").trim() || null;
  if (!title) return { ok: false as const, message: "Title is required" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "Unauthorized" };

  const { error: profileRpcErr } = await supabase.rpc("ensure_auth_profile");
  if (profileRpcErr) {
    return { ok: false as const, message: profileRpcErr.message };
  }

  const { error } = await supabase.rpc("create_student_project", {
    p_title: title,
    p_description: description,
    p_domain: domain,
  });
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/dashboard/student");
  return { ok: true as const };
}

export async function addProgressUpdate(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!projectId || !title) {
    return { ok: false as const, message: "Project and title are required" };
  }

  try {
    await requireStudentMember(projectId);
  } catch {
    return { ok: false as const, message: "Forbidden" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("progress_updates").insert({
    project_id: projectId,
    title,
    description,
  });
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/dashboard/student");
  return { ok: true as const };
}

export async function addExpense(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "");
  const amount = Number(formData.get("amount"));
  const description = String(formData.get("description") ?? "").trim() || null;
  const file = formData.get("bill");

  if (!projectId || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false as const, message: "Valid amount and project required" };
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    const ctx = await requireStudentMember(projectId);
    supabase = ctx.supabase;
  } catch {
    return { ok: false as const, message: "Forbidden" };
  }

  let billPath: string | null = null;
  if (file instanceof File && file.size > 0) {
    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const path = `${projectId}/${crypto.randomUUID()}-${safeName}`;
    const { error: upErr } = await supabase.storage
      .from("bills")
      .upload(path, file);
    if (upErr) return { ok: false as const, message: upErr.message };
    billPath = path;
  }

  const { error } = await supabase.from("expenses").insert({
    project_id: projectId,
    amount,
    description,
    bill_url: billPath,
  });
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/dashboard/student");
  return { ok: true as const };
}

export async function savePaymentDetails(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "");
  const account_number = String(formData.get("account_number") ?? "").trim();
  const ifsc = String(formData.get("ifsc") ?? "").trim();
  const holder_name = String(formData.get("holder_name") ?? "").trim();
  const file = formData.get("qr");
  const paytmFile = formData.get("paytm_qr");

  if (!projectId || !account_number || !ifsc || !holder_name) {
    return { ok: false as const, message: "All bank fields are required" };
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    const ctx = await requireStudentMember(projectId);
    supabase = ctx.supabase;
  } catch {
    return { ok: false as const, message: "Forbidden" };
  }

  let qrPath: string | null = null;
  if (file instanceof File && file.size > 0) {
    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const path = `${projectId}/${crypto.randomUUID()}-${safeName}`;
    const { error: upErr } = await supabase.storage
      .from("qr-codes")
      .upload(path, file);
    if (upErr) return { ok: false as const, message: upErr.message };
    qrPath = path;
  }

  let paytmQrPath: string | null = null;
  if (paytmFile instanceof File && paytmFile.size > 0) {
    const safeName = paytmFile.name.replace(/[^\w.-]/g, "_");
    const path = `${projectId}/${crypto.randomUUID()}-paytm-${safeName}`;
    const { error: upErr } = await supabase.storage
      .from("qr-codes")
      .upload(path, paytmFile);
    if (upErr) return { ok: false as const, message: upErr.message };
    paytmQrPath = path;
  }

  const { data: existing } = await supabase
    .from("payment_details")
    .select("id, qr_code_url, paytm_qr_url")
    .eq("project_id", projectId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("payment_details")
      .update({
        account_number,
        ifsc,
        holder_name,
        qr_code_url: qrPath ?? existing.qr_code_url,
        paytm_qr_url: paytmQrPath ?? existing.paytm_qr_url,
      })
      .eq("id", existing.id);
    if (error) return { ok: false as const, message: error.message };
  } else {
    const { error } = await supabase.from("payment_details").insert({
      project_id: projectId,
      account_number,
      ifsc,
      holder_name,
      qr_code_url: qrPath,
      paytm_qr_url: paytmQrPath,
    });
    if (error) return { ok: false as const, message: error.message };
  }

  revalidatePath("/dashboard/student");
  return { ok: true as const };
}
