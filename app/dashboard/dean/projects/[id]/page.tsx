import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProjectStatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { fetchDeanProjectReviewDetail } from "@/lib/dean/queries";
import { formatDate, formatMoney } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export default async function DeanProjectReviewPage({ params }: Props) {
  await requireRole("dean");
  const { id } = await params;
  const detail = await fetchDeanProjectReviewDetail(id);
  if (!detail) notFound();

  const {
    project,
    facultyName,
    memberNames,
    teamStudentLabels,
    externalFacultyLines,
    pptHref,
    budgetDocHref,
    imageHrefs,
  } = detail;

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="text-secondary -ml-2 gap-2" asChild>
          <Link href="/dashboard/dean/approvals">
            <ArrowLeft className="size-4" aria-hidden />
            Back to approvals
          </Link>
        </Button>
      </div>

      <Card className="border-outline-variant/10">
        <CardContent className="p-8">
          <span className="text-secondary mb-2 block text-[10px] font-bold tracking-[0.1em] uppercase">
            Project information
          </span>
          <h1 className="text-primary mb-4 text-2xl font-bold md:text-3xl">
            {project.title}
          </h1>
          <p className="text-secondary mb-2 text-sm">
            Submitted {formatDate(project.created_at)}
          </p>
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
                {memberNames.length ? memberNames.join(", ") : "—"}
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
                  {project.lead_course ? ` · ${project.lead_course}` : ""}
                  {project.lead_semester ? ` · ${project.lead_semester}` : ""}
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
    </div>
  );
}
