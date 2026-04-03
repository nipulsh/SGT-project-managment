import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type AccountHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
};

export function AccountHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Back to dashboard",
}: AccountHeaderProps) {
  return (
    <header className="border-outline-variant/10 sticky top-0 z-30 border-b bg-surface px-6 py-4 md:px-8">
      {backHref ? (
        <Link
          href={backHref}
          className="text-secondary hover:text-primary mb-3 inline-flex items-center gap-1 text-xs font-semibold tracking-wide uppercase"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          {backLabel}
        </Link>
      ) : null}
      <div>
        <h1 className="text-primary text-xl font-bold tracking-tighter">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-secondary mt-1 text-sm font-medium">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
