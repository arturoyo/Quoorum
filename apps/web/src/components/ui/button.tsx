import * as React from "react";
import { cn, styles } from '@/lib/utils'
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * Button component with theme CSS variables
 *
 * Uses theme variables for consistent dark/light mode support:
 * - default: Purple theme (bg-purple-600)
 * - outline: Theme borders and backgrounds
 * - ghost: Theme backgrounds on hover
 * - destructive: Red theme for dangerous actions
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary: Purple theme
        default: "bg-purple-600 text-white shadow hover:bg-purple-700",
        // Destructive: Red theme
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700",
        // Outline: Theme borders with purple hover
        outline: "border styles.colors.border.default styles.colors.bg.input styles.colors.text.primary shadow-sm hover:bg-purple-600 hover:text-white hover:border-purple-600",
        // Secondary: Theme background
        secondary: "styles.colors.bg.tertiary styles.colors.text.primary shadow-sm hover:bg-purple-600/20",
        // Ghost: Transparent with theme hover
        ghost: "styles.colors.text.primary hover:styles.colors.bg.tertiary hover:text-purple-400",
        // Link: Purple text with underline
        link: "text-purple-400 underline-offset-4 hover:underline hover:text-purple-300",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
