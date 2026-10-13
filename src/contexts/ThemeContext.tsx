/**
 * ThemeContext
 * Single source of truth untuk tema aplikasi.
 * Semua komponen yang butuh tema cukup pakai useTheme() —
 * perubahan dari mana pun langsung ter-sync ke seluruh tree.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  changeTheme: (next: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  // Load dari localStorage saat mount
  useEffect(() => {
    const saved = window.localStorage.getItem("MewDrive-theme");
    const initial: Theme = saved === "light" || saved === "dark" ? saved : "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  // (system sync removed — app only supports light/dark)

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
