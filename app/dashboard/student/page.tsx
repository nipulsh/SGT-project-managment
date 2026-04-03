import Link from "next/link";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import {
  BankDetailsForm,
  ExpenseForm,
  MilestoneForm,
} from "@/components/dashboard/student-forms";
import {
  PaymentStatusBadge,
  ProjectStatusBadge,
} from "@/components/dashboard/status-badge";
import { ProjectPicker } from "@/components/dashboard/project-picker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookMarked } from "lucide-react";
import { getProfile, requireRole } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { getSignedFileUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import type { ExpenseRow, ProgressRow, ProjectRow } from "@/lib/types";

type Search = { project?: string };

export default async function StudentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await requireRole("student");
  const profile = await getProfile();
  const { project: projectParam } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", user!.id);

  const projectIds = memberships?.map((m) => m.project_id) ?? [];

  const { data: projectsRaw } =
    projectIds.length > 0
      ? await supabase
          .from("projects")
          .select("*")
          .in("id", projectIds)
          .order("created_at", { ascending: false })
      : { data: [] as ProjectRow[] };

  const projects = (projectsRaw ?? []) as ProjectRow[];

  const currentId =
    projectParam && projectIds.includes(projectParam)
      ? projectParam
      : projects[0]?.id;

  const project = projects.find((p) => p.id === currentId) ?? null;

  let progress: ProgressRow[] = [];
  let expenses: ExpenseRow[] = [];
  let paymentDetails: {
    account_number: string;
    ifsc: string;
    holder_name: string;
    qr_code_url: string | null;
    paytm_qr_url: string | null;
  } | null = null;
  let payment: {
    approved_amount: number;
    status: string;
    receipt_url: string | null;
  } | null = null;
  let facultyName: string | null = null;
  let memberNames: string[] = [];
  let expenseLinks: { id: string; href: string | null }[] = [];
  let qrSigned: string | null = null;
  let paytmQrSigned: string | null = null;
  let pptHref: string | null = null;
  let budgetDocHref: string | null = null;
  let imageHrefs: string[] = [];
  let teamStudentLabels: string[] = [];
  let externalFacultyLines: string[] = [];

  if (project) {
    const [
      { data: pu },
      { data: ex },
      { data: pd },
      { data: payRows },
      { data: teamS },
      { data: extFac },
    ] = await Promise.all([
      supabase
        .from("progress_updates")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("expenses")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("payment_details")
        .select("*")
        .eq("project_id", project.id)
        .maybeSingle(),
      supabase
        .from("payments")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(1),
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

    progress = (pu ?? []) as ProgressRow[];
    expenses = (ex ?? []) as ExpenseRow[];
    paymentDetails = pd
      ? {
          account_number: pd.account_number,
          ifsc: pd.ifsc,
          holder_name: pd.holder_name,
          qr_code_url: pd.qr_code_url,
          paytm_qr_url: pd.paytm_qr_url ?? null,
        }
      : null;
    payment = payRows?.[0] ?? null;

    teamStudentLabels =
      teamS?.map((r) => {
        const roll = r.roll_number?.trim();
        return roll ? `${r.full_name} (${roll})` : r.full_name;
      }) ?? [];
    externalFacultyLines =
      extFac?.map((r) =>
        r.contribution?.trim()
          ? `${r.full_name} — ${r.contribution.trim()}`
          : r.full_name,
      ) ?? [];

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
    if (mids.length) {
      const { data: unames } = await supabase
        .from("users")
        .select("name")
        .in("id", mids);
      memberNames = unames?.map((u) => u.name) ?? [];
    }

    expenseLinks = await Promise.all(
      expenses.map(async (e) => ({
        id: e.id,
        href: e.bill_url ? await getSignedFileUrl("bills", e.bill_url) : null,
      })),
    );

    if (paymentDetails?.qr_code_url) {
      qrSigned = await getSignedFileUrl("qr-codes", paymentDetails.qr_code_url);
    }
    if (paymentDetails?.paytm_qr_url) {
      paytmQrSigned = await getSignedFileUrl(
        "qr-codes",
        paymentDetails.paytm_qr_url,
      );
    }

    if (project.ppt_storage_path) {
      pptHref = await getSignedFileUrl(
        "project-files",
        project.ppt_storage_path,
      );
    }
    if (project.budget_doc_storage_path) {
      budgetDocHref = await getSignedFileUrl(
        "project-files",
        project.budget_doc_storage_path,
      );
    }
    const paths = project.project_image_paths ?? [];
    imageHrefs = (
      await Promise.all(
        paths.map((p) => getSignedFileUrl("project-files", p)),
      )
    ).filter((h): h is string => Boolean(h));
  }

  const spent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const approved = payment ? Number(payment.approved_amount) : 0;
  const pct =
    approved > 0 ? Math.min(100, Math.round((spent / approved) * 100)) : 0;

  const readOnly = project?.status === "rejected";
  const formsEnabled = project && !readOnly;

  return (
    <>
      <header className="border-outline-variant/10 sticky top-0 z-30 flex flex-col gap-2 border-b bg-surface px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <span className="text-secondary text-xs font-bold tracking-widest uppercase">
            Current project
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-4">
            <h2 className="text-primary text-xl font-bold tracking-tighter">
              {project?.title ?? "Your workspace"}
            </h2>
            {projects.length > 0 && currentId ? (
              <ProjectPicker projects={projects} currentId={currentId} />
            ) : null}
          </div>
        </div>
        <p className="text-secondary text-sm font-medium">{profile?.name}</p>
      </header>

      <div className="space-y-8 p-6 md:p-8">
        <section id="overview" className="scroll-mt-24">
          {projects.length === 0 ? (
            <Card className="border-outline-variant/10 bg-surface-container-lowest p-10 text-center">
              <CardTitle className="mb-2 text-2xl">No projects yet</CardTitle>
              <p className="text-secondary mx-auto mb-6 max-w-md text-sm">
                Create a project to enter the dean approval queue and unlock
                milestones, expenses, and funding tools.
              </p>
              <CreateProjectDialog />
            </Card>
          ) : (
            <p className="text-secondary text-sm">
              Use the sidebar to jump between project overview, milestones,
              expenses, and funding.
            </p>
          )}
        </section>

        {project ? (
          <>
            <section id="project" className="scroll-mt-24">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="space-y-8 lg:col-span-8">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card className="border-outline-variant/10 md:col-span-2">
                      <CardContent className="p-8">
                        <span className="text-secondary mb-2 block text-[10px] font-bold tracking-[0.1em] uppercase">
                          Project overview
                        </span>
                        <h3 className="text-primary mb-4 text-2xl font-bold">
                          {project.title}
                        </h3>
                        <p className="text-secondary mb-6 font-medium">
                          {project.description ?? "No description provided."}
                        </p>
                        <div className="flex flex-wrap gap-8">
                          <div>
                            <span className="text-outline mb-1 block text-[10px] font-bold uppercase">
                              Domain
                            </span>
                            <span className="text-primary text-sm font-semibold">
                              {project.domain ?? "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-outline mb-1 block text-[10px] font-bold uppercase">
                              Status
                            </span>
                            <ProjectStatusBadge status={project.status} />
                          </div>
                          <div>
                            <span className="text-outline mb-1 block text-[10px] font-bold uppercase">
                              Assigned faculty
                            </span>
                            <span className="text-primary text-sm font-semibold">
                              {facultyName ?? "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-outline mb-1 block text-[10px] font-bold uppercase">
                              Team
                            </span>
                            <span className="text-primary text-sm font-semibold">
                              {memberNames.length
                                ? memberNames.join(", ")
                                : "—"}
                            </span>
                            {teamStudentLabels.length > 0 ? (
                              <p className="text-on-surface-variant mt-2 text-xs leading-relaxed">
                                Also listed: {teamStudentLabels.join("; ")}
                              </p>
                            ) : null}
                          </div>
                          {project.lead_roll_number ? (
                            <div>
                              <span className="text-outline mb-1 block text-[10px] font-bold uppercase">
                                Lead applicant
                              </span>
                              <span className="text-primary text-sm font-semibold">
                                {project.lead_full_name ?? "—"}
                              </span>
                              <p className="text-on-surface-variant mt-1 text-xs">
                                Roll {project.lead_roll_number}
                                {project.lead_course
                                  ? ` · ${project.lead_course}`
                                  : ""}
                                {project.lead_semester
                                  ? ` · ${project.lead_semester}`
                                  : ""}
                              </p>
                            </div>
                          ) : null}
                          {project.funds_requested != null &&
                          Number(project.funds_requested) > 0 ? (
                            <div>
                              <span className="text-outline mb-1 block text-[10px] font-bold uppercase">
                                Funds requested
                              </span>
                              <span className="text-primary text-sm font-semibold">
                                {formatMoney(Number(project.funds_requested))}
                              </span>
                            </div>
                          ) : null}
                          <div>
                            <span className="text-outline mb-1 block text-[10px] font-bold uppercase">
                              Approved grant (dean)
                            </span>
                            <span className="text-primary text-sm font-semibold">
                              {project.status === "pending"
                                ? "Pending dean approval"
                                : project.status === "rejected"
                                  ? "—"
                                  : approved > 0
                                    ? formatMoney(approved)
                                    : "No grant awarded"}
                            </span>
                            {project.status === "approved" &&
                            approved > 0 &&
                            payment?.status === "pending" ? (
                              <p className="text-on-surface-variant mt-1 text-xs leading-relaxed">
                                The dean is sending this grant; payment proof
                                will be recorded when the transfer is complete.
                              </p>
                            ) : null}
                            {project.status === "approved" &&
                            approved > 0 &&
                            payment?.status === "paid" ? (
                              <p className="text-on-surface-variant mt-1 text-xs leading-relaxed">
                                This is the amount approved for your project.
                                Disbursement is marked complete on file.
                              </p>
                            ) : null}
                          </div>
                        </div>
                        {project.progress_summary ? (
                          <div className="border-outline-variant/15 mt-6 border-t pt-6">
                            <span className="text-secondary mb-2 block text-[10px] font-bold tracking-widest uppercase">
                              Progress so far
                            </span>
                            <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap">
                              {project.progress_summary}
                            </p>
                          </div>
                        ) : null}
                        {project.mvp_timeline ? (
                          <div className="border-outline-variant/15 mt-6 border-t pt-6">
                            <span className="text-secondary mb-2 block text-[10px] font-bold tracking-widest uppercase">
                              MVP timeline
                            </span>
                            <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap">
                              {project.mvp_timeline}
                            </p>
                          </div>
                        ) : null}
                        {externalFacultyLines.length > 0 ? (
                          <div className="border-outline-variant/15 mt-6 border-t pt-6">
                            <span className="text-secondary mb-2 block text-[10px] font-bold tracking-widest uppercase">
                              Faculty noted on application
                            </span>
                            <ul className="text-primary list-inside list-disc text-sm">
                              {externalFacultyLines.map((line, i) => (
                                <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {pptHref || budgetDocHref || imageHrefs.length > 0 ? (
                          <div className="border-outline-variant/15 mt-6 flex flex-wrap gap-4 border-t pt-6">
                            {pptHref ? (
                              <Link
                                href={pptHref}
                                className="text-secondary text-sm font-semibold underline underline-offset-4"
                                target="_blank"
                                rel="noreferrer"
                              >
                                View presentation
                              </Link>
                            ) : null}
                            {budgetDocHref ? (
                              <Link
                                href={budgetDocHref}
                                className="text-secondary text-sm font-semibold underline underline-offset-4"
                                target="_blank"
                                rel="noreferrer"
                              >
                                Budget document
                              </Link>
                            ) : null}
                          </div>
                        ) : null}
                        {imageHrefs.length > 0 ? (
                          <div className="mt-4 flex flex-wrap gap-3">
                            {imageHrefs.map((href) => (
                              <a
                                key={href}
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="block"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={href}
                                  alt="Project"
                                  className="border-outline-variant/20 h-24 w-auto max-w-[140px] rounded-md border object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>

                    <Card className="bg-primary relative overflow-hidden border-0 text-on-primary">
                      <CardContent className="flex h-full flex-col justify-between p-8">
                        <div>
                          <span className="mb-2 block text-[10px] font-bold tracking-[0.1em] uppercase opacity-60">
                            Budget utilization
                          </span>
                          <h4 className="mb-1 text-3xl font-black">
                            {formatMoney(spent)}
                          </h4>
                          <p className="text-xs opacity-70">
                            Approved grant:{" "}
                            {approved > 0 ? formatMoney(approved) : "—"}
                          </p>
                        </div>
                        <div className="mt-8">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className="bg-secondary-fixed h-full rounded-full transition-all"
                              style={{ width: `${approved > 0 ? pct : 0}%` }}
                            />
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-secondary-fixed text-xs font-bold uppercase">
                              Payment status
                            </span>
                            {payment ? (
                              <PaymentStatusBadge
                                status={payment.status as "pending" | "paid"}
                              />
                            ) : (
                              <Badge variant="outline">No allocation</Badge>
                            )}
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-white/5" />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </section>

            <section id="milestones" className="scroll-mt-24">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <Card className="border-outline-variant/10">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BookMarked className="text-primary size-5" aria-hidden />
                      <CardTitle>Log milestone</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {formsEnabled ? (
                      <MilestoneForm projectId={project.id} />
                    ) : (
                      <p className="text-secondary text-sm">
                        Milestones are locked for rejected projects.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-outline-variant/10 overflow-hidden">
                  <CardHeader>
                    <CardTitle>Project timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {progress.length === 0 ? (
                      <p className="text-secondary text-sm">
                        No milestones logged yet.
                      </p>
                    ) : (
                      <div className="project-timeline-track relative space-y-8 pl-6">
                        {progress.map((u, i) => (
                          <div key={u.id} className="relative">
                            <div
                              className={
                                i === 0
                                  ? "border-primary absolute top-1.5 -left-[28px] h-4 w-4 rounded-full border-4 border-white bg-primary"
                                  : "border-outline-variant absolute top-1.5 -left-[28px] h-4 w-4 rounded-full border-4 border-white bg-outline-variant"
                              }
                            />
                            <span className="text-secondary mb-1 block text-[10px] font-bold uppercase">
                              {formatDate(u.created_at)}
                            </span>
                            <h4 className="text-primary text-sm font-bold">
                              {u.title}
                            </h4>
                            {u.description ? (
                              <p className="text-on-surface-variant mt-1 text-xs leading-relaxed">
                                {u.description}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>

            <section id="expenses" className="scroll-mt-24">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <Card className="border-outline-variant/10">
                  <CardHeader>
                    <CardTitle>Expense ledger</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {expenses.length === 0 ? (
                      <p className="text-secondary mb-4 text-sm">
                        No expenses recorded.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Bill</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expenses.map((e) => {
                            const link = expenseLinks.find(
                              (l) => l.id === e.id,
                            );
                            return (
                              <TableRow key={e.id}>
                                <TableCell>
                                  {formatDate(e.created_at)}
                                </TableCell>
                                <TableCell>
                                  {formatMoney(Number(e.amount))}
                                </TableCell>
                                <TableCell>
                                  {link?.href ? (
                                    <Link
                                      href={link.href}
                                      className="text-secondary text-sm font-medium underline underline-offset-4"
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      View
                                    </Link>
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-outline-variant/10">
                  <CardHeader>
                    <CardTitle>Submit expense</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {formsEnabled ? (
                      <ExpenseForm projectId={project.id} />
                    ) : (
                      <p className="text-secondary text-sm">
                        Expenses are locked for rejected projects.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>

            <section id="funding" className="scroll-mt-24">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <Card className="border-outline-variant/10">
                  <CardHeader>
                    <CardTitle>Institutional payment profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formsEnabled ? (
                      <BankDetailsForm
                        projectId={project.id}
                        defaults={paymentDetails}
                      />
                    ) : (
                      <p className="text-secondary text-sm">
                        Bank profile locked for rejected projects.
                      </p>
                    )}
                    {qrSigned ? (
                      <div className="mt-4">
                        <p className="text-secondary mb-2 text-[10px] font-bold tracking-widest uppercase">
                          Bank / UPI QR
                        </p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrSigned}
                          alt="Payment QR"
                          className="max-h-40 rounded-md border border-outline-variant/20"
                        />
                      </div>
                    ) : null}
                    {paytmQrSigned ? (
                      <div className="mt-4">
                        <p className="text-secondary mb-2 text-[10px] font-bold tracking-widest uppercase">
                          Paytm / wallet QR
                        </p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={paytmQrSigned}
                          alt="Paytm QR"
                          className="max-h-40 rounded-md border border-outline-variant/20"
                        />
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card className="border-outline-variant/10">
                  <CardHeader>
                    <CardTitle>Funding status</CardTitle>
                  </CardHeader>
                  <CardContent className="text-secondary space-y-2 text-sm">
                    <p>
                      <span className="font-bold text-primary">
                        Approved by dean:
                      </span>{" "}
                      {project.status === "pending"
                        ? "Awaiting project approval"
                        : project.status === "rejected"
                          ? "—"
                          : approved > 0
                            ? formatMoney(approved)
                            : "No grant awarded"}
                    </p>
                    <p>
                      <span className="font-bold text-primary">
                        Paid to you:
                      </span>{" "}
                      {payment?.status === "paid"
                        ? "Receipt on file"
                        : project.status === "approved" && approved > 0
                          ? "Outstanding — dean will upload proof after paying"
                          : "—"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </>
  );
}
