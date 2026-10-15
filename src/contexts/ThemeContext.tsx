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

/**
 * Baca tema awal dari DOM — bukan dari localStorage langsung.
 * Inline script di __root.tsx sudah apply class ke <html> sebelum React hydrate,
 * jadi kita baca dari sana supaya initial state cocok dengan DOM → tidak hydration mismatch.
 */
function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "light"; // SSR fallback
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Init dari DOM langsung — bukan "light" hardcoded
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Sync ulang saat mount untuk handle kasus edge (localStorage berubah di tab lain, dll)
  useEffect(() => {
    const saved = window.localStorage.getItem("MewDrive-theme");
    // Inline script support "system" tapi ThemeContext hanya light/dark
    // Resolve "system" ke nilai konkret berdasarkan prefers-color-scheme
    let resolved: Theme;
    if (saved === "dark") {
      resolved = "dark";
    } else if (saved === "light") {
      resolved = "light";
    } else {
      // "system" atau nilai lain → ikut OS
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    setTheme(resolved);
    applyTheme(resolved);
    // Normalize localStorage ke light/dark supaya tidak ada "system" tersisa
    window.localStorage.setItem("MewDrive-theme", resolved);
  }, []);

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
