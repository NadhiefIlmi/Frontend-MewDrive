/**
 * StorageSection Component
 * Breakdown penyimpanan dan penggunaan kuota akun — Data real dari API.
 * Desain Neo-Brutalisme MewDrive yang responsif di desktop & mobile,
 * dilengkapi Cockpit Stats Overview, Visual Bar Berwarna, dan Kartu Kategori Rapi.
 */

import { useState, useEffect } from "react";
import {
  HardDrive, FileText, FileImage, FileArchive,
  FileSpreadsheet, Video, Music, Loader2, File,
  Lightbulb, AlertTriangle, Sparkles, Database,
  ArrowRight, Trash2, CheckCircle2,
} from "lucide-react";
import { api, type StorageBreakdownItem } from "@/lib/api";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024)       return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes > 0)           return `${Math.round(bytes)} B`;
  return "0 B";
}

function getCategoryMeta(category: string): { color: string; barBg: string; badgeColor: string; Icon: React.ElementType } {
  switch (category) {
    case "Gambar":
      return {
        color: "bg-lilac text-purple-950",
        barBg: "bg-lilac",
        badgeColor: "bg-lilac/30 text-purple-950 border-purple-400",
        Icon: FileImage,
      };
    case "Video":
      return {
        color: "bg-sky text-sky-950",
        barBg: "bg-sky",
        badgeColor: "bg-sky/30 text-sky-950 border-sky-400",
        Icon: Video,
      };
    case "Audio":
      return {
        color: "bg-teal-200 text-teal-950",
        barBg: "bg-teal-300",
        badgeColor: "bg-teal-200/40 text-teal-950 border-teal-500",
        Icon: Music,
      };
    case "PDF":
      return {
        color: "bg-coral text-red-950",
        barBg: "bg-coral",
        badgeColor: "bg-coral/30 text-red-950 border-red-400",
        Icon: FileText,
      };
    case "Spreadsheet":
      return {
        color: "bg-lime text-emerald-950",
        barBg: "bg-lime",
        badgeColor: "bg-lime/30 text-emerald-950 border-emerald-500",
        Icon: FileSpreadsheet,
      };
    case "Arsip":
      return {
        color: "bg-sun text-amber-950",
        barBg: "bg-sun",
        badgeColor: "bg-sun/30 text-amber-950 border-amber-500",
        Icon: FileArchive,
      };
    case "Dokumen":
      return {
        color: "bg-sky text-sky-950",
        barBg: "bg-sky",
        badgeColor: "bg-sky/30 text-sky-950 border-sky-400",
        Icon: FileText,
      };
    default:
      return {
        color: "bg-orange-200 text-orange-950",
        barBg: "bg-orange-300",
        badgeColor: "bg-orange-200/40 text-orange-950 border-orange-400",
        Icon: File,
      };
  }
}

interface StorageSectionProps {
  onSectionChange?: (section: any) => void;
}

export function StorageSection({ onSectionChange }: StorageSectionProps) {
  const [used, setUsed]           = useState(0);
  const [quota, setQuota]         = useState(0);
  const [pct, setPct]             = useState(0);
  const [free, setFree]           = useState(0);
  const [breakdown, setBreakdown] = useState<StorageBreakdownItem[]>([]);
  const [loading, setLoading]     = useState(true);

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

  const totalFiles = breakdown.reduce((acc, item) => acc + item.file_count, 0);

  const pctColor =
    pct >= 90 ? "text-red-600" : pct >= 70 ? "text-amber-600" : "text-emerald-700";

  const tipText =
    pct >= 90
      ? "Penyimpanan hampir penuh! Segera hapus file yang tidak diperlukan untuk mencegah kegagalan upload."
      : pct >= 70
      ? "Kapasitas penyimpanan mulai terisi lebih dari 70%. Bersihkan file lama di folder Sampah jika perlu."
      : "Kapasitas penyimpananmu sangat aman dan lega. Hapus file di folder Sampah secara permanen untuk menghemat ruang.";

  const TipIcon = pct >= 70 ? AlertTriangle : Lightbulb;

  return (
    <section className="space-y-6 pt-2">

      {/* ─── 1. Cockpit Hero Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-sun/30 p-5 sm:p-6 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <div className="grid size-12 sm:size-14 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-card shadow-brutal-xs">
            <HardDrive className="size-6 sm:size-7 text-ink" />
          </div>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/30 bg-background/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink mb-1.5">
              Kapasitas &amp; Kuota
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Breakdown Penyimpanan
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground max-w-xl leading-relaxed">
              Lihat distribusi penggunaan ruang penyimpanan akunmu berdasarkan kategori file dan sisa kuota yang tersedia.
            </p>
          </div>
        </div>

        {/* Status Indicator Badge */}
        <div className="shrink-0 self-start md:self-center">
          <div className={`inline-flex items-center gap-2 rounded-xl border-2 border-ink px-4 py-2 font-bold shadow-brutal-xs ${
            pct >= 90 ? "bg-coral text-ink" : pct >= 70 ? "bg-sun text-ink" : "bg-lime text-ink"
          }`}>
            <span className={`size-2.5 rounded-full border border-ink/40 ${
              pct >= 90 ? "bg-red-700 animate-pulse" : pct >= 70 ? "bg-amber-700" : "bg-green-700 animate-pulse"
            }`} />
            <span className="text-xs sm:text-sm">
              {pct >= 90 ? "Kapasitas Kritis" : pct >= 70 ? "Mulai Terisi" : "Kapasitas Aman"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 2. Cockpit Stats Overview Bar (4 Cards) ─── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Terpakai */}
        <div className="rounded-2xl border-2 border-ink bg-card p-3.5 sm:p-4 shadow-brutal-xs hover:shadow-brutal-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Terpakai</span>
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-sun shadow-[1px_1px_0px_#000]">
              <HardDrive className="size-4 text-ink" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <p className="font-display text-xl sm:text-2xl font-bold text-foreground">
              {formatBytes(used)}
            </p>
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground truncate">
            {pct}% dari total kuota
          </p>
        </div>

        {/* Tersisa */}
        <div className="rounded-2xl border-2 border-ink bg-card p-3.5 sm:p-4 shadow-brutal-xs hover:shadow-brutal-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sisa Ruang</span>
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-lime shadow-[1px_1px_0px_#000]">
              <Sparkles className="size-4 text-ink" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <p className="font-display text-xl sm:text-2xl font-bold text-foreground">
              {formatBytes(free)}
            </p>
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground truncate">
            Ruang kosong siap diisi
          </p>
        </div>

        {/* Total Kuota */}
        <div className="rounded-2xl border-2 border-ink bg-card p-3.5 sm:p-4 shadow-brutal-xs hover:shadow-brutal-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Kuota</span>
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-sky shadow-[1px_1px_0px_#000]">
              <Database className="size-4 text-ink" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <p className="font-display text-xl sm:text-2xl font-bold text-foreground">
              {formatBytes(quota)}
            </p>
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground truncate">
            Batas maksimal akun
          </p>
        </div>

        {/* Total Berkas */}
        <div className="rounded-2xl border-2 border-ink bg-card p-3.5 sm:p-4 shadow-brutal-xs hover:shadow-brutal-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total File</span>
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-lilac shadow-[1px_1px_0px_#000]">
              <FileText className="size-4 text-ink" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <p className="font-display text-xl sm:text-2xl font-bold text-foreground">
              {totalFiles}
            </p>
            <span className="text-xs font-bold text-muted-foreground">berkas</span>
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground truncate">
            Di seluruh folder akun
          </p>
        </div>
      </div>

      {/* ─── 3. Visual Storage Bar Card ─── */}
      <div className="rounded-2xl border-2 border-ink bg-card p-4 sm:p-6 shadow-brutal-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink/15 pb-3">
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
              Visualisasi Distribusi Penyimpanan
            </h2>
            <p className="text-xs font-medium text-muted-foreground">
              Proporsi berkas tersimpan terhadap total alokasi akun.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-sm sm:text-base font-bold text-foreground">
              {formatBytes(used)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">/ {formatBytes(quota)}</span>
            <span className={`ml-1 rounded-xl border-2 border-ink bg-card px-2.5 py-0.5 font-mono text-xs font-bold shadow-brutal-xs ${pctColor}`}>
              {pct}%
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span className="font-semibold text-sm">Memuat kalkulasi storage...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Multi-segment Progress Bar */}
            <div className="h-6 sm:h-7 rounded-xl border-2 border-ink bg-muted/40 p-0.5 flex overflow-hidden shadow-brutal-xs">
              {breakdown.length > 0 && used > 0 ? (
                breakdown.map((item) => {
                  const meta = getCategoryMeta(item.category);
                  // Hitung proporsi visual terhadap file yang terpakai
                  const shareOfUsed = ((item.total_size / used) * 100);
                  return (
                    <div
                      key={item.category}
                      className={`${meta.barBg} h-full transition-all first:rounded-l-lg last:rounded-r-lg border-r border-ink/20 last:border-r-0`}
                      style={{ width: `${Math.max(shareOfUsed, 4)}%` }}
                      title={`${item.category}: ${formatBytes(item.total_size)} (${shareOfUsed.toFixed(1)}% dari berkas)`}
                    />
                  );
                })
              ) : (
                <div className="h-full w-full bg-background" />
              )}
            </div>

            {/* Interactive Legenda Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {breakdown.map((item) => {
                const meta = getCategoryMeta(item.category);
                return (
                  <div
                    key={item.category}
                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-ink bg-card px-2.5 py-1 text-xs font-bold shadow-brutal-xs"
                  >
                    <span className={`size-3 rounded-md border border-ink ${meta.barBg}`} />
                    <span>{item.category}</span>
                    <span className="text-muted-foreground font-semibold">
                      ({formatBytes(item.total_size)})
                    </span>
                  </div>
                );
              })}
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-ink/30 bg-muted/30 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                <span className="size-3 rounded-md border border-ink/30 bg-background" />
                <span>Tersedia ({formatBytes(free)})</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 4. Category Breakdown Cards Grid ─── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
            Rincian Berdasarkan Kategori
          </h2>
          <span className="rounded-full border-2 border-ink bg-sun/40 px-2.5 py-0.5 text-xs font-bold text-ink">
            {breakdown.length} kategori
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span className="font-semibold text-sm">Memuat kategori...</span>
          </div>
        ) : breakdown.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-ink/40 bg-card p-8 text-center shadow-brutal-xs">
            <HardDrive className="mx-auto mb-2 size-8 text-muted-foreground" />
            <p className="font-display text-base font-bold text-foreground">Belum ada file tersimpan</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Unggah file di Dokumen Saya untuk melihat rincian penggunaan storage.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2 sm:gap-4">
            {breakdown.map((item) => {
              const meta = getCategoryMeta(item.category);
              const shareOfUsed = used > 0 ? (item.total_size / used) * 100 : 0;
              const Icon = meta.Icon;

              return (
                <div
                  key={item.category}
                  className="rounded-2xl border-2 border-ink bg-card p-4 shadow-brutal-xs hover:shadow-brutal-sm hover:-translate-y-0.5 transition-all flex flex-col justify-between space-y-3"
                >
                  {/* Top: Icon + Info + Size */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`grid size-11 shrink-0 place-items-center rounded-xl border-2 border-ink ${meta.color} shadow-[1px_1px_0px_#000]`}>
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-base font-bold text-foreground leading-tight truncate">
                          {item.category}
                        </p>
                        <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                          {item.file_count} file tersimpan
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-display text-base font-bold text-foreground leading-tight">
                        {formatBytes(item.total_size)}
                      </p>
                      <span className="inline-block mt-0.5 rounded border border-ink/20 bg-muted/60 px-1.5 py-0.2 text-[10px] font-bold text-muted-foreground">
                        {shareOfUsed.toFixed(1)}% berkas
                      </span>
                    </div>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="space-y-1">
                    <div className="h-2 w-full overflow-hidden rounded-full border border-ink/30 bg-muted/40">
                      <div
                        className={`h-full rounded-full ${meta.barBg}`}
                        style={{ width: `${Math.max(shareOfUsed, 2)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                      <span>Porsi penyimpanan berkas</span>
                      <span>{item.pct > 0 ? `${item.pct}% dari total kuota` : "< 1% kuota akun"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 5. Storage Quota & Efficiency Recommendation Banner ─── */}
      <div className="rounded-2xl border-2 border-ink bg-card p-4 sm:p-5 shadow-brutal-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-sun text-ink shadow-[1px_1px_0px_#000]">
            <TipIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-sm sm:text-base font-bold text-foreground">
              Status &amp; Rekomendasi Ruang Simpan
            </h3>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground leading-relaxed">
              Kamu menggunakan <span className="font-bold text-foreground">{formatBytes(used)} ({pct}%)</span> dari total alokasi <span className="font-bold text-foreground">{formatBytes(quota)}</span>. Masih tersisa <span className="font-bold text-foreground">{formatBytes(free)}</span> ruang kosong.
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-foreground/70">
              {tipText}
            </p>
          </div>
        </div>

        {/* Quick Action Navigation Buttons */}
        {onSectionChange && (
          <div className="flex shrink-0 items-center gap-2 self-start md:self-center w-full md:w-auto">
            <button
              type="button"
              onClick={() => onSectionChange("trash")}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-ink bg-card hover:bg-muted px-3.5 py-2 text-xs font-bold text-foreground shadow-brutal-xs hover:-translate-y-0.5 transition-all"
            >
              <Trash2 className="size-3.5 text-red-600" />
              <span>Buka Sampah</span>
            </button>

            <button
              type="button"
              onClick={() => onSectionChange("files")}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-ink bg-sun hover:bg-sun/90 px-3.5 py-2 text-xs font-bold text-ink shadow-brutal-xs hover:-translate-y-0.5 transition-all"
            >
              <span>Dokumen Saya</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

    </section>
  );
}
