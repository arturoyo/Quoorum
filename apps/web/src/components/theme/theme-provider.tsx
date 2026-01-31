"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const THEMES = ["light", "dark", "system"] as const;
type Theme = (typeof THEMES)[number];

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "quoorum-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && ["light", "dark", "system"].includes(stored)) {
      setThemeState(stored);
    } else {
      // If no stored theme, use system preference
      setThemeState("system");
    }
    setMounted(true);
  }, []);

  // Update resolved theme and apply to document
  useEffect(() => {
    if (!mounted) return; // Wait for mount before applying theme
    
    const resolved = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);

    // Apply theme class to html element
    const root = document.documentElement;
    // Remove both classes first to avoid conflicts
    root.classList.remove("light", "dark");
    // Add the resolved theme class
    root.classList.add(resolved);

    // Update color-scheme for native elements
    root.style.colorScheme = resolved;
    
    // Force a reflow to ensure the change is applied
    void root.offsetHeight;
    
    // Debug: Log theme application (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Theme] Applied theme:', resolved, {
        hasDarkClass: root.classList.contains('dark'),
        hasLightClass: root.classList.contains('light'),
        colorScheme: root.style.colorScheme,
      });
    }
  }, [theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system" || !mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const newResolved = getSystemTheme();
      setResolvedTheme(newResolved);
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(newResolved);
      root.style.colorScheme = newResolved;
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    
    // Immediately apply the theme change (don't wait for useEffect)
    const resolved = newTheme === "system" ? getSystemTheme() : newTheme;
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
    setResolvedTheme(resolved);
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{ theme: "system", resolvedTheme: "dark", setTheme }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
