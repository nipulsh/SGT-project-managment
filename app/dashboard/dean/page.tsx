import { DeanAllocateForm } from "@/components/dashboard/dean-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, Landmark } from "lucide-react";
import {
  fetchDeanApprovedProjects,
  fetchDeanOverviewCounts,
} from "@/lib/dean/queries";

export default async function DeanOverviewPage() {
  const [approvedForFund, counts] = await Promise.all([
    fetchDeanApprovedProjects(),
    fetchDeanOverviewCounts(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-12 p-6 md:p-10">
      <section>
        <h1 className="text-primary mb-2 text-3xl font-extrabold tracking-tight md:text-4xl">
          Dean&apos;s executive dashboard
        </h1>
        <p className="text-secondary text-[0.75rem] font-medium tracking-wide uppercase">
          Institutional governance &amp; fiscal oversight
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-outline-variant/10 bg-surface-container-lowest">
            <CardContent className="p-6">
              <p className="text-secondary text-xs font-bold tracking-wider uppercase">
                Pending approvals
              </p>
              <p className="text-primary mt-1 text-3xl font-black tabular-nums">
                {counts.pendingApprovals}
              </p>
            </CardContent>
          </Card>
          <Card className="border-outline-variant/10 bg-surface-container-lowest">
            <CardContent className="p-6">
              <p className="text-secondary text-xs font-bold tracking-wider uppercase">
                Pending payments
              </p>
              <p className="text-primary mt-1 text-3xl font-black tabular-nums">
                {counts.pendingPayments}
              </p>
            </CardContent>
          </Card>
          <Card className="border-outline-variant/10 bg-surface-container-lowest">
            <CardContent className="p-6">
              <p className="text-secondary text-xs font-bold tracking-wider uppercase">
                Total projects
              </p>
              <p className="text-primary mt-1 text-3xl font-black tabular-nums">
                {counts.totalProjects}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="mx-auto max-w-2xl space-y-8">
        <section className="space-y-8">
          <Card className="bg-primary relative overflow-hidden border-0 text-on-primary">
            <CardContent className="p-8">
              <h2 className="mb-4 text-xs font-bold tracking-widest uppercase opacity-70">
                Fiscal reserve (illustrative)
              </h2>
              <div className="relative z-10 text-3xl font-black">
                Institutional budget
              </div>
              <p className="text-xs opacity-60">
                Connect your ERP later — this panel is atmospheric per design.
              </p>
              <Landmark
                className="pointer-events-none absolute -right-4 -bottom-4 size-32 opacity-10"
                aria-hidden
                strokeWidth={1}
              />
            </CardContent>
          </Card>

          <Card className="border-outline-variant/10 bg-surface-container-low rounded-xl border">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2 text-base">
                <Banknote className="size-4" aria-hidden />
                Budget disbursement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {approvedForFund.length === 0 ? (
                <p className="text-secondary text-sm">
                  No approved projects to allocate yet.
                </p>
              ) : (
                approvedForFund.map((p) => (
                  <div
                    key={p.id}
                    className="border-outline-variant/20 space-y-4 border-b pb-8 last:border-0 last:pb-0"
                  >
                    <p className="text-primary text-sm font-semibold">
                      {p.title}
                    </p>
                    <DeanAllocateForm projectId={p.id} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
