"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectRow } from "@/lib/types";

export function ProjectPicker({
  projects,
  currentId,
}: {
  projects: ProjectRow[];
  currentId: string;
}) {
  const router = useRouter();
  if (projects.length <= 1) return null;

  return (
    <Select
      value={currentId}
      onValueChange={(v) =>
        router.push(`/dashboard/student?project=${encodeURIComponent(v)}`)
      }
    >
      <SelectTrigger className="max-w-xs border-0 bg-surface-container-low">
        <SelectValue placeholder="Select project" />
      </SelectTrigger>
      <SelectContent>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
