/**
 * SettingsSection Component
 * Settings page with theme selection
 */

import { Sun, Check, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { themeOptions } from "@/lib/dashboard-constants";

export function SettingsSection() {
  const { theme, changeTheme } = useTheme();

  return (
    <section className="mt-6 grid gap-4 sm:mt-10 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Theme Settings */}
      <div className="rounded-ui border-2 border-ink bg-card p-4 shadow-brutal sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-ui border-2 border-ink bg-lilac sm:size-11">
            <Sun className="size-5 sm:size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold sm:text-2xl">Tampilan</h2>
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">
              Pilih tema untuk seluruh aplikasi.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3">
          {themeOptions.map(({ id, label, description, Icon }) => (
            <Button
              key={id}
              variant="ghost"
              onClick={() => changeTheme(id)}
              aria-pressed={theme === id}
              className={`relative flex h-auto min-h-24 flex-col items-start justify-between border-ink p-3 text-left sm:min-h-36 sm:p-4 ${
                theme === id
                  ? "bg-lilac shadow-brutal-sm hover:bg-lilac"
                  : "bg-background hover:border-ink"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <Icon className="size-5 sm:size-7" />
                {theme === id && (
                  <span className="grid size-5 place-items-center rounded-full border-2 border-ink bg-lime sm:size-7">
                    <Check className="size-3 sm:size-4" />
                  </span>
                )}
              </div>
              <div>
                <span className="block font-display text-sm font-bold sm:text-xl">
                  {label}
                </span>
                <span className="mt-0.5 block text-xs font-medium text-muted-foreground sm:mt-1">
                  {description}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Current Theme Info */}
      <div className="rounded-ui border-2 border-ink bg-sun p-4 shadow-brutal-sm sm:p-5">
        <Monitor className="size-6 sm:size-7" />
        <p className="mt-2 font-display text-lg font-bold sm:mt-3 sm:text-xl">
          Tema aktif:{" "}
          {themeOptions.find((option) => option.id === theme)?.label}
        </p>
        <p className="mt-1 text-sm font-medium">
          Pilihan ini tersimpan dan digunakan lagi saat kamu membuka MewDrive.
        </p>
      </div>
    </section>
  );
}
