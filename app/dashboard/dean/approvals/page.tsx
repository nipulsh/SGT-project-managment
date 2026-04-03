import { DeanProjectDecision } from "@/components/dashboard/dean-forms";
import { fetchDeanApprovalsData } from "@/lib/dean/queries";
import { formatDate } from "@/lib/format";
import { FolderKanban } from "lucide-react";

export default async function DeanApprovalsPage() {
  const { pending, faculty } = await fetchDeanApprovalsData();

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <section className="border-outline-variant/10 scroll-mt-24 rounded-xl border bg-surface-container-lowest p-8 transition-colors hover:bg-surface-container-high">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-primary text-2xl font-bold tracking-tight md:text-3xl">
              Pending project approvals
            </h1>
            <p className="text-secondary text-sm">
              Review and authorize new project submissions
            </p>
          </div>
          <span className="bg-primary-fixed text-on-primary-fixed rounded px-3 py-1 text-xs font-bold tracking-wider uppercase">
            {pending.length} pending
          </span>
        </div>
        {pending.length === 0 ? (
          <p className="text-secondary text-sm">Queue is clear.</p>
        ) : (
          <div className="space-y-10">
            {pending.map((p) => (
              <div key={p.id} className="space-y-4">
                <div className="flex flex-wrap justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="bg-surface-container text-primary flex h-12 w-12 items-center justify-center rounded-lg">
                      <FolderKanban className="size-6" aria-hidden />
                    </div>
                    <div>
                      <h2 className="text-primary text-lg font-bold">
                        {p.title}
                      </h2>
                      <p className="text-secondary text-sm">
                        {p.domain ?? "No domain"} • Submitted{" "}
                        {formatDate(p.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                <DeanProjectDecision
                  projectId={p.id}
                  faculty={faculty}
                  fundsRequested={
                    p.funds_requested != null
                      ? Number(p.funds_requested)
                      : null
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
