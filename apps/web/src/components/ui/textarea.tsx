import * as React from "react";
import { cn, styles } from '@/lib/utils'

/**
 * Textarea component with theme CSS variables
 *
 * Uses theme variables for consistent dark/light mode support:
 * - styles.colors.bg.input for background
 * - styles.colors.border.default for borders
 * - styles.colors.text.primary for text
 * - placeholder:styles.colors.text.tertiary for placeholders
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
          "styles.colors.bg.input",
          "styles.colors.border.default",
          "styles.colors.text.primary",
          "placeholder:styles.colors.text.tertiary",
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
