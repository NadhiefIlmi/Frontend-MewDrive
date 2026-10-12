/**
 * Dashboard Constants
 * Shared constants and initial data
 */

import {
  Grid2X2,
  Folder,
  Star,
  StickyNote,
  Trash2,
  Users,
  FolderHeart,
  FileText,
  FileArchive,
  FileSpreadsheet,
  FileImage,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import type { Section, DocumentItem, Note, User, FolderItem } from "@/types/dashboard";
import type { Theme } from "@/hooks/useTheme";

export const navigation: { Icon: typeof Grid2X2; label: string; id: Section; adminOnly?: boolean }[] = [
  { Icon: Grid2X2, label: "Beranda", id: "home" },
  { Icon: Folder, label: "File saya", id: "files" },
  { Icon: Star, label: "Favorit", id: "favorites" },
  { Icon: StickyNote, label: "Catatan", id: "notes" },
  { Icon: Trash2, label: "Sampah", id: "trash" },
  { Icon: Users, label: "User Management", id: "users", adminOnly: true },
];

export const sectionCopy: Record<
  Exclude<Section, "home">,
  { eyebrow: string; title: string; description: string }
> = {
  files: {
    eyebrow: "Koleksi pribadi",
    title: "File saya",
    description: "Semua dokumen yang kamu simpan, tersusun dalam satu tempat.",
  },
  favorites: {
    eyebrow: "Pilihan penting",
    title: "Favorit",
    description: "Akses cepat ke dokumen yang sudah kamu tandai.",
  },
  notes: {
    eyebrow: "Tulis cepat",
    title: "Catatan",
    description: "Simpan ide, daftar tugas, dan pengingat pribadimu.",
  },
  trash: {
    eyebrow: "Penyimpanan sementara",
    title: "Sampah",
    description: "File akan dihapus permanen setelah 30 hari.",
  },
  users: {
    eyebrow: "Kelola akses",
    title: "User Management",
    description: "Kelola user, role, dan hak akses sistem.",
  },
  storage: {
    eyebrow: "Kapasitas akun",
    title: "Penyimpanan",
    description: "Lihat apa saja yang memakai ruang penyimpananmu.",
  },
  settings: {
    eyebrow: "Preferensi akun",
    title: "Pengaturan",
    description: "Atur tampilan MewDrive agar nyaman untukmu.",
  },
  recent: {
    eyebrow: "Aktivitas terkini",
    title: "Terbaru",
    description: "File dan folder yang baru saja kamu akses.",
  },
};

export const themeOptions: {
  id: Theme;
  label: string;
  description: string;
  Icon: typeof Sun;
}[] = [
  {
    id: "light",
    label: "Light",
    description: "Tampilan terang setiap saat",
    Icon: Sun,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Tampilan gelap setiap saat",
    Icon: Moon,
  },
  {
    id: "system",
    label: "System",
    description: "Ikuti pengaturan perangkat",
    Icon: Monitor,
  },
];

export const noteColors = ["bg-sun", "bg-lime", "bg-lilac", "bg-sky", "bg-coral"];

export const initialFolders: FolderItem[] = [
  { name: "Pekerjaan", count: 24, color: "bg-lilac", Icon: Folder },
  { name: "Personal", count: 18, color: "bg-lime", Icon: FolderHeart },
  { name: "Sertifikat", count: 8, color: "bg-sun", Icon: Star },
];

export const initialFiles: DocumentItem[] = [
  {
    id: 1,
    name: "Brand Guidelines.pdf",
    type: "PDF",
    size: "4.8 MB",
    date: "Hari ini, 09:42",
    color: "bg-coral",
    Icon: FileText,
    favorite: true,
  },
  {
    id: 2,
    name: "Foto Liburan.zip",
    type: "ZIP",
    size: "2.1 GB",
    date: "Kemarin, 16:20",
    color: "bg-sun",
    Icon: FileArchive,
    favorite: false,
  },
  {
    id: 3,
    name: "Catatan Meeting.docx",
    type: "DOCX",
    size: "820 KB",
    date: "25 Sep 2026",
    color: "bg-lime",
    Icon: FileText,
    favorite: true,
  },
  {
    id: 4,
    name: "Project Plan.docx",
    type: "DOCX",
    size: "1.2 MB",
    date: "24 Sep 2026",
    color: "bg-sky",
    Icon: FileText,
    favorite: false,
  },
  {
    id: 5,
    name: "Budget Q4.xlsx",
    type: "XLSX",
    size: "640 KB",
    date: "22 Sep 2026",
    color: "bg-lime",
    Icon: FileSpreadsheet,
    favorite: true,
  },
  {
    id: 6,
    name: "Moodboard Produk.png",
    type: "PNG",
    size: "8.3 MB",
    date: "18 Sep 2026",
    color: "bg-lilac",
    Icon: FileImage,
    favorite: false,
  },
  {
    id: 7,
    name: "Proposal Lama.pdf",
    type: "PDF",
    size: "3.6 MB",
    date: "Dihapus 3 hari lalu",
    color: "bg-coral",
    Icon: FileText,
    favorite: false,
    trashed: true,
  },
  {
    id: 8,
    name: "Screenshot 0920.png",
    type: "PNG",
    size: "2.4 MB",
    date: "Dihapus 6 hari lalu",
    color: "bg-sky",
    Icon: FileImage,
    favorite: false,
    trashed: true,
  },
];

export const initialNotes: Note[] = [
  {
    id: 1,
    title: "Ide konten minggu ini",
    body: "Tulis panduan menyusun folder kerja dan tips arsip digital.",
    color: "bg-sun",
    date: "Hari ini",
  },
  {
    id: 2,
    title: "Belanja bulanan",
    body: "Kopi, makanan kucing, kertas A4, baterai.",
    color: "bg-lime",
    date: "Kemarin",
  },
  {
    id: 3,
    title: "Rapat klien",
    body: "Kirim revisi proposal sebelum Jumat jam 15.00.",
    color: "bg-lilac",
    date: "25 Sep",
  },
];

export const initialUsers: User[] = [
  {
    id: 1,
    name: "Fasichul Ilmi",
    email: "fasichul@email.com",
    role: "Admin",
    storageUsed: 72,
    storageQuota: 100,
    status: "Active",
    initial: "FI",
    color: "bg-lime",
  },
  {
    id: 2,
    name: "Muhammad Nadhif",
    email: "nadhif@example.com",
    role: "User",
    storageUsed: 8,
    storageQuota: 20,
    status: "Active",
    initial: "MN",
    color: "bg-lilac",
  },
  {
    id: 3,
    name: "Ahmad Ridwan",
    email: "ahmad@example.com",
    role: "User",
    storageUsed: 35,
    storageQuota: 50,
    status: "Active",
    initial: "AR",
    color: "bg-sky",
  },
  {
    id: 4,
    name: "Budi Santoso",
    email: "budi@example.com",
    role: "User",
    storageUsed: 12,
    storageQuota: 30,
    status: "Active",
    initial: "BS",
    color: "bg-sun",
  },
  {
    id: 5,
    name: "Sinta Dewi",
    email: "sinta@example.com",
    role: "User",
    storageUsed: 2,
    storageQuota: 10,
    status: "Disabled",
    initial: "SD",
    color: "bg-coral",
  },
];

export const storageBreakdown = [
  { label: "Dokumen", size: "1.4 GB", pct: 14, color: "bg-lilac", Icon: FileText },
  { label: "Gambar", size: "1.6 GB", pct: 16, color: "bg-sky", Icon: FileImage },
  { label: "Arsip", size: "1.0 GB", pct: 10, color: "bg-sun", Icon: FileArchive },
  { label: "Lainnya", size: "0.2 GB", pct: 2, color: "bg-coral", Icon: Folder },
];

export function formatSize(bytes: number) {
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}
