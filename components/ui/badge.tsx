import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest",
  {
    variants: {
      variant: {
        default: "bg-primary-fixed text-on-primary-fixed",
        pending: "bg-tertiary-fixed text-on-tertiary-fixed",
        rejected: "bg-error-container text-on-error-container",
        paid: "bg-primary-fixed text-on-primary-fixed",
        outline: "border border-outline-variant/30 text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
