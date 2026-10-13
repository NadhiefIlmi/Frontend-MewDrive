/**
 * StorageSection Component
 * Storage breakdown dan usage — Task 10 (data real dari API)
 */

import { useState, useEffect } from "react";
import {
  HardDrive, FileText, FileImage, FileArchive,
  FileSpreadsheet, Video, Music, Folder, Loader2, File,
  Lightbulb, AlertTriangle,
} from "lucide-react";
import { api, type StorageBreakdownItem } from "@/lib/api";

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024)       return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes > 0)           return `${Math.round(bytes)} B`;
  return "0 B";
}

function getCategoryMeta(category: string): { color: string; Icon: React.ElementType } {
  switch (category) {
    case "Gambar":      return { color: "bg-lilac",  Icon: FileImage };
    case "Video":       return { color: "bg-sky",    Icon: Video };
    case "Audio":       return { color: "bg-lime",   Icon: Music };
    case "PDF":         return { color: "bg-coral",  Icon: FileText };
    case "Spreadsheet": return { color: "bg-lime",   Icon: FileSpreadsheet };
    case "Arsip":       return { color: "bg-sun",    Icon: FileArchive };
    case "Dokumen":     return { color: "bg-sky",    Icon: FileText };
    default:            return { color: "bg-muted",  Icon: File };
  }
}

// Warna segmen stacked bar agar berbeda antar kategori
const BAR_COLORS = ["bg-lilac", "bg-sky", "bg-lime", "bg-sun", "bg-coral", "bg-ink/20"];

// ─── Main StorageSection ──────────────────────────────────────────────────────

export function StorageSection() {
  const [used,      setUsed]      = useState(0);
  const [quota,     setQuota]     = useState(0);
  const [pct,       setPct]       = useState(0);
  const [free,      setFree]      = useState(0);
  const [breakdown, setBreakdown] = useState<StorageBreakdownItem[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await api.getStorage();
      setLoading(false);
      if (res.success && res.data) {
        setUsed(res.data.storage_used);
        setQuota(res.data.storage_quota);
        setPct(res.data.pct_used);
        setFree(res.data.storage_free);
        setBreakdown(res.data.breakdown);
      }
    })();
  }, []);

  const pctColor = pct >= 90 ? "text-red-600" : pct >= 70 ? "text-amber-600" : "text-muted-foreground";
  const tipText  = pct >= 90
    ? "Storage hampir penuh! Segera hapus file yang tidak diperlukan."
    : pct >= 70
    ? "Storage mulai penuh. Pertimbangkan menghapus file lama di Sampah."
    : "Hapus file yang tidak diperlukan di folder Sampah untuk mengosongkan space.";

  const TipIcon = pct >= 70 ? AlertTriangle : Lightbulb;

  return (
    <section className="mt-6 grid gap-4 sm:mt-10 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Storage Breakdown */}
      <div className="rounded-ui border-2 border-ink bg-card p-4 shadow-brutal sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-ui border-2 border-ink bg-sky sm:size-11">
            <HardDrive className="size-5 sm:size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold sm:text-2xl">Breakdown Penyimpanan</h2>
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">
              Lihat penggunaan storage berdasarkan tipe file.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span className="font-semibold">Memuat data storage...</span>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="mt-4 sm:mt-6">
              <div className="mb-2 flex items-center justify-between text-sm sm:text-base">
                <span className="font-bold">
                  {formatBytes(used)} dari {formatBytes(quota)}
                </span>
                <span className={`font-semibold ${pctColor}`}>{pct}%</span>
              </div>
              <div className="flex h-6 overflow-hidden rounded-ui border-2 border-ink sm:h-8">
                {breakdown.length > 0 ? (
                  breakdown.map((item, idx) => (
                    <div
                      key={item.category}
                      className={`${BAR_COLORS[idx % BAR_COLORS.length]}`}
                      style={{ width: `${Math.max(item.pct, 0.5)}%` }}
                      title={`${item.category}: ${formatBytes(item.total_size)} (${item.pct}%)`}
                    />
                  ))
                ) : (
                  <div className="bg-muted" style={{ width: `${pct}%` }} />
                )}
                <div className="flex-1 bg-background" />
              </div>
              {/* Legenda */}
              {breakdown.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 sm:gap-3">
                  {breakdown.map((item, idx) => (
                    <span key={item.category} className="flex items-center gap-1 text-xs font-semibold sm:gap-1.5">
                      <span className={`inline-block size-2.5 rounded-sm border border-ink/30 sm:size-3 ${BAR_COLORS[idx % BAR_COLORS.length]}`} />
                      {item.category}
                    </span>
                  ))}
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground sm:gap-1.5">
                    <span className="inline-block size-2.5 rounded-sm border border-ink/30 bg-background sm:size-3" />
                    Tersedia
                  </span>
                </div>
              )}
            </div>

            {/* Breakdown List */}
            <div className="mt-5 space-y-2 sm:mt-8 sm:space-y-3">
              {breakdown.length === 0 ? (
                <p className="py-6 text-center text-sm font-semibold text-muted-foreground">
                  Belum ada file tersimpan.
                </p>
              ) : (
                breakdown.map((item) => {
                  const { color, Icon } = getCategoryMeta(item.category);
                  return (
                    <div
                      key={item.category}
                      className="flex items-center justify-between rounded-ui border-2 border-ink bg-background p-3 sm:p-4"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className={`grid size-9 shrink-0 place-items-center rounded-ui border-2 border-ink sm:size-10 ${color}`}>
                          <Icon className="size-4 sm:size-5" />
                        </span>
                        <div>
                          <p className="text-sm font-bold sm:text-base">{item.category}</p>
                          <p className="text-xs text-muted-foreground">{item.file_count} file</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold sm:text-base">{formatBytes(item.total_size)}</p>
                        <p className={`text-xs font-semibold ${pctColor}`}>{item.pct}%</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Storage Summary */}
      <div className={`rounded-ui border-2 border-ink p-4 shadow-brutal-sm sm:p-5 ${pct >= 90 ? "bg-coral" : "bg-coral"}`}>
        <HardDrive className="size-6 sm:size-7" />
        <p className="mt-2 font-display text-lg font-bold sm:mt-3 sm:text-xl">Storage Quota</p>
        {loading ? (
          <p className="mt-1 text-sm font-medium text-muted-foreground">Memuat...</p>
        ) : (
          <>
            <p className="mt-1 text-sm font-medium">
              {quota > 0
                ? `Kamu menggunakan ${pct}% dari total storage. Masih tersisa ${formatBytes(free)} untuk file baru.`
                : "Data storage tidak tersedia."}
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full border-2 border-ink bg-card">
              <div
                className={`h-full transition-all ${pct >= 90 ? "bg-ink" : "bg-ink/70"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-xs font-bold">{pct}% terpakai</p>
          </>
        )}
        <div className="mt-3 flex items-start gap-2 rounded-ui border-2 border-ink bg-sun p-3 text-sm font-semibold sm:mt-4">
          <TipIcon className="mt-0.5 size-4 shrink-0" />
          <span>{tipText}</span>
        </div>
      </div>
    </section>
  );
}
