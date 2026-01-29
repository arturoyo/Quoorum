import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Textarea component with theme CSS variables
 *
 * Uses theme variables for consistent dark/light mode support:
 * - bg-[var(--theme-bg-input)] for background
 * - border-[var(--theme-border)] for borders
 * - text-[var(--theme-text-primary)] for text
 * - placeholder:text-[var(--theme-text-tertiary)] for placeholders
 * - focus-visible:ring-purple-500 for focus ring
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles
          "flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors",
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
Textarea.displayName = "Textarea";

export { Textarea };
