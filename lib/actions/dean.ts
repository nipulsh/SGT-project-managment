"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setProjectStatus(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "");
  const status = String(formData.get("status") ?? "") as
    | "approved"
    | "rejected";
  if (!projectId || (status !== "approved" && status !== "rejected")) {
    return { ok: false as const, message: "Invalid submission" };
  }

  if (status === "approved") {
    return {
      ok: false as const,
      message:
        "Approval must go through the grant step on the approvals page",
    };
  }

  const supabase = await createClient();
  const patch: Record<string, unknown> = {
    status: "rejected",
    faculty_id: null,
  };

  const { error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", projectId);
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/dashboard/dean", "layout");
  revalidatePath("/dashboard/dean/approvals");
  revalidatePath("/dashboard/faculty");
  revalidatePath("/dashboard/student");
  return { ok: true as const };
}

/** Approve a pending project and record grant decision (no payment row if grant declined). */
export async function approveProjectWithFunding(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "").trim();
  const facultyId =
    String(formData.get("faculty_id") ?? "").trim() || null;
  const grantMode = String(formData.get("grant_mode") ?? "") as
    | "none"
    | "award";
  const amountRaw = formData.get("approved_amount");

  if (!projectId) {
    return { ok: false as const, message: "Project required" };
  }
  if (grantMode !== "none" && grantMode !== "award") {
    return { ok: false as const, message: "Choose a grant option" };
  }

  const supabase = await createClient();

  const { data: proj, error: projErr } = await supabase
    .from("projects")
    .select("id, status, funds_requested")
    .eq("id", projectId)
    .single();

  if (projErr || !proj) {
    return { ok: false as const, message: "Project not found" };
  }
  if (proj.status !== "pending") {
    return {
      ok: false as const,
      message: "This project is not waiting for approval",
    };
  }

  const requested =
    proj.funds_requested != null ? Number(proj.funds_requested) : null;

  let awardAmount = 0;
  if (grantMode === "award") {
    awardAmount = Number(amountRaw);
    if (!Number.isFinite(awardAmount) || awardAmount <= 0) {
      return {
        ok: false as const,
        message: "Enter an approved grant amount greater than zero",
      };
    }
    if (
      requested != null &&
      Number.isFinite(requested) &&
      requested > 0 &&
      awardAmount > requested + 1e-9
    ) {
      return {
        ok: false as const,
        message:
          "Approved grant cannot exceed the amount requested on the application",
      };
    }
  }

  const updatePayload: Record<string, unknown> = {
    status: "approved",
    ...(facultyId ? { faculty_id: facultyId } : {}),
  };

  const { data: updatedRows, error: approveErr } = await supabase
    .from("projects")
    .update(updatePayload)
    .eq("id", projectId)
    .eq("status", "pending")
    .select("id");

  if (approveErr) {
    return { ok: false as const, message: approveErr.message };
  }
  if (!updatedRows?.length) {
    return {
      ok: false as const,
      message: "Project is no longer pending (refresh and try again)",
    };
  }

  async function revertApproval() {
    await supabase
      .from("projects")
      .update({ status: "pending", faculty_id: null })
      .eq("id", projectId)
      .eq("status", "approved");
  }

  if (grantMode === "none") {
    const { error: delErr } = await supabase
      .from("payments")
      .delete()
      .eq("project_id", projectId)
      .eq("status", "pending");
    if (delErr) {
      await revertApproval();
      return { ok: false as const, message: delErr.message };
    }
    revalidatePath("/dashboard/dean", "layout");
    revalidatePath("/dashboard/dean/approvals");
    revalidatePath("/dashboard/dean/payments");
    revalidatePath("/dashboard/faculty");
    revalidatePath("/dashboard/student");
    return { ok: true as const };
  }

  const { data: pending } = await supabase
    .from("payments")
    .select("id")
    .eq("project_id", projectId)
    .eq("status", "pending")
    .maybeSingle();

  const payRes = pending
    ? await supabase
        .from("payments")
        .update({ approved_amount: awardAmount })
        .eq("id", pending.id)
    : await supabase.from("payments").insert({
        project_id: projectId,
        approved_amount: awardAmount,
        status: "pending",
      });

  if (payRes.error) {
    await revertApproval();
    return { ok: false as const, message: payRes.error.message };
  }

  revalidatePath("/dashboard/dean", "layout");
  revalidatePath("/dashboard/dean/approvals");
  revalidatePath("/dashboard/dean/payments");
  revalidatePath("/dashboard/faculty");
  revalidatePath("/dashboard/student");
  return { ok: true as const };
}

export async function allocateFunding(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "");
  const amount = Number(formData.get("approved_amount"));
  if (!projectId || !Number.isFinite(amount) || amount < 0) {
    return { ok: false as const, message: "Valid project and amount required" };
  }

  const supabase = await createClient();

  const { data: pending } = await supabase
    .from("payments")
    .select("id")
    .eq("project_id", projectId)
    .eq("status", "pending")
    .maybeSingle();

  if (pending) {
    const { error } = await supabase
      .from("payments")
      .update({ approved_amount: amount })
      .eq("id", pending.id);
    if (error) return { ok: false as const, message: error.message };
  } else {
    const { error } = await supabase.from("payments").insert({
      project_id: projectId,
      approved_amount: amount,
      status: "pending",
    });
    if (error) return { ok: false as const, message: error.message };
  }

  revalidatePath("/dashboard/dean", "layout");
  revalidatePath("/dashboard/dean/payments");
  revalidatePath("/dashboard/student");
  return { ok: true as const };
}

export async function markPaymentPaid(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "");
  const file = formData.get("receipt");
  if (!projectId) return { ok: false as const, message: "Project required" };

  const supabase = await createClient();

  const { data: pay } = await supabase
    .from("payments")
    .select("id")
    .eq("project_id", projectId)
    .eq("status", "pending")
    .maybeSingle();

  if (!pay) {
    return { ok: false as const, message: "No pending payment for project" };
  }

  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false as const,
      message: "Payment proof (screenshot or PDF) is required",
    };
  }

  const safeName = file.name.replace(/[^\w.-]/g, "_");
  const path = `${projectId}/${crypto.randomUUID()}-${safeName}`;
  const { error: upErr } = await supabase.storage
    .from("receipts")
    .upload(path, file);
  if (upErr) return { ok: false as const, message: upErr.message };

  const { error } = await supabase
    .from("payments")
    .update({
      status: "paid",
      receipt_url: path,
    })
    .eq("id", pay.id);

  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/dashboard/dean", "layout");
  revalidatePath("/dashboard/dean/payments");
  revalidatePath("/dashboard/student");
  return { ok: true as const };
}
