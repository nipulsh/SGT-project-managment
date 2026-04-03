import Link from "next/link";
import { ProjectStatusBadge } from "@/components/dashboard/status-badge";
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
import { Eye, Lock, Search } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { getSignedFileUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import type { ExpenseRow, ProgressRow, ProjectRow } from "@/lib/types";

type Search = { project?: string };

export default async function FacultyDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const profile = await requireRole("faculty");
  const { project: projectParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: assigned } = await supabase
    .from("projects")
    .select("*")
    .eq("faculty_id", user!.id)
    .order("created_at", { ascending: false });

  const projects = (assigned ?? []) as ProjectRow[];

  const currentId =
    projectParam && projects.some((p) => p.id === projectParam)
      ? projectParam
      : projects[0]?.id;

  const project = projects.find((p) => p.id === currentId) ?? null;

  let progress: ProgressRow[] = [];
  let expenses: ExpenseRow[] = [];
  let memberNames: string[] = [];
  let expenseLinks: { id: string; href: string | null }[] = [];

  if (project) {
    const [{ data: pu }, { data: ex }] = await Promise.all([
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
    ]);
    progress = (pu ?? []) as ProgressRow[];
    expenses = (ex ?? []) as ExpenseRow[];

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
  }

  const spent = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <>
      <header className="border-outline-variant/10 sticky top-0 z-30 flex flex-col gap-3 border-b bg-surface px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="relative max-w-md flex-1">
          <Search
            className="text-outline pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-60"
            aria-hidden
          />
          <span className="text-secondary pl-10 text-sm">
            Search is visual-only in this MVP — use project list.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-2 py-2">
            <Eye className="size-3.5" aria-hidden />
            <span className="text-[10px] font-bold tracking-wider uppercase">
              Read only
            </span>
          </Badge>
          <div className="text-right">
            <p className="text-primary text-xs font-bold">{profile?.name}</p>
            <p className="text-secondary text-[10px]">Faculty view</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-12 p-6 md:p-10">
        <section id="overview" className="scroll-mt-24">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-primary mb-2 text-4xl font-black tracking-tighter">
                Assigned projects
              </h2>
              <p className="text-secondary text-[11px] font-medium tracking-widest uppercase">
                Read-only view • projects you advise
              </p>
            </div>
          </div>
        </section>

        <section id="projects" className="scroll-mt-24">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="text-secondary p-8 text-sm">
                No projects are assigned to you yet. The dean can assign you
                when approving a project.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 space-y-4 lg:col-span-5">
                <h3 className="text-secondary mb-4 text-xs font-bold tracking-[0.1em] uppercase">
                  Assigned projects ({projects.length})
                </h3>
                <div className="space-y-4">
                  {projects.map((p) => {
                    const active = p.id === currentId;
                    return (
                      <Link
                        key={p.id}
                        href={`/dashboard/faculty?project=${p.id}`}
                      >
                        <Card
                          className={
                            active
                              ? "border-primary bg-surface-container-highest cursor-pointer border-l-4 shadow-sm transition-all"
                              : "hover:bg-surface-container-high border-outline-variant/10 cursor-pointer border-l-4 border-transparent transition-all"
                          }
                        >
                          <CardContent className="p-6">
                            <div className="mb-4 flex justify-between">
                              <ProjectStatusBadge status={p.status} />
                              <span className="text-secondary text-[10px] font-medium">
                                ID {p.id.slice(0, 8)}
                              </span>
                            </div>
                            <h4 className="text-primary mb-2 text-lg font-bold">
                              {p.title}
                            </h4>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="col-span-12 lg:col-span-7">
                {project ? (
                  <Card className="border-outline-variant/10 bg-surface-container-low rounded-2xl border">
                    <CardHeader className="border-outline-variant/30 border-b pb-6">
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-primary text-2xl font-black tracking-tight">
                          {project.title}
                        </CardTitle>
                        <Lock
                          className="text-secondary size-5 opacity-40"
                          aria-hidden
                        />
                      </div>
                      <p className="text-secondary mt-4 max-w-2xl text-sm leading-relaxed">
                        {project.description ?? "No abstract provided."}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-10 pt-8">
                      <div>
                        <h3 className="text-secondary mb-4 text-[10px] font-black tracking-[0.2em] uppercase">
                          Project members
                        </h3>
                        <ul className="space-y-2">
                          {memberNames.map((n) => (
                            <li
                              key={n}
                              className="border-outline-variant/10 rounded-lg border bg-surface-container-lowest p-3 text-sm font-semibold"
                            >
                              {n}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-secondary mb-4 text-[10px] font-black tracking-[0.2em] uppercase">
                          Reported spend (read-only)
                        </h3>
                        <p className="text-primary text-2xl font-black">
                          {formatMoney(spent)}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-secondary mb-4 text-[10px] font-black tracking-[0.2em] uppercase">
                          Milestones
                        </h3>
                        {progress.length === 0 ? (
                          <p className="text-secondary text-sm">None yet.</p>
                        ) : (
                          <ul className="space-y-4">
                            {progress.map((u) => (
                              <li
                                key={u.id}
                                className="border-outline-variant/10 rounded-lg border bg-surface-container-lowest p-4"
                              >
                                <p className="text-secondary text-[10px] font-bold uppercase">
                                  {formatDate(u.created_at)}
                                </p>
                                <p className="text-primary font-bold">
                                  {u.title}
                                </p>
                                {u.description ? (
                                  <p className="text-secondary mt-1 text-xs">
                                    {u.description}
                                  </p>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div>
                        <h3 className="text-secondary mb-4 text-[10px] font-black tracking-[0.2em] uppercase">
                          Expenses
                        </h3>
                        {expenses.length === 0 ? (
                          <p className="text-secondary text-sm">None logged.</p>
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
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-secondary text-sm underline underline-offset-4"
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
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
