import { useState, useEffect, useCallback } from "react";
import { Check, Upload, Eye, Download, Share2, Trash2, Settings, Users, HardDrive, Shield, Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type Permission } from "@/lib/api";

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  create_files:        Upload,
  view_files:          Eye,
  edit_files:          Settings,
  delete_files:        Trash2,
  download_files:      Download,
  share_files:         Share2,
  view_shared:         Eye,
  manage_shared:       Settings,
  manage_users:        Users,
  view_all_files:      Eye,
  system_settings:     Settings,
  storage_management:  HardDrive,
};

const CATEGORY_LABELS: Record<string, string> = {
  files:   "File Management",
  sharing: "Sharing & Collaboration",
  admin:   "Administrative Functions",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  files:   Upload,
  sharing: Share2,
  admin:   Shield,
};

const CATEGORIES = ["files", "sharing", "admin"] as const;

export function PermissionsTab({ userId }: { userId: number }) {
  const [allPermissions, setAllPermissions]     = useState<Permission[]>([]);
  const [selectedNames, setSelectedNames]       = useState<Set<string>>(new Set());
  const [originalNames, setOriginalNames]       = useState<Set<string>>(new Set());
  const [loading, setLoading]                   = useState(true);
  const [saving, setSaving]                     = useState(false);
  const [error, setError]                       = useState<string | null>(null);
  const [successMsg, setSuccessMsg]             = useState<string | null>(null);

  // ─── Load permissions ───────────────────────────────────────────────────────
  const loadPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [allRes, userRes] = await Promise.all([
      api.getAllPermissions(),
      api.getUserPermissions(userId),
    ]);

    if (!allRes.success || !userRes.success) {
      setError("Gagal memuat data permission dari server");
      setLoading(false);
      return;
    }

    const all  = allRes.data  ?? [];
    const user = userRes.data ?? [];
    const names = new Set(user.map((p) => p.name));

    setAllPermissions(all);
    setSelectedNames(new Set(names));
    setOriginalNames(new Set(names));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // ─── Toggle single permission ────────────────────────────────────────────────
  const togglePermission = (name: string) => {
    setSelectedNames((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
    setSuccessMsg(null);
  };

  // ─── Reset ke original (sebelum save) ────────────────────────────────────────
  const handleReset = () => {
    setSelectedNames(new Set(originalNames));
    setSuccessMsg(null);
  };

  // ─── Save ke API ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const res = await api.setUserPermissions(userId, Array.from(selectedNames));
    setSaving(false);

    if (res.success) {
      const saved = new Set((res.data ?? []).map((p) => p.name));
      setSelectedNames(saved);
      setOriginalNames(saved);
      setSuccessMsg("Permissions berhasil disimpan");
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setError(res.error?.message ?? "Gagal menyimpan permissions");
    }
  };

  const isDirty = [...selectedNames].some((n) => !originalNames.has(n)) ||
                  [...originalNames].some((n) => !selectedNames.has(n));

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="font-semibold">Memuat permissions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-ui border-2 border-ink bg-coral p-6 text-center">
        <p className="font-bold">{error}</p>
        <Button className="mt-4" onClick={loadPermissions}>Coba Lagi</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-ui border-2 border-ink bg-sun p-4">
        <div>
          <h2 className="font-display text-xl font-bold">System Permissions</h2>
          <p className="text-sm text-muted-foreground">
            {selectedNames.size} dari {allPermissions.length} permission aktif
          </p>
        </div>
        {isDirty && (
          <span className="rounded-full border-2 border-ink bg-coral px-3 py-1 text-xs font-bold">
            Ada perubahan belum disimpan
          </span>
        )}
      </div>

      {/* Permission categories */}
      {CATEGORIES.map((cat) => {
        const perms = allPermissions.filter((p) => p.category === cat);
        if (perms.length === 0) return null;
        const CatIcon = CATEGORY_ICONS[cat]!;
        const isAdmin = cat === "admin";

        return (
          <div key={cat} className="rounded-ui border-2 border-ink bg-background p-5">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
              <CatIcon className="size-5" />
              {CATEGORY_LABELS[cat]}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              {perms.map((p) => {
                const isOn  = selectedNames.has(p.name);
                const Icon  = ICON_MAP[p.name] ?? Settings;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePermission(p.name)}
                    className={`flex items-start gap-3 rounded-ui border-2 border-ink p-3 text-left transition-colors ${
                      isOn
                        ? isAdmin
                          ? "bg-coral shadow-brutal-sm"
                          : "bg-lime shadow-brutal-sm"
                        : "bg-card hover:bg-muted"
                    }`}
                  >
                    {/* Checkbox */}
                    <span
                      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded border-2 border-ink ${
                        isOn ? (isAdmin ? "bg-coral" : "bg-lime") : "bg-card"
                      }`}
                    >
                      {isOn && <Check className="size-3" />}
                    </span>

                    <span className="grid size-8 shrink-0 place-items-center rounded-ui border-2 border-ink bg-card">
                      <Icon className="size-4" />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Success message */}
      {successMsg && (
        <div className="rounded-ui border-2 border-ink bg-lime p-3 text-center font-bold">
          ✓ {successMsg}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="secondary"
          onClick={handleReset}
          disabled={!isDirty || saving}
          className="gap-2"
        >
          <RotateCcw className="size-4" />
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
