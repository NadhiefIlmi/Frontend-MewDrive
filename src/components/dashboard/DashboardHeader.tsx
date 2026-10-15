/**
 * DashboardHeader Component
 * Top header with search, theme switcher, and profile menu
 */

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Sun,
  Moon,
  Monitor,
  Settings,
  HardDrive,
  LogOut,
  Menu,
  Check,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuItem } from "./MenuItem";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { themeOptions } from "@/lib/dashboard-constants";
import type { Section } from "@/types/dashboard";
import { SearchBar } from "@/components/dashboard/SearchBar";
import type { FileItem } from "@/lib/api";
import type { ApiFolderItem } from "@/types/dashboard";

interface DashboardHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  onSidebarToggle: () => void;
  onFlash: (message: string) => void;
  onFolderSelect?: (folder: ApiFolderItem) => void;
  onFileSelect?: (file: FileItem) => void;
}

export function DashboardHeader({
  query,
  onQueryChange,
  activeSection,
  onSectionChange,
  onSidebarToggle,
  onFlash,
  onFolderSelect,
  onFileSelect,
}: DashboardHeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, changeTheme } = useTheme();
  const [openMenu, setOpenMenu] = useState<"theme" | "profile" | null>(null);

  const toggleMenu = (menu: "theme" | "profile") => {
    setOpenMenu((current) => (current === menu ? null : menu));
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <>
      {openMenu && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setOpenMenu(null)}
        />
      )}

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b-2 border-ink bg-background px-3 sm:h-20 md:px-8">
        <div className="mr-3 flex min-w-0 flex-1 items-center gap-2 sm:mr-6 sm:gap-3">
          <Button
            variant="icon"
            className="hidden shrink-0 lg:flex"
            aria-label="Buka navigasi"
            onClick={onSidebarToggle}
          >
            <Menu />
          </Button>
          <div className="min-w-0 flex-1">
            <SearchBar
              placeholder={
                activeSection === "notes"
                  ? "Cari catatan..."
                  : "Cari file atau folder..."
              }
              onFolderSelect={(folder) => {
                onFolderSelect?.(folder);
              }}
              onFileSelect={(file) => {
                onFileSelect?.(file);
              }}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Theme Switcher */}
          <div className="relative z-30">
            <Button
              variant="icon"
              aria-label="Pilih tema"
              title="Pilih tema"
              onClick={() => toggleMenu("theme")}
            >
              {theme === "light" ? (
                <Sun className="size-5" />
              ) : theme === "dark" ? (
                <Moon className="size-5" />
              ) : (
                <Monitor className="size-5" />
              )}
            </Button>
            {openMenu === "theme" && (
              <div className="absolute right-0 top-full mt-3 w-72 max-w-[85vw] rounded-ui border-2 border-ink bg-card p-2 shadow-brutal">
                <p className="border-b-2 border-ink px-3 pb-2 font-display font-bold">
                  Dark Mode
                </p>
                {themeOptions.map(({ id, label, description, Icon }) => (
                  <Button
                    key={id}
                    variant="ghost"
                    onClick={() => {
                      changeTheme(id);
                      setOpenMenu(null);
                    }}
                    className="mt-1 h-auto w-full justify-start px-3 py-2 text-left"
                  >
                    <Icon className="size-5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{label}</span>
                      <span className="block text-xs font-medium text-muted-foreground">
                        {description}
                      </span>
                    </span>
                    {theme === id && <Check className="size-5 shrink-0" />}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative z-30">
            <Button
              variant="icon"
              onClick={() => toggleMenu("profile")}
              aria-label="Profile menu"
            >
              <span className="grid size-7 place-items-center rounded-full border-2 border-ink bg-lime text-xs font-bold uppercase">
                {user?.name?.substring(0, 2) || "U"}
              </span>
            </Button>
            {openMenu === "profile" && (
              <div className="absolute right-0 top-full mt-3 w-60 rounded-ui border-2 border-ink bg-card p-2 shadow-brutal">
                <div className="border-b-2 border-ink px-3 pb-2">
                  <p className="font-bold">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email || ""}
                  </p>
                  {user?.role && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-ink bg-sun px-2 py-0.5 text-xs font-bold">
                      {user.role === "ADMIN" && (
                        <Shield className="size-3" />
                      )}
                      {user.role}
                    </span>
                  )}
                </div>
                <MenuItem
                  Icon={Settings}
                  label="Pengaturan"
                  onClick={() => {
                    setOpenMenu(null);
                    onSectionChange("settings");
                  }}
                />
                <MenuItem
                  Icon={HardDrive}
                  label="Penyimpanan"
                  onClick={() => {
                    setOpenMenu(null);
                    onSectionChange("storage");
                  }}
                />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-ui px-3 py-2 text-left text-sm font-semibold hover:bg-coral"
                >
                  <LogOut className="size-4" /> Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
