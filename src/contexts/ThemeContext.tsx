/**
 * ThemeContext
 * Aplikasi hanya mendukung mode terang (light).
 * Dark mode dihapus — context dipertahankan supaya komponen yang
 * masih menggunakan useTheme() tidak error.
 */

import { createContext, useContext, useEffect, type ReactNode } from "react";

export type Theme = "light";

interface ThemeContextValue {
  theme: Theme;
  changeTheme: (next: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Pastikan class "dark" tidak pernah aktif
function enforceLight() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
  window.localStorage.setItem("MewDrive-theme", "light");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    enforceLight();
  }, []);

  const value: ThemeContextValue = {
    theme: "light",
    changeTheme: () => { /* no-op — only light mode */ },
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used inside <ThemeProvider>");
  return ctx;
}
