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
    <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Theme Settings */}
      <div className="rounded-ui border-2 border-ink bg-card p-6 shadow-brutal">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-ui border-2 border-ink bg-lilac">
            <Sun className="size-6" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-bold">Tampilan</h2>
            <p className="text-sm font-medium text-muted-foreground">
              Pilih tema untuk seluruh aplikasi.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {themeOptions.map(({ id, label, description, Icon }) => (
            <Button
              key={id}
              variant="ghost"
              onClick={() => changeTheme(id)}
              aria-pressed={theme === id}
              className={`relative flex h-auto min-h-36 flex-col items-start justify-between border-ink p-4 text-left ${
                theme === id
                  ? "bg-lilac shadow-brutal-sm hover:bg-lilac"
                  : "bg-background hover:border-ink"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <Icon className="size-7" />
                {theme === id && (
                  <span className="grid size-7 place-items-center rounded-full border-2 border-ink bg-lime">
                    <Check className="size-4" />
                  </span>
                )}
              </div>
              <div>
                <span className="block font-display text-xl font-bold">
                  {label}
                </span>
                <span className="mt-1 block text-xs font-medium text-muted-foreground">
                  {description}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Current Theme Info */}
      <div className="rounded-ui border-2 border-ink bg-sun p-5 shadow-brutal-sm">
        <Monitor className="size-7" />
        <p className="mt-3 font-display text-xl font-bold">
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
