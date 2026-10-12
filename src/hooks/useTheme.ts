/**
 * useTheme Hook
 * Thin wrapper around ThemeContext.
 * Semua komponen tetap bisa import dari sini tanpa perlu diganti.
 */

export type { Theme } from "@/contexts/ThemeContext";
export { useThemeContext as useTheme } from "@/contexts/ThemeContext";
