import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProjectSubmissionWizard } from "@/components/dashboard/project-submission-wizard";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/auth";

export default async function NewProjectSubmissionPage() {
  const profile = await getProfile();
  const defaultName = profile?.name ?? "";

  return (
    <div className="border-outline-variant/10 min-h-full border-b bg-surface">
      <header className="border-outline-variant/10 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b bg-surface px-6 py-4 md:px-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href="/dashboard/student">
              <ChevronLeft className="size-4" aria-hidden />
              Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-primary text-xl font-bold tracking-tighter">
              Project application
            </h1>
            <p className="text-secondary text-xs">
              Multi-step submission for the dean review queue
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8 md:px-8 md:py-10">
        <ProjectSubmissionWizard defaultLeadName={defaultName} />
      </div>
    </div>
  );
}
