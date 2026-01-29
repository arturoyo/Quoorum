"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  /** Show labels next to icons */
  showLabels?: boolean;
  /** Compact mode - single button that cycles through themes */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

export function ThemeToggle({
  showLabels = false,
  compact = false,
  className,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  if (compact) {
    // Single button that cycles: light -> dark -> system -> light
    const cycleTheme = () => {
      if (theme === "light") setTheme("dark");
      else if (theme === "dark") setTheme("system");
      else setTheme("light");
    };

    return (
      <button
        onClick={cycleTheme}
        className={cn(
          "p-2 rounded-lg transition-all duration-200",
          "bg-[var(--theme-bg-tertiary)] hover:bg-[var(--theme-bg-input)]",
          "border border-[var(--theme-border)] hover:border-[var(--theme-accent-primary)]",
          "text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]",
          "hover:shadow-md hover:scale-105",
          className
        )}
        title={`Tema actual: ${theme === "system" ? "Sistema" : theme === "dark" ? "Oscuro" : "Claro"}`}
      >
        {resolvedTheme === "dark" ? (
          <Moon className="h-5 w-5 transition-transform" />
        ) : (
          <Sun className="h-5 w-5 text-amber-500 transition-transform" />
        )}
      </button>
    );
  }

  // Full toggle with all three options
  const options = [
    { value: "light" as const, icon: Sun, label: "Claro" },
    { value: "dark" as const, icon: Moon, label: "Oscuro" },
    { value: "system" as const, icon: Monitor, label: "Sistema" },
  ];

  return (
    <div
      className={cn(
        "inline-flex rounded-lg p-1",
        "bg-[var(--theme-bg-tertiary)] border border-[var(--theme-border)]",
        className
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;

        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
              isActive
                ? "bg-purple-600 text-white shadow-sm"
                : "text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-input)]"
            )}
          >
            <Icon className="h-4 w-4" />
            {showLabels && <span>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Simple dropdown version for headers */
export function ThemeDropdown({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className={cn("relative group", className)}>
      <button
        className={cn(
          "p-2 rounded-lg transition-colors",
          "hover:bg-[var(--theme-bg-tertiary)]",
          "text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
        )}
      >
        {resolvedTheme === "dark" ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5 text-amber-500" />
        )}
      </button>

      <div
        className={cn(
          "absolute right-0 bottom-full mb-2 py-2 w-36 rounded-lg shadow-xl opacity-0 invisible",
          "group-hover:opacity-100 group-hover:visible transition-all duration-200",
          "bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)]"
        )}
      >
        {[
          { value: "light" as const, icon: Sun, label: "Claro" },
          { value: "dark" as const, icon: Moon, label: "Oscuro" },
          { value: "system" as const, icon: Monitor, label: "Sistema" },
        ].map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                theme === option.value
                  ? "bg-purple-600/20 text-purple-400"
                  : "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)]"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
