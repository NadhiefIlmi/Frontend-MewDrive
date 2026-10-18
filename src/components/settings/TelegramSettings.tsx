/**
 * TelegramSettings — Collapsible, colored headers, fully responsive
 */

import { useState, useEffect } from "react";
import {
  Bot, Eye, EyeOff, CheckCircle2, XCircle, Loader2, Send, Trash2,
  Clock, Bell, BellOff, Info, Lock, Pencil, Key, Calendar,
  ChevronDown, AlertCircle, Smartphone, ClipboardList, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

const HOURS   = Array.from({ length: 24 }, (_, i) => ({ value: i, label: String(i).padStart(2, "0") }));
const MINUTES = Array.from({ length: 60 }, (_, i) => ({ value: i, label: String(i).padStart(2, "0") }));
const DAYS = [
  { value: 1, label: "Senin" }, { value: 2, label: "Selasa" }, { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" }, { value: 5, label: "Jumat" }, { value: 6, label: "Sabtu" }, { value: 7, label: "Minggu" },
];

/* ─── Toggle ─────────────────────────────────────────────────────────────── */
function Toggle({ enabled, onToggle, disabled }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={enabled} disabled={disabled} onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-ink shadow-brutal-sm transition-colors focus-visible:outline-none ${
        enabled ? "bg-lime" : "bg-muted"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <span className={`inline-block size-4 rounded-full bg-ink shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-1"}`} />
    </button>
  );
}

/* ─── CollapsibleSection ─────────────────────────────────────────────────── */
function CollapsibleSection({ title, icon, defaultOpen = false, headerBg = "bg-background", children }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; headerBg?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-ui border-2 border-ink shadow-brutal-sm overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:brightness-95 ${headerBg}`}
      >
        <div className="flex items-center gap-3">{icon}<p className="text-sm font-bold uppercase tracking-wider">{title}</p></div>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t-2 border-ink bg-background p-4 space-y-4">{children}</div>}
    </div>
  );
}

/* ─── ReportPreviewBox ───────────────────────────────────────────────────── */
function ReportPreviewBox({ reportType, onChangeType }: { reportType: ReportType; onChangeType?: (t: ReportType) => void }) {
  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="grid grid-cols-2 gap-3">
        {(["summary", "detailed"] as const).map(type => (
          <button key={type} type="button" onClick={() => onChangeType?.(type)}
            className={`flex items-center justify-center gap-2 rounded-ui border-2 border-ink px-3 py-3 text-sm font-bold transition-all shadow-brutal-sm ${
              reportType === type
                ? (type === "summary" ? "bg-lilac" : "bg-lime")
                : "bg-background hover:bg-muted/30"
            }`}
          >
            {type === "summary" ? <ClipboardList className="size-5 shrink-0" /> : <FileText className="size-5 shrink-0" />}
            <div className="text-left min-w-0">
              <p className="leading-tight truncate">{type === "summary" ? "Ringkasan" : "Detail"}</p>
              <p className="text-[10px] font-normal opacity-70 truncate">{type === "summary" ? "Statistik + Priority" : "Semua Task"}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Preview bubble */}
      <div className="rounded-lg border-2 border-ink/20 bg-muted/50 p-3 shadow-inner space-y-3">
        <div className="flex items-center justify-between border-b border-ink/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold">MewDrive Bot</span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">08:30 WIB</span>
        </div>

        {reportType === "summary" ? (
          <div className="space-y-2 font-mono text-[10.5px] leading-relaxed">
            <div>
              <p className="font-bold">📋 Daily Task Report (Ringkasan)</p>
              <p className="text-[9.5px] text-muted-foreground">Jumat, 16 Oktober 2026</p>
            </div>
            <div className="rounded-md border border-ink/10 bg-background/80 p-2 space-y-0.5">
              <p className="font-bold text-[10px]">📊 Ringkasan Status</p>
              <p>📝 To Do: 3 &nbsp;🔄 In Progress: 2</p>
              <p>👀 In Review: 1 &nbsp;✅ Done: 3</p>
              <p className="pt-1 border-t border-dashed border-ink/20 font-bold">Total: 9 task</p>
            </div>
            <div className="rounded-md border border-amber-200/80 bg-amber-50/80 p-2 space-y-0.5">
              <p className="font-bold text-[10px] text-amber-900">🔥 High/Critical</p>
              <p className="text-amber-900">• Implementasi API Login</p>
              <p className="text-amber-900">• Perbaikan validasi form</p>
            </div>
            <p className="text-[9.5px] italic text-muted-foreground border-t border-ink/10 pt-1.5">🔗 Buka MewDrive untuk detail</p>
          </div>
        ) : (
          <div className="space-y-2 font-mono text-[10.5px] leading-relaxed">
            <div>
              <p className="font-bold">📄 Daily Task Report (Detail)</p>
              <p className="text-[9.5px] text-muted-foreground">Jumat, 16 Oktober 2026</p>
            </div>
            <div className="space-y-1.5">
              {([
                { emoji: "📝", label: "TO DO (3)", color: "border-amber-200/80 bg-amber-50/80 text-amber-900", items: [
                  { title: "Desain halaman Dashboard", badge: "High" as const, badgeColor: "bg-amber-200 text-amber-900" },
                  { title: "Tambah validasi form",      badge: "Med"  as const, badgeColor: "bg-blue-100 text-blue-900" },
                ]},
                { emoji: "🔄", label: "IN PROGRESS (2)", color: "border-blue-200/80 bg-blue-50/80 text-blue-900", items: [
                  { title: "Implementasi API Login",  badge: "Critical" as const, badgeColor: "bg-red-200 text-red-900" },
                  { title: "Integrasi Telegram Bot",  badge: "High"     as const, badgeColor: "bg-amber-200 text-amber-900" },
                ]},
                { emoji: "✅", label: "DONE (3)", color: "border-green-200/80 bg-green-50/80 text-green-900", items: [
                  { title: "Setup database migration",  badge: undefined, badgeColor: undefined },
                  { title: "Integrasi Google Drive API", badge: undefined, badgeColor: undefined },
                ]},
              ] as const).map(group => (
                <div key={group.label} className={`rounded-md border p-2 ${group.color}`}>
                  <p className="font-bold text-[10px] mb-1">{group.emoji} {group.label}</p>
                  {group.items.map((item, i) => (
                    <p key={i}>• {item.title}{item.badge && <span className={`ml-1 rounded px-1 py-0.5 text-[8px] font-bold ${item.badgeColor}`}>[{item.badge}]</span>}</p>
                  ))}
                </div>
              ))}
            </div>
            <p className="text-[9.5px] italic text-muted-foreground border-t border-ink/10 pt-1.5">🔗 Buka MewDrive untuk detail</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
interface TelegramSettingsProps {
  onFlash: (msg: string, type?: "success" | "error" | "info") => void;
}

export function TelegramSettings({ onFlash }: TelegramSettingsProps) {
  const [token,         setToken]         = useState("");
  const [tokenMask,     setTokenMask]     = useState("");
  const [chatId,        setChatId]        = useState("");
  const [showToken,     setShowToken]     = useState(false);
  const [status,        setStatus]        = useState<ConnectionStatus>("unconfigured");
  const [errorMsg,      setErrorMsg]      = useState("");
  const [isEditing,     setIsEditing]     = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isDeleting,    setIsDeleting]    = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isSavedRecently,  setIsSavedRecently]  = useState(false);
  const [savedPrefs, setSavedPrefs] = useState<TelegramPrefs | null>(null);
  const [prefs, setPrefs] = useState<TelegramPrefs>({
    reportEnabled: false, frequency: "daily", sendHour: 8, sendMinute: 0, sendDay: 1, reportType: "summary",
  });

  const isConnected = status === "connected";

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cfgRes, prefsRes] = await Promise.all([api.getTelegramConfig(), api.getNotificationPreferences()]);
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
          setPrefs(p); setSavedPrefs(p);
        }
      } catch (err) { console.error(err); }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSaveAndTest = async () => {
    if (!token.trim()) { onFlash("Masukkan Bot Token.", "error"); return; }
    if (!chatId.trim() || !/^\d+$/.test(chatId.trim())) { onFlash("Masukkan Chat ID berupa angka.", "error"); return; }
    setStatus("testing"); setErrorMsg("");
    try {
      const res = await api.saveTelegramConfig({ bot_token: token.trim(), chat_id: Number(chatId.trim()) });
      if (res.success && res.data?.is_verified) {
        setStatus("connected"); setToken("");
        if (res.data.token_mask)   setTokenMask(res.data.token_mask);
        if (res.data.chat_id_mask) setChatId(res.data.chat_id_mask);
        setIsEditing(false);
        onFlash("Bot Telegram berhasil terhubung!", "success");
      } else {
        const msg = res.error?.message || "Gagal terhubung.";
        setStatus("error"); setErrorMsg(msg); onFlash(msg, "error");
      }
    } catch (err: any) {
      const msg = err.message || "Gagal terhubung ke Telegram.";
      setStatus("error"); setErrorMsg(msg); onFlash(msg, "error");
    }
  };

  const handleTestMessage = async () => {
    if (!isConnected || isSendingTest) return;
    setIsSendingTest(true); onFlash("Mengirim pesan tes…", "info");
    try {
      const res = await api.testTelegramConfig();
      onFlash(res.success ? "Pesan tes berhasil dikirim!" : res.error?.message || "Gagal.", res.success ? "success" : "error");
    } catch (err: any) { onFlash(err.message || "Gagal mengirim.", "error"); }
    finally { setIsSendingTest(false); }
  };

  const handleDisconnect = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteTelegramConfig();
      if (res.success) {
        setStatus("unconfigured"); setToken(""); setTokenMask(""); setChatId(""); setIsEditing(false);
        setPrefs(p => ({ ...p, reportEnabled: false }));
        onFlash("Konfigurasi Telegram dihapus.");
      } else onFlash(res.error?.message || "Gagal.", "error");
    } catch (err: any) { onFlash(err.message || "Gagal.", "error"); }
    finally { setIsDeleting(false); }
  };

  const updatePref = <K extends keyof TelegramPrefs>(key: K, val: TelegramPrefs[K]) =>
    setPrefs(p => ({ ...p, [key]: val }));

  const handleToggleReport = async () => {
    const next = !prefs.reportEnabled;
    updatePref("reportEnabled", next);
    try {
      await api.updateNotificationPreferences({ report_enabled: next });
      setSavedPrefs(p => p ? { ...p, reportEnabled: next } : null);
      onFlash(next ? "Laporan otomatis diaktifkan." : "Laporan otomatis dinonaktifkan.", "info");
    } catch (err) { console.error(err); }
  };

  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      const res = await api.updateNotificationPreferences({
        report_enabled: prefs.reportEnabled, frequency: prefs.frequency,
        send_hour: prefs.sendHour, send_minute: prefs.sendMinute,
        send_day: prefs.sendDay, report_type: prefs.reportType,
      });
      if (res.success) {
        setSavedPrefs({ ...prefs }); setIsSavedRecently(true);
        setTimeout(() => setIsSavedRecently(false), 3500);
        onFlash("Jadwal laporan berhasil disimpan.", "success");
      } else onFlash(res.error?.message || "Gagal.", "error");
    } catch (err: any) { onFlash(err.message || "Gagal.", "error"); }
    finally { setIsSavingSchedule(false); }
  };

  const isDirty = Boolean(savedPrefs && (
    prefs.reportEnabled !== savedPrefs.reportEnabled ||
    prefs.frequency     !== savedPrefs.frequency     ||
    prefs.sendHour      !== savedPrefs.sendHour      ||
    prefs.sendMinute    !== savedPrefs.sendMinute     ||
    (prefs.frequency === "weekly" && prefs.sendDay !== savedPrefs.sendDay) ||
    prefs.reportType    !== savedPrefs.reportType
  ));

  const inputCls = (ro?: boolean) =>
    `w-full rounded-ui border-2 border-ink px-3 py-2.5 text-sm font-mono outline-none transition-colors focus:ring-2 focus:ring-ink/20 ${
      ro ? "bg-muted/40 text-foreground cursor-default" : "bg-background text-foreground"
    }`;
  const selectCls = "w-full rounded-ui border-2 border-ink bg-background px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-ink/20";

  /* ── STATUS LABEL ── */
  const statusLabel = status === "connected" ? "Terhubung" : status === "testing" ? "Menguji..." : status === "error" ? "Gagal" : "Belum dikonfigurasi";
  const statusColor = status === "connected" ? "text-green-700" : status === "error" ? "text-red-600" : "text-muted-foreground";
  const dotColor    = status === "connected" ? "bg-green-500" : status === "testing" ? "bg-yellow-400" : status === "error" ? "bg-red-500" : "bg-muted-foreground/40";

  return (
    <section className="mt-6 space-y-3 sm:mt-8">

      {/* ══ HEADER ══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-ui border-2 border-ink bg-lilac p-4 shadow-brutal sm:p-5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="grid size-10 shrink-0 place-items-center rounded-ui border-2 border-ink bg-card shadow-brutal-sm sm:size-11">
            <Bot className="size-5 sm:size-6" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold sm:text-lg truncate">Telegram Report</h3>
            <p className="text-xs font-medium text-muted-foreground truncate">Kirim laporan task ke bot Telegram pribadimu.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`size-2.5 rounded-full border border-ink/20 ${dotColor}`} />
          {status === "connected" && <CheckCircle2 className="size-4 text-green-600" />}
          {status === "testing"   && <Loader2 className="size-4 animate-spin text-yellow-600" />}
          {status === "error"     && <XCircle className="size-4 text-red-600" />}
          <span className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</span>
        </div>
      </div>

      {/* ══ 1. KREDENSIAL BOT ════════════════════════════════════════════════════════ */}
      <CollapsibleSection title="Kredensial Bot" icon={<Key className="size-5" />} headerBg="bg-sky" defaultOpen={!isConnected || isEditing}>

        {/* Connected state — action bar */}
        {isConnected && !isEditing && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-ui border-2 border-ink bg-green-50 px-4 py-3 shadow-brutal-sm">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="size-4 text-green-600 shrink-0" />
              <p className="text-sm font-semibold text-green-800 truncate">Bot terhubung &amp; terverifikasi</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" onClick={handleTestMessage} disabled={isSendingTest}
                className="gap-1.5 bg-ink text-background shadow-brutal-sm hover:bg-ink/90 disabled:opacity-50">
                {isSendingTest ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                <span>Tes</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setIsEditing(true); setToken(""); setChatId(""); }}
                className="gap-1.5 shadow-brutal-sm">
                <Pencil className="size-3" /><span>Edit</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={isDeleting}
                className="gap-1.5 border-red-300 text-red-600 shadow-brutal-sm hover:bg-red-50">
                {isDeleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                <span className="hidden xs:inline">Hapus</span>
              </Button>
            </div>
          </div>
        )}

        {/* Bot Token */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bot Token</label>
            {isConnected && !isEditing && (
              <span className="flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800 shrink-0">
                <CheckCircle2 className="size-3" /> Tersimpan
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              className={inputCls(isConnected && !isEditing) + " pr-10"}
              placeholder={isConnected && !isEditing ? "••••••••••••••••" : "123456789:AAFxxxxxxxxx..."}
              value={isConnected && !isEditing ? tokenMask : token}
              onChange={e => { if (!isConnected || isEditing) setToken(e.target.value); }}
              readOnly={isConnected && !isEditing} disabled={status === "testing"} autoComplete="off"
            />
            <button type="button" onClick={() => setShowToken(p => !p)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showToken ? "Sembunyikan" : "Tampilkan"}>
              {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Chat ID */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chat ID</label>
            {isConnected && !isEditing && (
              <span className="flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800 shrink-0">
                <CheckCircle2 className="size-3" /> Terverifikasi
              </span>
            )}
          </div>
          <input type="text" inputMode="numeric" className={inputCls(isConnected && !isEditing)}
            placeholder="123456789"
            value={chatId}
            onChange={e => { if (!isConnected || isEditing) setChatId(e.target.value.replace(/\D/g, "")); }}
            readOnly={isConnected && !isEditing} disabled={status === "testing"}
          />
          {isConnected && !isEditing && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <CheckCircle2 className="size-3 text-green-600 shrink-0" /> Terhubung dengan akun Telegram pribadimu.
            </p>
          )}
        </div>

        {/* Error */}
        {status === "error" && errorMsg && (
          <div className="flex items-start gap-2.5 rounded-ui border-2 border-red-300 bg-red-50 p-3 text-sm text-red-700">
            <XCircle className="size-4 mt-0.5 shrink-0" />
            <div><p className="font-bold">Koneksi gagal</p><p className="mt-0.5 text-xs leading-relaxed">{errorMsg}</p></div>
          </div>
        )}

        {/* Simpan / Batal */}
        {(!isConnected || isEditing) && (
          <div className="flex gap-2">
            <Button onClick={handleSaveAndTest} disabled={status === "testing"}
              className="flex-1 gap-2 bg-ink text-background shadow-brutal-sm hover:bg-ink/90 disabled:opacity-50">
              {status === "testing" ? <><Loader2 className="size-4 animate-spin" /> Menguji...</> : <><Send className="size-4" /> Simpan &amp; Tes</>}
            </Button>
            {isEditing && (
              <Button variant="outline" className="shadow-brutal-sm" onClick={() => {
                setIsEditing(false); setToken("");
                api.getTelegramConfig().then(r => {
                  if (r.success && r.data?.chat_id_mask) setChatId(r.data.chat_id_mask);
                  if (r.success && r.data?.token_mask)   setTokenMask(r.data.token_mask);
                });
              }}>Batal</Button>
            )}
          </div>
        )}
      </CollapsibleSection>

      {/* ══ 2. JADWAL LAPORAN ════════════════════════════════════════════════════════ */}
      <CollapsibleSection title="Jadwal Laporan" icon={<Calendar className="size-5" />} headerBg="bg-mint" defaultOpen={isConnected}>
        <div className={`space-y-4 ${!isConnected ? "opacity-50 pointer-events-none" : ""}`}>

          {/* Toggle */}
          <div className={`flex items-center justify-between gap-3 rounded-ui border-2 border-ink px-4 py-4 shadow-brutal-sm transition-colors ${prefs.reportEnabled ? "bg-lime/30" : "bg-muted/40"}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`grid size-9 shrink-0 place-items-center rounded-ui border-2 border-ink shadow-brutal-sm ${prefs.reportEnabled ? "bg-lime" : "bg-muted"}`}>
                {prefs.reportEnabled ? <Bell className="size-5" /> : <BellOff className="size-5 text-muted-foreground" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold">Aktifkan Otomatis</p>
                <p className="text-xs text-muted-foreground truncate">
                  {prefs.reportEnabled
                    ? `Aktif · ${String(prefs.sendHour).padStart(2,"0")}:${String(prefs.sendMinute).padStart(2,"0")} WIB`
                    : "Laporan tidak dikirim otomatis"}
                </p>
              </div>
            </div>
            <Toggle enabled={prefs.reportEnabled} onToggle={handleToggleReport} disabled={!isConnected} />
          </div>

          {prefs.reportEnabled && (
            <div className="space-y-3">

              {/* Frekuensi + Waktu */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-ui border-2 border-ink bg-background p-3 shadow-brutal-sm">
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Calendar className="size-3.5" /> Frekuensi
                  </label>
                  <select className={selectCls} value={prefs.frequency} onChange={e => updatePref("frequency", e.target.value as Frequency)}>
                    <option value="daily">Harian</option>
                    <option value="weekly">Mingguan</option>
                  </select>
                </div>
                <div className="rounded-ui border-2 border-ink bg-background p-3 shadow-brutal-sm">
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Clock className="size-3.5" /> Waktu Kirim
                  </label>
                  <div className="flex items-center gap-2">
                    <select className={selectCls} value={prefs.sendHour} onChange={e => updatePref("sendHour", Number(e.target.value))}>
                      {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                    <span className="shrink-0 text-xl font-black">:</span>
                    <select className={selectCls} value={prefs.sendMinute} onChange={e => updatePref("sendMinute", Number(e.target.value))}>
                      {MINUTES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Hari Kirim */}
              {prefs.frequency === "weekly" && (
                <div className="rounded-ui border-2 border-ink bg-background p-3 shadow-brutal-sm">
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Calendar className="size-3.5" /> Hari Kirim
                  </label>
                  <select className={selectCls} value={prefs.sendDay} onChange={e => updatePref("sendDay", Number(e.target.value))}>
                    {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              )}

              {/* Jenis Laporan */}
              <div className="rounded-ui border-2 border-ink bg-background p-3 shadow-brutal-sm">
                <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <FileText className="size-3.5" /> Jenis Laporan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["summary", "detailed"] as const).map(type => (
                    <button key={type} type="button" onClick={() => updatePref("reportType", type)}
                      className={`flex items-center gap-2 rounded-ui border-2 border-ink px-3 py-2 text-xs font-bold transition-all shadow-brutal-sm ${
                        prefs.reportType === type ? (type === "summary" ? "bg-lilac" : "bg-lime") : "bg-muted/40 hover:bg-muted/70"
                      }`}
                    >
                      {type === "summary" ? <ClipboardList className="size-4 shrink-0" /> : <FileText className="size-4 shrink-0" />}
                      <div className="text-left min-w-0">
                        <p className="truncate">{type === "summary" ? "Ringkasan" : "Detail"}</p>
                        <p className="text-[9px] font-normal opacity-70 truncate">{type === "summary" ? "Statistik + Priority" : "Semua Task"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {isDirty && (
                <div className="flex items-center gap-2.5 rounded-ui border-2 border-sun bg-sun/30 px-3 py-2.5 text-xs font-medium text-ink">
                  <AlertCircle className="size-4 shrink-0" /><span>Ada perubahan yang belum disimpan.</span>
                </div>
              )}

              <Button onClick={handleSaveSchedule} disabled={isSavingSchedule}
                className={`w-full gap-2 font-bold transition-all shadow-brutal-sm disabled:opacity-50 ${
                  isSavedRecently ? "bg-green-600 text-white hover:bg-green-700"
                    : isDirty ? "bg-ink text-lime hover:bg-ink/90"
                    : "bg-ink text-background hover:bg-ink/90"
                }`}
              >
                {isSavingSchedule ? <><Loader2 className="size-4 animate-spin" /> Menyimpan...</>
                  : isSavedRecently ? <><CheckCircle2 className="size-4" /> Tersimpan!</>
                  : isDirty ? <><Send className="size-4" /> Simpan Jadwal</>
                  : <><CheckCircle2 className="size-4 text-lime" /> Jadwal Tersimpan</>}
              </Button>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* ══ 3. INFORMASI & TUTORIAL ══════════════════════════════════════════════════ */}
      <CollapsibleSection title="Informasi & Tutorial" icon={<Info className="size-5" />} headerBg="bg-sun" defaultOpen={false}>
        <div className="space-y-4">

          {/* Cara Kerjanya — grid 2×2 */}
          <div className="rounded-ui border-2 border-ink bg-sun/20 p-4 shadow-brutal-sm">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold">
              <span className="grid size-7 place-items-center rounded-ui border-2 border-ink bg-sun shadow-brutal-sm"><Clock className="size-4" /></span>
              Cara Kerjanya
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { n: "1", t: "Buat bot via @BotFather" },
                { n: "2", t: "Token & Chat ID disimpan aman" },
                { n: "3", t: "Laporan dikirim ke chat kamu" },
                { n: "4", t: "Hanya kamu yang bisa terima" },
              ].map(({ n, t }) => (
                <div key={n} className="flex items-start gap-2.5 rounded-lg border-2 border-ink/20 bg-background p-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-background">{n}</span>
                  <span className="text-[11px] leading-snug">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tutorial: Token & Chat ID — timeline */}
          <div className="rounded-ui border-2 border-ink bg-sky/20 p-4 shadow-brutal-sm">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold">
              <span className="grid size-7 place-items-center rounded-ui border-2 border-ink bg-sky shadow-brutal-sm"><Smartphone className="size-4" /></span>
              Cara Dapat Token & Chat ID
            </p>
            <div className="space-y-3">
              {[
                {
                  n: "1", bg: "bg-lilac", title: "Buat Bot di @BotFather",
                  body: <>Buka Telegram → cari <b>@BotFather</b> → kirim <b>/newbot</b> → ikuti instruksinya</>,
                },
                {
                  n: "2", bg: "bg-mint", title: "Salin Bot Token",
                  body: <>BotFather kirim token berformat <b>123456789:AAFxxx...</b> — <span className="text-red-600 font-medium">jangan bagikan ke siapapun!</span></>,
                },
                {
                  n: "3", bg: "bg-sky", title: "Dapat Chat ID via @userinfobot",
                  body: <>Cari <b>@userinfobot</b> di Telegram → kirim pesan apapun → bot balas dengan <b>Id:</b> — itulah Chat ID kamu</>,
                },
              ].map(({ n, bg, title, body }, i, arr) => (
                <div key={n} className="flex gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-ink ${bg} text-xs font-bold`}>{n}</span>
                    {i < arr.length - 1 && <div className="w-px flex-1 bg-ink/20" />}
                  </div>
                  <div className="pb-1 min-w-0">
                    <p className="text-xs font-bold mb-1">{title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keamanan */}
          <div className="flex items-start gap-3 rounded-ui border-2 border-ink bg-lime/20 p-4 shadow-brutal-sm">
            <span className="grid size-8 shrink-0 place-items-center rounded-ui border-2 border-ink bg-lime shadow-brutal-sm">
              <Lock className="size-4" />
            </span>
            <div>
              <p className="text-xs font-bold mb-1">Keamanan Data</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">Token dienkripsi di server, tidak pernah kembali ke browser. Hanya kamu yang bisa mengelola konfigurasi ini.</p>
            </div>
          </div>

        </div>
      </CollapsibleSection>

      {/* ══ 4. PREVIEW FORMAT PESAN ══════════════════════════════════════════════════ */}
      <CollapsibleSection title="Preview Format Pesan" icon={<Bot className="size-5" />} headerBg="bg-coral" defaultOpen={true}>
        <ReportPreviewBox reportType={prefs.reportType} onChangeType={type => updatePref("reportType", type)} />
      </CollapsibleSection>

    </section>
  );
}
