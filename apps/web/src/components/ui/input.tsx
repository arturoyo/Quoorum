import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input component with theme CSS variables
 *
 * Uses theme variables for consistent dark/light mode support:
 * - bg-[var(--theme-bg-input)] for background
 * - border-[var(--theme-border)] for borders
 * - text-[var(--theme-text-primary)] for text
 * - placeholder:text-[var(--theme-text-tertiary)] for placeholders
 * - focus-visible:ring-purple-500 for focus ring
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          // Theme colors (NO hardcoded colors)
          "bg-[var(--theme-bg-input)]",
          "border-[var(--theme-border)]",
          "text-[var(--theme-text-primary)]",
          "placeholder:text-[var(--theme-text-tertiary)]",
          // Focus states
          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-purple-500",
          "focus-visible:border-purple-500",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
