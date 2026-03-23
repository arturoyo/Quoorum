import * as React from "react";
import { cn, styles } from '@/lib/utils'

/**
 * Input component with theme CSS variables
 *
 * Uses theme variables for consistent dark/light mode support:
 * - styles.colors.bg.input for background
 * - styles.colors.border.default for borders
 * - styles.colors.text.primary for text
 * - placeholder:styles.colors.text.tertiary for placeholders
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
Input.displayName = "Input";

export { Input };
