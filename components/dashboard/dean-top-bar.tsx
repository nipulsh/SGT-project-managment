import { DeanExportButton } from "@/components/dashboard/dean-export-button";

export function DeanTopBar({ name }: { name: string }) {
  return (
    <header className="border-outline-variant/10 sticky top-0 z-30 flex items-center justify-between gap-4 border-b bg-surface px-6 py-4 md:px-8">
      <span className="text-primary text-xl font-bold tracking-tighter">
        Project Monolith
      </span>
      <div className="flex items-center gap-4">
        <DeanExportButton />
        <div className="text-right">
          <p className="text-primary text-xs font-bold">{name}</p>
          <p className="text-secondary text-[10px]">Dean office</p>
        </div>
      </div>
    </header>
  );
}
