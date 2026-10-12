/**
 * ThemeContext
 * Single source of truth untuk tema aplikasi.
 * Semua komponen yang butuh tema cukup pakai useTheme() —
 * perubahan dari mana pun langsung ter-sync ke seluruh tree.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  changeTheme: (next: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle(
    "dark",
    theme === "dark" || (theme === "system" && prefersDark)
  );
  document.documentElement.style.colorScheme =
    theme === "system" ? "light dark" : theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");

  // Load dari localStorage saat mount
  useEffect(() => {
    const saved = window.localStorage.getItem("MewDrive-theme");
    const initial: Theme =
      saved === "light" || saved === "dark" || saved === "system"
        ? saved
        : "system";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  // Sinkronkan dengan perubahan system preference saat mode "system"
  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => applyTheme("system");
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [theme]);

  const changeTheme = (next: Theme) => {
    setTheme(next);
    window.localStorage.setItem("MewDrive-theme", next);
    applyTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used inside <ThemeProvider>");
  }
  return ctx;
}
