/**
 * TelegramSettings Component
 * Desain Baru Neo-Brutalisme MewDrive — Responsif Desktop & Mobile,
 * Cockpit Stats, Kredensial Terstruktur, Simulator Chat Telegram Realistis,
 * dan Pengaturan Jadwal yang Mudah Digunakan.
 */

import { useState, useEffect, useMemo } from "react";
import {
  Bot, Eye, EyeOff, CheckCircle2, XCircle, Loader2, Send, Trash2,
  Clock, Bell, BellOff, Lock, Pencil, Key, Calendar,
  AlertCircle, Smartphone, ClipboardList, FileText,
  ShieldCheck, RefreshCw, ExternalLink, HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api } from "@/lib/api";

type ConnectionStatus = "unconfigured" | "testing" | "connected" | "error";
type Frequency = "daily" | "weekly";
type ReportType = "summary" | "detailed";

interface TelegramPrefs {
  reportEnabled: boolean;
  frequency: Frequency;
  sendHour: number;
  sendMinute: number;
  sendDay: number;
  reportType: ReportType;
}

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, "0"),
}));

const MINUTES = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, "0"),
}));

const DAYS = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 7, label: "Minggu" },
];

/* ─── Toggle Switch ───────────────────────────────────────────────────────── */
function Toggle({
  enabled,
  onToggle,
  disabled,
}: {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={onToggle}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-ink shadow-brutal-xs transition-colors focus-visible:outline-none ${
        enabled ? "bg-lime" : "bg-muted"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <span
        className={`inline-block size-5 rounded-full border-2 border-ink bg-card shadow transition-transform ${
          enabled ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/* ─── Live Telegram Chat Simulator Bubble ─────────────────────────────────── */
function TelegramChatSimulator({
  reportType,
  sendHour = 8,
  sendMinute = 0,
  frequency = "daily",
  onReportTypeChange,
}: {
  reportType: ReportType;
  sendHour?: number;
  sendMinute?: number;
  frequency?: Frequency;
  onReportTypeChange?: (type: ReportType) => void;
}) {
  const timeStr = `${String(sendHour).padStart(2, "0")}:${String(sendMinute).padStart(2, "0")}`;
  const freqPrefix = frequency === "weekly" ? "Weekly" : "Daily";

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-brutal-sm">
      {/* Telegram App Header Bar */}
      <div className="flex items-center justify-between border-b-2 border-ink bg-[#2AABEE] px-4 py-3 text-white">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-full border border-white/40 bg-white text-[#2AABEE] shadow-sm">
            <Bot className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-sm font-bold leading-tight">MewDrive Bot</span>
              <span className="rounded bg-white/20 px-1 py-0.2 text-[9px] font-extrabold uppercase tracking-wider text-white">
                bot
              </span>
            </div>
            <p className="text-[10px] text-white/80 font-medium">Laporan Otomatis MewDrive</p>
          </div>
        </div>

        {/* Quick Preview Toggle (Summary vs Detail) */}
        {onReportTypeChange && (
          <div className="flex items-center rounded-lg border border-white/40 bg-black/20 p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => onReportTypeChange("summary")}
              className={`rounded px-2 py-0.5 transition-colors ${
                reportType === "summary" ? "bg-white text-ink shadow-xs" : "text-white/80 hover:text-white"
              }`}
            >
              Ringkasan
            </button>
            <button
              type="button"
              onClick={() => onReportTypeChange("detailed")}
              className={`rounded px-2 py-0.5 transition-colors ${
                reportType === "detailed" ? "bg-white text-ink shadow-xs" : "text-white/80 hover:text-white"
              }`}
            >
              Detail
            </button>
          </div>
        )}
      </div>

      {/* Telegram Chat Message Viewport */}
      <div className="bg-[#E7EBF0] dark:bg-[#18222D] p-3.5 sm:p-4">
        <div className="mx-auto max-w-full">
          {/* Chat Bubble with speech tail */}
          <div className="relative rounded-2xl rounded-tl-sm border-2 border-ink bg-card p-4 text-foreground shadow-brutal-xs">
            {reportType === "summary" ? (
              <div className="space-y-3 font-sans text-xs leading-relaxed">
                <div>
                  <p className="font-display text-sm font-bold text-foreground">
                    📋 {freqPrefix} Task Report (Ringkasan)
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground">{todayStr}</p>
                </div>

                <div className="rounded-xl border border-ink/20 bg-muted/40 p-2.5 space-y-1">
                  <p className="font-bold text-ink">Ringkasan Status Task</p>
                  <div className="grid grid-cols-2 gap-1 pt-1 font-medium">
                    <p>📝 To Do: <span className="font-bold">3</span></p>
                    <p>🔄 In Progress: <span className="font-bold">2</span></p>
                    <p>👀 In Review: <span className="font-bold">1</span></p>
                    <p>✅ Done: <span className="font-bold">3</span></p>
                  </div>
                  <div className="border-t border-ink/15 pt-1.5 flex items-center justify-between font-bold">
                    <span>Total Tugas Aktif:</span>
                    <span className="rounded bg-sun px-1.5 py-0.2 border border-ink text-xs">9 task</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-ink">🔥 Prioritas High & Critical</p>
                  <p className="text-muted-foreground font-medium">• Implementasi API Login (in progress)</p>
                  <p className="text-muted-foreground font-medium">• Review validasi form (in review)</p>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-ink">⏰ Deadline Terdekat</p>
                  <p className="text-muted-foreground font-medium">• Validasi form — 20 Okt</p>
                  <p className="text-muted-foreground font-medium">• Desain UI Dashboard — 21 Okt</p>
                </div>

                <div className="flex items-center justify-between border-t border-ink/15 pt-2 text-[11px]">
                  <a
                    href="https://mewdrive.my.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-600 underline hover:opacity-80"
                  >
                    🔗 Buka MewDrive App
                  </a>
                  <span className="font-mono text-[10px] text-muted-foreground">{timeStr} WIB ✓✓</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 font-sans text-xs leading-relaxed">
                <div>
                  <p className="font-display text-sm font-bold text-foreground">
                    📄 {freqPrefix} Task Report (Detail Terperinci)
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground">{todayStr}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="rounded-lg border border-ink/20 bg-muted/40 p-2 space-y-1">
                    <p className="font-bold text-ink">📝 TO DO (2)</p>
                    <p className="text-[11px] text-foreground font-medium">• Desain UI Dashboard [🟡 Medium, ⏰ 21 Okt]</p>
                    <p className="text-[11px] text-foreground font-medium">• Tambah validasi form [🟢 Low, ⏰ 20 Okt]</p>
                  </div>

                  <div className="rounded-lg border border-ink/20 bg-muted/40 p-2 space-y-1">
                    <p className="font-bold text-ink">🔄 IN PROGRESS (1)</p>
                    <p className="text-[11px] text-foreground font-medium">• Integrasi Telegram Bot [🔥 High, ⏰ 31 Okt]</p>
                  </div>

                  <div className="rounded-lg border border-ink/20 bg-muted/40 p-2 space-y-1">
                    <p className="font-bold text-ink">✅ DONE (1)</p>
                    <p className="text-[11px] text-foreground font-medium">• Setup database migration [🔥 High, ⏰ 20 Okt]</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-ink/15 pt-2 text-[11px]">
                  <a
                    href="https://mewdrive.my.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-600 underline hover:opacity-80"
                  >
                    🔗 Kelola Task di MewDrive
                  </a>
                  <span className="font-mono text-[10px] text-muted-foreground">{timeStr} WIB ✓✓</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
interface TelegramSettingsProps {
  onFlash: (msg: string, type?: "success" | "error" | "info") => void;
}

export function TelegramSettings({ onFlash }: TelegramSettingsProps) {
  const [token, setToken]                         = useState("");
  const [tokenMask, setTokenMask]                 = useState("");
  const [chatId, setChatId]                       = useState("");
  const [showToken, setShowToken]                 = useState(false);
  const [status, setStatus]                       = useState<ConnectionStatus>("unconfigured");
  const [errorMsg, setErrorMsg]                   = useState("");
  const [isEditing, setIsEditing]                 = useState(false);
  const [isSendingTest, setIsSendingTest]         = useState(false);
  const [isDeleting, setIsDeleting]               = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule]   = useState(false);
  const [isSavedRecently, setIsSavedRecently]     = useState(false);
  const [savedPrefs, setSavedPrefs]               = useState<TelegramPrefs | null>(null);
  const [prefs, setPrefs]                         = useState<TelegramPrefs>({
    reportEnabled: false,
    frequency: "daily",
    sendHour: 8,
    sendMinute: 0,
    sendDay: 1,
    reportType: "summary",
  });

  const isConnected = status === "connected";

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cfgRes, prefsRes] = await Promise.all([
          api.getTelegramConfig(),
          api.getNotificationPreferences(),
        ]);
        if (!mounted) return;

        if (cfgRes.success && cfgRes.data) {
          if (cfgRes.data.configured && cfgRes.data.is_verified) {
            setStatus("connected");
            if (cfgRes.data.chat_id_mask) setChatId(cfgRes.data.chat_id_mask);
            if (cfgRes.data.token_mask)   setTokenMask(cfgRes.data.token_mask);
          } else if (cfgRes.data.configured) {
            setStatus("error");
            setErrorMsg("Koneksi bot sebelumnya gagal diverifikasi.");
            setIsEditing(true);
          }
        }

        if (prefsRes.success && prefsRes.data) {
          const p: TelegramPrefs = {
            reportEnabled: prefsRes.data.report_enabled,
            frequency:  prefsRes.data.frequency   || "daily",
            sendHour:   prefsRes.data.send_hour   ?? 8,
            sendMinute: prefsRes.data.send_minute ?? 0,
            sendDay:    prefsRes.data.send_day    ?? 1,
            reportType: prefsRes.data.report_type || "summary",
          };
          setPrefs(p);
          setSavedPrefs(p);
        }
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSaveAndTest = async () => {
    if (!token.trim()) {
      onFlash("Masukkan Bot Token dari Telegram BotFather.", "error");
      return;
    }
    if (!chatId.trim() || !/^\d+$/.test(chatId.trim())) {
      onFlash("Masukkan Chat ID Telegram berupa deretan angka.", "error");
      return;
    }

    setStatus("testing");
    setErrorMsg("");
    try {
      const res = await api.saveTelegramConfig({
        bot_token: token.trim(),
        chat_id: Number(chatId.trim()),
      });

      if (res.success && res.data?.is_verified) {
        setStatus("connected");
        setToken("");
        if (res.data.token_mask)   setTokenMask(res.data.token_mask);
        if (res.data.chat_id_mask) setChatId(res.data.chat_id_mask);
        setIsEditing(false);
        onFlash("Bot Telegram berhasil terhubung dan terverifikasi!", "success");
      } else {
        const msg = res.error?.message || "Gagal menghubungkan ke bot Telegram.";
        setStatus("error");
        setErrorMsg(msg);
        onFlash(msg, "error");
      }
    } catch (err: any) {
      const msg = err.message || "Gagal terhubung ke Telegram.";
      setStatus("error");
      setErrorMsg(msg);
      onFlash(msg, "error");
    }
  };

  const handleTestMessage = async () => {
    if (!isConnected || isSendingTest) return;
    setIsSendingTest(true);
    onFlash("Mengirim pesan tes ke Telegram...", "info");
    try {
      const res = await api.testTelegramConfig();
      onFlash(
        res.success ? "Pesan tes berhasil dikirim! Silakan periksa Telegram kamu." : (res.error?.message || "Gagal."),
        res.success ? "success" : "error"
      );
    } catch (err: any) {
      onFlash(err.message || "Gagal mengirim pesan tes.", "error");
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleDisconnect = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteTelegramConfig();
      if (res.success) {
        setStatus("unconfigured");
        setToken("");
        setTokenMask("");
        setChatId("");
        setIsEditing(false);
        setPrefs(p => ({ ...p, reportEnabled: false }));
        onFlash("Konfigurasi bot Telegram berhasil diputuskan.");
      } else {
        onFlash(res.error?.message || "Gagal memutuskan konfigurasi.", "error");
      }
    } catch (err: any) {
      onFlash(err.message || "Gagal.", "error");
    } finally {
      setIsDeleting(false);
      setShowDisconnectDialog(false);
    }
  };

  const updatePref = <K extends keyof TelegramPrefs>(key: K, val: TelegramPrefs[K]) => {
    setPrefs(p => ({ ...p, [key]: val }));
  };

  const handleToggleReport = async () => {
    const next = !prefs.reportEnabled;
    updatePref("reportEnabled", next);
    try {
      await api.updateNotificationPreferences({ report_enabled: next });
      setSavedPrefs(p => p ? { ...p, reportEnabled: next } : null);
      onFlash(next ? "Laporan otomatis Telegram diaktifkan." : "Laporan otomatis dinonaktifkan.", "info");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      const res = await api.updateNotificationPreferences({
        report_enabled: prefs.reportEnabled,
        frequency: prefs.frequency,
        send_hour: prefs.sendHour,
        send_minute: prefs.sendMinute,
        send_day: prefs.sendDay,
        report_type: prefs.reportType,
      });

      if (res.success) {
        setSavedPrefs({ ...prefs });
        setIsSavedRecently(true);
        setTimeout(() => setIsSavedRecently(false), 3500);
        onFlash("Pengaturan jadwal laporan berhasil disimpan!", "success");
      } else {
        onFlash(res.error?.message || "Gagal menyimpan jadwal.", "error");
      }
    } catch (err: any) {
      onFlash(err.message || "Gagal menyimpan jadwal.", "error");
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const isDirty = Boolean(
    savedPrefs && (
      prefs.reportEnabled !== savedPrefs.reportEnabled ||
      prefs.frequency     !== savedPrefs.frequency     ||
      prefs.sendHour      !== savedPrefs.sendHour      ||
      prefs.sendMinute    !== savedPrefs.sendMinute    ||
      (prefs.frequency === "weekly" && prefs.sendDay !== savedPrefs.sendDay) ||
      prefs.reportType    !== savedPrefs.reportType
    )
  );

  const inputClass = (ro?: boolean) =>
    `w-full rounded-xl border-2 border-ink px-3.5 py-2.5 font-mono text-sm font-semibold outline-none transition-colors focus:ring-2 focus:ring-ink/20 ${
      ro ? "bg-muted/40 text-foreground cursor-default" : "bg-background text-foreground"
    }`;

  const selectClass =
    "w-full rounded-xl border-2 border-ink bg-background px-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-ink/20 cursor-pointer";

  return (
    <section className="space-y-6">

      {/* ─── 1. Cockpit Hero Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-lilac p-5 sm:p-6 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <div className="grid size-12 sm:size-14 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-card shadow-brutal-xs">
            <Bot className="size-6 sm:size-7 text-ink" />
          </div>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/30 bg-background/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink mb-1.5">
              Notifikasi &amp; Laporan
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Telegram Task Report
            </h2>
            <p className="mt-1 text-xs sm:text-sm font-medium text-foreground/80 max-w-xl leading-relaxed">
              Kirim rekapitulasi tugas otomatis langsung ke bot Telegram pribadimu secara terjadwal.
            </p>
          </div>
        </div>

        {/* Status indicator badge */}
        <div className="shrink-0 self-start md:self-center">
          <div className={`inline-flex items-center gap-2 rounded-xl border-2 border-ink px-4 py-2 font-bold shadow-brutal-xs ${
            status === "connected"
              ? "bg-lime text-ink"
              : status === "testing"
              ? "bg-sun text-ink"
              : status === "error"
              ? "bg-coral text-ink"
              : "bg-card text-muted-foreground"
          }`}>
            <span className={`size-2.5 rounded-full border border-ink/40 ${
              status === "connected" ? "bg-green-700 animate-pulse" :
              status === "testing"   ? "bg-yellow-700 animate-spin" :
              status === "error"     ? "bg-red-700" : "bg-muted-foreground"
            }`} />
            <span className="text-xs sm:text-sm">
              {status === "connected" ? "Bot Terhubung" :
               status === "testing"   ? "Menguji Koneksi..." :
               status === "error"     ? "Koneksi Gagal" : "Belum Dikonfigurasi"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 2. Cockpit Quick Stats ─── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Status Bot */}
        <div className="rounded-2xl border-2 border-ink bg-card p-3.5 sm:p-4 shadow-brutal-xs hover:shadow-brutal-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Koneksi Bot</span>
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-sky shadow-[1px_1px_0px_#000]">
              <Key className="size-4 text-ink" />
            </div>
          </div>
          <div className="mt-2">
            <p className="truncate font-display text-base sm:text-lg font-bold text-foreground">
              {isConnected ? "Terverifikasi" : "Belum Aktif"}
            </p>
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground truncate">
            {isConnected ? "Token tersimpan aman" : "Perlu konfigurasi token"}
          </p>
        </div>

        {/* Jadwal Kirim */}
        <div className="rounded-2xl border-2 border-ink bg-card p-3.5 sm:p-4 shadow-brutal-xs hover:shadow-brutal-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Jadwal Kirim</span>
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-sun shadow-[1px_1px_0px_#000]">
              <Clock className="size-4 text-ink" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <p className="font-display text-base sm:text-lg font-bold text-foreground">
              {prefs.reportEnabled ? `${String(prefs.sendHour).padStart(2,"0")}:${String(prefs.sendMinute).padStart(2,"0")}` : "Nonaktif"}
            </p>
            {prefs.reportEnabled && <span className="text-xs font-bold text-muted-foreground">WIB</span>}
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground truncate">
            {prefs.reportEnabled ? (prefs.frequency === "weekly" ? "Mingguan" : "Setiap Hari") : "Laporan otomatis mati"}
          </p>
        </div>

        {/* Tipe Laporan */}
        <div className="rounded-2xl border-2 border-ink bg-card p-3.5 sm:p-4 shadow-brutal-xs hover:shadow-brutal-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Format Rekap</span>
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-lime shadow-[1px_1px_0px_#000]">
              <FileText className="size-4 text-ink" />
            </div>
          </div>
          <div className="mt-2">
            <p className="truncate font-display text-base sm:text-lg font-bold text-foreground">
              {prefs.reportType === "summary" ? "Ringkasan" : "Detail Lengkap"}
            </p>
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground truncate">
            {prefs.reportType === "summary" ? "Statistik & deadline" : "Seluruh task terurai"}
          </p>
        </div>

        {/* Tujuan Chat */}
        <div className="rounded-2xl border-2 border-ink bg-card p-3.5 sm:p-4 shadow-brutal-xs hover:shadow-brutal-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Target Chat ID</span>
            <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-coral shadow-[1px_1px_0px_#000]">
              <Smartphone className="size-4 text-ink" />
            </div>
          </div>
          <div className="mt-2">
            <p className="truncate font-display text-base sm:text-lg font-bold text-foreground">
              {chatId ? chatId : "—"}
            </p>
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground truncate">
            Akun Telegram pribadi
          </p>
        </div>
      </div>

      {/* ─── 3. Main Content: 2-Column Responsive Dashboard Layout ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* Left Column (lg:col-span-7): Credentials & Schedule Controls */}
        <div className="space-y-6 lg:col-span-7">

          {/* ═══ KARTU 1: KREDENSIAL BOT TELEGRAM ═══ */}
          <div className="rounded-2xl border-2 border-ink bg-card p-4 sm:p-6 shadow-brutal-sm">
            <div className="mb-4 flex items-center justify-between border-b-2 border-ink/15 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-sky shadow-[1px_1px_0px_#000]">
                  <Key className="size-4 text-ink" />
                </div>
                <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                  Kredensial Bot Telegram
                </h3>
              </div>
              {isConnected && !isEditing && (
                <span className="inline-flex items-center gap-1 rounded-full border border-ink/20 bg-lime/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-950">
                  <CheckCircle2 className="size-3.5 text-emerald-700" /> Terverifikasi
                </span>
              )}
            </div>

            {/* State A: Connected & Viewing Mode */}
            {isConnected && !isEditing ? (
              <div className="space-y-4">
                {/* 2 Mini Cards for Token and Chat ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Bot Token Card */}
                  <div className="rounded-xl border-2 border-ink bg-muted/30 p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <span>Bot Token</span>
                      <span className="rounded bg-lime/40 border border-ink/20 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-900">
                        Aktif
                      </span>
                    </div>
                    <p className="font-mono text-sm font-bold tracking-wider text-foreground">
                      {tokenMask || "••••••••••••••••"}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-semibold">Tersimpan aman &amp; terenkripsi</p>
                  </div>

                  {/* Chat ID Card */}
                  <div className="rounded-xl border-2 border-ink bg-muted/30 p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <span>Chat ID Telegram</span>
                      <span className="rounded bg-sky/40 border border-ink/20 px-1.5 py-0.2 text-[9px] font-extrabold text-sky-900">
                        Pribadi
                      </span>
                    </div>
                    <p className="font-mono text-sm font-bold tracking-wider text-foreground">
                      {chatId}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-semibold">Terhubung dengan akunmu</p>
                  </div>
                </div>

                {/* Action Button Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestMessage}
                    disabled={isSendingTest}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-lime px-4 py-2.5 text-xs sm:text-sm font-bold text-ink shadow-brutal-xs hover:-translate-y-0.5 hover:shadow-brutal-sm active:translate-y-0 transition-all disabled:opacity-50"
                  >
                    {isSendingTest ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    <span>Kirim Pesan Tes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setIsEditing(true); setToken(""); setChatId(""); }}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-card px-4 py-2.5 text-xs sm:text-sm font-bold text-foreground shadow-brutal-xs hover:bg-muted hover:-translate-y-0.5 transition-all"
                  >
                    <Pencil className="size-4" />
                    <span>Ubah Kredensial</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDisconnectDialog(true)}
                    disabled={isDeleting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-coral/20 hover:bg-coral/40 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-red-800 shadow-brutal-xs hover:-translate-y-0.5 transition-all"
                  >
                    <Trash2 className="size-4" />
                    <span>Putuskan Bot</span>
                  </button>
                </div>
              </div>
            ) : (
              /* State B: Unconfigured or Editing Mode Form */
              <div className="space-y-4">
                {/* Bot Token Field */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Bot Token
                    </label>
                    <a
                      href="https://t.me/BotFather"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      <span>Buka @BotFather</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      className={inputClass() + " pr-10"}
                      placeholder="Contoh: 123456789:AAFxxxxxxxxx..."
                      value={token}
                      onChange={e => setToken(e.target.value)}
                      disabled={status === "testing"}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showToken ? "Sembunyikan" : "Tampilkan"}
                    >
                      {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground font-semibold">
                    Dapatkan token dari @BotFather setelah menjalankan perintah /newbot di Telegram.
                  </p>
                </div>

                {/* Chat ID Field */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Chat ID Telegram Pribadi
                    </label>
                    <a
                      href="https://t.me/userinfobot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      <span>Cek di @userinfobot</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={inputClass()}
                    placeholder="Contoh: 123456789 (Hanya angka)"
                    value={chatId}
                    onChange={e => setChatId(e.target.value.replace(/\D/g, ""))}
                    disabled={status === "testing"}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground font-semibold">
                    Chat ID akun Telegrammu (bisa didapatkan gratis via bot @userinfobot).
                  </p>
                </div>

                {/* Error message */}
                {status === "error" && errorMsg && (
                  <div className="flex items-start gap-2.5 rounded-xl border-2 border-ink bg-coral/30 p-3 text-xs font-bold text-red-950">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <p>{errorMsg}</p>
                  </div>
                )}

                {/* Submit & Cancel Buttons */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveAndTest}
                    disabled={status === "testing"}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-sun hover:bg-sun/90 px-5 py-3 text-sm font-bold text-ink shadow-brutal-xs hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                  >
                    {status === "testing" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Memverifikasi Koneksi...</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        <span>Simpan &amp; Verifikasi Bot</span>
                      </>
                    )}
                  </button>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setToken("");
                        api.getTelegramConfig().then(r => {
                          if (r.success && r.data?.chat_id_mask) setChatId(r.data.chat_id_mask);
                          if (r.success && r.data?.token_mask)   setTokenMask(r.data.token_mask);
                        });
                      }}
                      className="rounded-xl border-2 border-ink bg-card px-4 py-3 text-sm font-bold text-foreground shadow-brutal-xs hover:bg-muted transition-all"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ═══ KARTU 2: JADWAL & PREFERENSI LAPORAN ═══ */}
          <div className="rounded-2xl border-2 border-ink bg-card p-4 sm:p-6 shadow-brutal-sm">
            <div className="mb-4 flex items-center justify-between border-b-2 border-ink/15 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-sun shadow-[1px_1px_0px_#000]">
                  <Calendar className="size-4 text-ink" />
                </div>
                <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                  Jadwal &amp; Preferensi Laporan
                </h3>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full border border-ink/20 px-2.5 py-0.5 text-[11px] font-bold ${
                prefs.reportEnabled ? "bg-lime text-ink" : "bg-muted text-muted-foreground"
              }`}>
                {prefs.reportEnabled ? "Otomatis Aktif" : "Nonaktif"}
              </span>
            </div>

            {/* Master Toggle Banner */}
            <div className={`flex items-center justify-between gap-4 rounded-xl border-2 border-ink p-4 transition-colors ${
              prefs.reportEnabled ? "bg-lime/20" : "bg-muted/40"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink shadow-brutal-xs ${
                  prefs.reportEnabled ? "bg-lime text-ink" : "bg-card text-muted-foreground"
                }`}>
                  {prefs.reportEnabled ? <Bell className="size-5" /> : <BellOff className="size-5" />}
                </div>
                <div>
                  <p className="font-display text-sm sm:text-base font-bold text-foreground">
                    Kirim Laporan Otomatis
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {prefs.reportEnabled
                      ? `Bot mengirim rekap setiap ${prefs.frequency === "weekly" ? "minggu" : "hari"} pukul ${String(prefs.sendHour).padStart(2,"0")}:${String(prefs.sendMinute).padStart(2,"0")} WIB`
                      : "Aktifkan sakelar untuk menjadwalkan pengiriman laporan."}
                  </p>
                </div>
              </div>

              <Toggle
                enabled={prefs.reportEnabled}
                onToggle={handleToggleReport}
                disabled={!isConnected}
              />
            </div>

            {/* Options Body when Report Enabled */}
            {prefs.reportEnabled && (
              <div className="mt-5 space-y-4 pt-2">

                {/* 1. Frekuensi Pengiriman */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Frekuensi Pengiriman
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updatePref("frequency", "daily")}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-ink p-3 text-center transition-all shadow-brutal-xs ${
                        prefs.frequency === "daily"
                          ? "bg-sun text-ink shadow-brutal-sm font-bold"
                          : "bg-background text-muted-foreground hover:bg-muted font-semibold"
                      }`}
                    >
                      <Clock className="size-5" />
                      <span className="text-sm font-bold">Harian (Daily)</span>
                      <span className="text-[11px] opacity-80">Kirim setiap hari</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updatePref("frequency", "weekly")}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-ink p-3 text-center transition-all shadow-brutal-xs ${
                        prefs.frequency === "weekly"
                          ? "bg-sky text-ink shadow-brutal-sm font-bold"
                          : "bg-background text-muted-foreground hover:bg-muted font-semibold"
                      }`}
                    >
                      <Calendar className="size-5" />
                      <span className="text-sm font-bold">Mingguan (Weekly)</span>
                      <span className="text-[11px] opacity-80">1x dalam seminggu</span>
                    </button>
                  </div>
                </div>

                {/* 2. Waktu Kirim (Jam & Menit) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border-2 border-ink bg-background p-3 shadow-brutal-xs">
                    <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Clock className="size-3.5" /> Waktu Kirim (WIB)
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        className={selectClass}
                        value={prefs.sendHour}
                        onChange={e => updatePref("sendHour", Number(e.target.value))}
                      >
                        {HOURS.map(h => (
                          <option key={h.value} value={h.value}>{h.label} Jam</option>
                        ))}
                      </select>
                      <span className="font-mono text-xl font-black text-foreground">:</span>
                      <select
                        className={selectClass}
                        value={prefs.sendMinute}
                        onChange={e => updatePref("sendMinute", Number(e.target.value))}
                      >
                        {MINUTES.map(m => (
                          <option key={m.value} value={m.value}>{m.label} Menit</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 3. Hari Kirim (hanya tampil jika Mingguan) */}
                  {prefs.frequency === "weekly" ? (
                    <div className="rounded-xl border-2 border-ink bg-background p-3 shadow-brutal-xs">
                      <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Calendar className="size-3.5" /> Hari Kirim
                      </label>
                      <select
                        className={selectClass}
                        value={prefs.sendDay}
                        onChange={e => updatePref("sendDay", Number(e.target.value))}
                      >
                        {DAYS.map(d => (
                          <option key={d.value} value={d.value}>Setiap hari {d.label}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-ink bg-muted/20 p-3 flex flex-col justify-center">
                      <p className="text-xs font-bold text-foreground">Pengiriman Rutin</p>
                      <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                        Laporan otomatis dikirim setiap hari pada pukul {String(prefs.sendHour).padStart(2,"0")}:{String(prefs.sendMinute).padStart(2,"0")} WIB.
                      </p>
                    </div>
                  )}
                </div>

                {/* 4. Format Laporan (Ringkasan vs Detail) */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Format Konten Laporan
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updatePref("reportType", "summary")}
                      className={`flex items-start gap-3 rounded-xl border-2 border-ink p-3 text-left transition-all shadow-brutal-xs ${
                        prefs.reportType === "summary"
                          ? "bg-lilac text-ink shadow-brutal-sm font-bold"
                          : "bg-background text-foreground hover:bg-muted font-semibold"
                      }`}
                    >
                      <div className="grid size-8 shrink-0 place-items-center rounded-lg border-2 border-ink bg-card">
                        <ClipboardList className="size-4 text-ink" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Ringkasan (Summary)</p>
                        <p className="text-[11px] font-normal opacity-80 mt-0.5 leading-snug">
                          Statistik status, jumlah task aktif, prioritas tinggi, dan tenggat terdekat.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updatePref("reportType", "detailed")}
                      className={`flex items-start gap-3 rounded-xl border-2 border-ink p-3 text-left transition-all shadow-brutal-xs ${
                        prefs.reportType === "detailed"
                          ? "bg-lime text-ink shadow-brutal-sm font-bold"
                          : "bg-background text-foreground hover:bg-muted font-semibold"
                      }`}
                    >
                      <div className="grid size-8 shrink-0 place-items-center rounded-lg border-2 border-ink bg-card">
                        <FileText className="size-4 text-ink" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Detail Lengkap</p>
                        <p className="text-[11px] font-normal opacity-80 mt-0.5 leading-snug">
                          Daftar semua judul tugas terperinci berdasarkan kelompok status.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Dirty Notice */}
                {isDirty && (
                  <div className="flex items-center gap-2 rounded-xl border-2 border-ink bg-sun/40 p-3 text-xs font-bold text-ink shadow-brutal-xs">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>Ada perubahan jadwal yang belum disimpan.</span>
                  </div>
                )}

                {/* Save Schedule Button */}
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  disabled={isSavingSchedule}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink px-5 py-3 text-sm font-bold shadow-brutal-xs hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 ${
                    isSavedRecently
                      ? "bg-green-600 text-white"
                      : isDirty
                      ? "bg-sun text-ink"
                      : "bg-ink text-background hover:bg-ink/90"
                  }`}
                >
                  {isSavingSchedule ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Menyimpan Pengaturan...</span>
                    </>
                  ) : isSavedRecently ? (
                    <>
                      <CheckCircle2 className="size-4" />
                      <span>Jadwal Berhasil Disimpan!</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      <span>{isDirty ? "Simpan Perubahan Jadwal" : "Jadwal Sudah Tersimpan"}</span>
                    </>
                  )}
                </button>

              </div>
            )}
          </div>

        </div>

        {/* Right Column (lg:col-span-5): Telegram Simulator & Quick Tutorial */}
        <div className="space-y-6 lg:col-span-5">

          {/* ═══ KARTU 3: SIMULATOR PESAN TELEGRAM ═══ */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <span>Pratinjau Pesan di Telegram</span>
              </h3>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                1:1 Format
              </span>
            </div>
            <TelegramChatSimulator
              reportType={prefs.reportType}
              sendHour={prefs.sendHour}
              sendMinute={prefs.sendMinute}
              frequency={prefs.frequency}
              onReportTypeChange={type => updatePref("reportType", type)}
            />
          </div>

          {/* ═══ KARTU 4: PANDUAN CEPAT (SETUP TUTORIAL) ═══ */}
          <div className="rounded-2xl border-2 border-ink bg-card p-4 sm:p-5 shadow-brutal-sm space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-ink/15 pb-2.5">
              <div className="grid size-7 place-items-center rounded-lg border-2 border-ink bg-sun shadow-[1px_1px_0px_#000]">
                <HelpCircle className="size-3.5 text-ink" />
              </div>
              <h4 className="font-display text-sm font-bold text-foreground">
                Panduan Cepat Koneksi
              </h4>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 rounded-xl border border-ink/20 bg-muted/30 p-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-ink text-[10px] font-bold text-card">
                  1
                </span>
                <div className="text-xs leading-relaxed">
                  <p className="font-bold text-foreground">Buat Bot Telegram</p>
                  <p className="text-muted-foreground text-[11px]">
                    Buka Telegram, cari <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 underline">@BotFather</a>, ketik <b>/newbot</b> dan ikuti petunjuknya.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-ink/20 bg-muted/30 p-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-ink text-[10px] font-bold text-card">
                  2
                </span>
                <div className="text-xs leading-relaxed">
                  <p className="font-bold text-foreground">Salin API Token</p>
                  <p className="text-muted-foreground text-[11px]">
                    BotFather akan memberikan Bot Token (contoh: <code>123456:ABC-DEF...</code>). Tempelkan ke kolom Bot Token di atas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-ink/20 bg-muted/30 p-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-ink text-[10px] font-bold text-card">
                  3
                </span>
                <div className="text-xs leading-relaxed">
                  <p className="font-bold text-foreground">Ketahui Chat ID Akunmu</p>
                  <p className="text-muted-foreground text-[11px]">
                    Kirim pesan ke <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 underline">@userinfobot</a> di Telegram untuk melihat Chat ID angka milikmu.
                  </p>
                </div>
              </div>
            </div>

            {/* Keamanan Badge */}
            <div className="flex items-center gap-2 rounded-xl border border-ink/20 bg-lime/20 p-2.5 text-xs font-semibold text-emerald-950">
              <ShieldCheck className="size-4 shrink-0 text-emerald-700" />
              <span className="text-[11px]">Token disimpan aman menggunakan enkripsi standar industri.</span>
            </div>
          </div>

        </div>

      </div>

      {/* ─── Confirm Disconnect Dialog ─── */}
      {showDisconnectDialog && (
        <ConfirmDialog
          title="Putuskan Koneksi Bot?"
          message="Bot Telegram akan dilepas dan jadwal pengiriman laporan otomatis akan dinonaktifkan. Kamu bisa menghubungkannya kembali kapan saja."
          confirmLabel="Ya, Putuskan"
          variant="destructive"
          onConfirm={handleDisconnect}
          onCancel={() => setShowDisconnectDialog(false)}
        />
      )}

    </section>
  );
}
