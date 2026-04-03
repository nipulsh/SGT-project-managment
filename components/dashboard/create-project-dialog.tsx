import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Opens the full multi-step project application on a dedicated page. */
export function CreateProjectDialog() {
  return (
    <Button asChild className="gap-2">
      <Link href="/dashboard/student/projects/new">
        <Plus className="size-4" aria-hidden />
        Submit project application
      </Link>
    </Button>
  );
}
