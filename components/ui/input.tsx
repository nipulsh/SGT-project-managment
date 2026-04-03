import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "underline";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "underline", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full text-sm font-medium text-on-surface placeholder:text-outline/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          variant === "underline" &&
            "border-0 border-b-2 border-outline-variant bg-surface-container-low px-0 py-2 transition-colors focus:border-secondary",
          variant === "default" &&
            "rounded-md border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 focus-visible:ring-1 focus-visible:ring-primary-container",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
