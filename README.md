# MewDrive Frontend — Self-Hosted Cloud Storage UI

MewDrive Frontend adalah aplikasi web modern berbasis **TanStack Start (React 19, SSR, Vite)** yang menyediakan antarmuka lengkap untuk mengelola file cloud storage pribadi. Dibangun dengan UI component library **shadcn/ui** di atas **Radix UI** dan **Tailwind CSS v4**, serta menggunakan **TanStack Router** untuk type-safe file-based routing.

> 🔗 **Repositori Terkait:** Backend REST API yang menggerakkan sistem ini tersedia di [**Backend-MewDrive (Node.js + Express)**](https://github.com/NadhiefIlmi/Backend-MewDrive).

---

## 🌟 Fitur Utama

- **Dashboard Terpadu:** Tampilan Home dengan ringkasan file terbaru, storage usage, dan aktivitas.
- **File & Folder Management:** Upload multi-file (drag & drop), rename, move, download, preview (gambar/PDF/video), trash & restore, serta toggle favorit.
- **Full-Text Search:** SearchBar real-time yang mencari file dan folder secara instan.
- **File Preview Dialog:** Preview dokumen, gambar, dan video langsung di dalam modal tanpa meninggalkan halaman.
- **Share Link:** Buat dan kelola link berbagi publik dengan password opsional dan tanggal kedaluwarsa.
- **Notes (Rich Text Editor):** Editor catatan berbasis Tiptap dengan dukungan format teks, tabel, task list, dan highlight.
- **Tasks Manager:** Manajemen tugas dengan attachment file, status, prioritas, dan deadline.
- **Telegram Settings:** Konfigurasi notifikasi Telegram Bot langsung dari settings panel.
- **User Management (Admin):** Panel admin untuk buat, edit, reset password, dan kelola kuota storage per user.
- **RBAC Permissions:** Kelola hak akses antar user berbasis role (viewer, editor, admin).
- **PWA-Ready:** Manifest & meta tags untuk installable web app di perangkat mobile.
- **Dark/Light Theme:** Toggle tema dengan ThemeContext & localStorage persistence.
- **Mobile-First:** Bottom navigation bar untuk navigasi mobile yang nyaman.

---

## 🛠️ Frontend Tech Stack

| Kategori | Teknologi | Versi / Keterangan |
|---|---|---|
| **Runtime & Core** | React 19 + TypeScript 5.8 | Modern React dengan full concurrent features |
| **Framework / Meta-framework** | TanStack Start (`@tanstack/react-start`) | Full-stack React SSR framework dengan file-based routing |
| **Routing** | TanStack Router (`@tanstack/react-router`) | 100% type-safe routing dengan code-gen `routeTree.gen.ts` |
| **Build Tool** | Vite 8.1.5 | Bundler ultra-cepat dengan Rolldown engine |
| **UI Components** | shadcn/ui + Radix UI | 40+ accessible, unstyled primitives yang dikustomisasi |
| **Styling** | Tailwind CSS v4 | Utility-first CSS generasi terbaru dengan Vite plugin |
| **Rich Text Editor** | Tiptap 2.12.0 | Editor berbasis ProseMirror dengan 10+ extensions |
| **Data Fetching** | TanStack Query v5 | Server state management dengan caching & retry |
| **Form & Validation** | React Hook Form + Zod | Schema-based form validation deklaratif |
| **Icons** | Lucide React `^0.575.0` | Icon vektor modular & konsisten |
| **Charts** | Recharts | Visualisasi data storage usage |
| **Notifications** | Sonner v2 | Toast notification modern & elegan |
| **Animation** | Lottie (`@lottiefiles/dotlottie-react`) | Animasi loading cat berbasis JSON/dotLottie |
| **Date Utilities** | date-fns v4 | Manipulasi tanggal modern tanpa moment.js |
| **Code Quality** | ESLint + Prettier | Linting & formatting dengan config ketat |
| **Package Manager** | npm (v10+) | Standar package manager Node.js |

---

## 📁 Struktur Direktori & Penjelasan File

```text
frontend/
├── public/                              # Static assets publik
│   ├── manifest.json                    # PWA manifest (ikon, theme color, display mode)
│   ├── robots.txt                       # Instruksi crawler search engine
│   ├── cat.webp / kucing_pagi.webp      # Mascot ilustrasi MewDrive
│   └── fonts/                           # Self-hosted web fonts (DM Sans, Space Grotesk) woff2
├── src/
│   ├── assets/                          # Asset statis yang di-bundle Vite
│   │   ├── Loader_cat.gif               # Animasi loading kucing utama
│   │   ├── loading_cat.gif              # Variasi animasi loading
│   │   ├── cat.webp / kucing_pagi.webp  # Ilustrasi mascot
│   │   └── login_kucing.webp            # Ilustrasi halaman login
│   ├── components/
│   │   ├── ProtectedRoute.tsx           # Guard komponen: redirect ke /login jika belum auth
│   │   ├── dashboard/                   # Komponen utama section-section dashboard
│   │   │   ├── DashboardHeader.tsx      # Header aplikasi: logo, SearchBar, user menu, theme toggle
│   │   │   ├── DashboardSidebar.tsx     # Sidebar navigasi desktop dengan collapse support
│   │   │   ├── MobileBottomNav.tsx      # Bottom navigation bar untuk mobile
│   │   │   ├── MenuItem.tsx             # Item navigasi sidebar reusable
│   │   │   ├── HomeSection.tsx          # Halaman utama: file terbaru, storage ringkas, favorit
│   │   │   ├── FilesSection.tsx         # Manajemen file: grid/list view, upload, context menu
│   │   │   ├── FolderSection.tsx        # Manajemen folder: buat, rename, move, hierarki
│   │   │   ├── FavoritesSection.tsx     # Daftar file & folder yang difavoritkan
│   │   │   ├── RecentSection.tsx        # File yang baru-baru ini diakses
│   │   │   ├── SearchBar.tsx            # Input pencarian real-time dengan debounce
│   │   │   ├── FilePreviewDialog.tsx    # Modal preview file: gambar, PDF, video, teks
│   │   │   ├── ShareLinkDialog.tsx      # Dialog buat & kelola share link publik
│   │   │   ├── MoveDialog.tsx           # Dialog pindah file/folder dengan folder picker
│   │   │   ├── StorageSection.tsx       # Visualisasi kuota storage dengan chart & breakdown
│   │   │   ├── NotesSection.tsx         # Editor catatan rich-text berbasis Tiptap
│   │   │   ├── TasksSection.tsx         # Task manager: list, tambah, status, deadline
│   │   │   ├── TrashSection.tsx         # Sampah: restore atau hapus permanen
│   │   │   ├── UsersSection.tsx         # Panel admin: manajemen user & kuota
│   │   │   ├── SettingsSection.tsx      # Pengaturan umum: profil, password, tema
│   │   │   └── ChangePasswordDialog.tsx # Dialog ganti password dengan validasi kekuatan
│   │   ├── settings/
│   │   │   └── TelegramSettings.tsx     # Konfigurasi & simpan token Telegram Bot
│   │   ├── users/                       # Komponen dialog manajemen user (admin)
│   │   │   ├── AddUserDialog.tsx        # Dialog tambah user baru dengan role
│   │   │   ├── EditUserDialog.tsx       # Dialog edit profil & kuota user
│   │   │   ├── ViewUserDetailsDialog.tsx# Dialog detail lengkap user
│   │   │   ├── ResetPasswordDialog.tsx  # Dialog reset password user (admin)
│   │   │   ├── StorageQuotaDialog.tsx   # Dialog atur kuota storage user
│   │   │   ├── ManagePermissionsDialog.tsx # Dialog kelola permission RBAC user
│   │   │   ├── PermissionsTab.tsx       # Tab daftar permission aktif user
│   │   │   └── ActivityTab.tsx          # Tab riwayat aktivitas audit log user
│   │   └── ui/                          # shadcn/ui component library (40+ komponen)
│   │       ├── button.tsx / input.tsx / label.tsx / badge.tsx  # Primitif form
│   │       ├── dialog.tsx / sheet.tsx / drawer.tsx / popover.tsx # Overlay components
│   │       ├── card.tsx / separator.tsx / tabs.tsx / table.tsx  # Layout components
│   │       ├── dropdown-menu.tsx / context-menu.tsx / menubar.tsx # Menu components
│   │       ├── select.tsx / checkbox.tsx / switch.tsx / slider.tsx # Form controls
│   │       ├── calendar.tsx / radio-group.tsx / input-otp.tsx   # Specialized inputs
│   │       ├── progress.tsx / skeleton.tsx / avatar.tsx / chart.tsx # Feedback
│   │       ├── sidebar.tsx / scroll-area.tsx / resizable.tsx    # Layout utilities
│   │       ├── RichTextEditor.tsx       # Wrapper Tiptap editor dengan toolbar lengkap
│   │       ├── ConfirmDialog.tsx        # Dialog konfirmasi aksi destruktif (hapus, dll)
│   │       └── Toast.tsx                # Komponen toast notifikasi custom
│   ├── contexts/
│   │   ├── AuthContext.tsx              # Context auth: user state, login, logout, token refresh
│   │   └── ThemeContext.tsx             # Context tema: dark/light mode dengan localStorage
│   ├── hooks/
│   │   ├── use-mobile.tsx              # Hook deteksi viewport mobile (< 768px)
│   │   ├── usePermissions.ts           # Hook cek permission RBAC user yang sedang login
│   │   └── useTheme.ts                 # Hook konsumsi ThemeContext
│   ├── lib/
│   │   ├── api.ts                      # Axios instance + interceptor: auth header, token refresh, error handling
│   │   ├── utils.ts                    # Utility: `cn()` class merger, format bytes, date, dll
│   │   ├── dashboard-constants.ts      # Konstanta UI: menu items, section keys, icon mapping
│   │   ├── error-capture.ts            # Utilitas capture & format error untuk display
│   │   ├── error-page.ts               # Data konten halaman error (404, 500, dll)
│   │   └── error-reporting.ts          # Error reporting utility (logging, monitoring)
│   ├── routes/                         # File-based routing TanStack Start
│   │   ├── __root.tsx                  # Root layout: provider wrapper, error boundary, favicon
│   │   ├── index.tsx                   # Halaman utama dashboard (protected)
│   │   ├── login.tsx                   # Halaman login dengan mascot ilustrasi
│   │   ├── dialogs/
│   │   │   └── -FilePreview.tsx        # Dialog route untuk preview file (prefix `-` = layout only)
│   │   └── share/
│   │       └── $token.tsx              # Halaman akses share link publik (dynamic route)
│   ├── types/
│   │   └── dashboard.ts                # TypeScript types untuk seluruh entitas dashboard
│   ├── fonts.css                        # @font-face deklarasi DM Sans & Space Grotesk self-hosted
│   ├── styles.css                       # Global CSS: design tokens, animasi, utility classes
│   ├── router.tsx                       # TanStack Router instance configuration
│   ├── routeTree.gen.ts                 # Auto-generated route tree (jangan edit manual)
│   ├── routeTree.ts                     # Route tree config override
│   ├── server.ts                        # Nitro server entry (SSR production)
│   └── start.ts                         # TanStack Start bootstrapping
├── server-node.mjs                      # Node.js server wrapper untuk production deploy
├── .github/
│   └── workflows/
│       └── deploy.yml                   # GitHub Actions: build & deploy ke VPS
├── .env.example                         # Template environment variable
├── .prettierrc / .prettierignore        # Prettier formatting config
├── components.json                      # shadcn/ui CLI config (prefix, style, path aliases)
├── eslint.config.js                     # ESLint flat config dengan TypeScript & React rules
├── tsconfig.json                        # TypeScript config
├── vite.config.ts                       # Vite config: TanStack Router plugin, path aliases, Tailwind
└── package.json                         # Manifest dependensi & npm scripts
```

### 📑 Rincian Fungsi Kunci

#### 1. `src/lib/api.ts` (HTTP Client)
Axios instance terkonfigurasi dengan base URL backend, interceptor request untuk injeksi `Authorization: Bearer <token>`, interceptor response untuk auto-refresh token saat 401, dan error normalization.

#### 2. `src/contexts/AuthContext.tsx` (Authentication State)
React Context yang mengelola state autentikasi global: user object, login/logout action, token refresh otomatis, dan proteksi route via `ProtectedRoute`.

#### 3. `src/routes/index.tsx` (Main Dashboard)
Halaman dashboard utama yang merender `DashboardHeader`, `DashboardSidebar`, `MobileBottomNav`, dan section yang aktif berdasarkan navigasi (Home, Files, Folders, Storage, Notes, Tasks, Trash, Settings, Users).

#### 4. `src/components/dashboard/FilesSection.tsx` (File Manager)
Komponen terbesar: grid/list view file dengan infinite scroll, upload via drag & drop, context menu klik kanan (download, rename, move, share, favorite, trash), dan integrasi `FilePreviewDialog`.

#### 5. `src/components/ui/RichTextEditor.tsx` (Rich Text)
Editor berbasis Tiptap 2.12 dengan toolbar: bold, italic, underline, strikethrough, highlight, text color, heading, list, task list, tabel, dan text alignment. Output HTML yang disimpan ke backend.

#### 6. `src/routes/share/$token.tsx` (Public Share Page)
Halaman publik tanpa autentikasi untuk mengakses shared file. Mendukung password-protected link, preview in-page, dan tombol download langsung.

---

## ⚙️ Persyaratan Sistem

- **Node.js:** Versi 20.x atau 22.x LTS
- **npm:** Versi 10.x atau lebih baru
- **Browser Modern:** Chrome 90+, Firefox 88+, Safari 14+, Edge

---

## 🚀 Panduan Menjalankan

### 1. Masuk ke Direktori Frontend
```bash
cd frontend
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env`)
```bash
cp .env.example .env.local
```
Isi konfigurasi standar:
```dotenv
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

> ⚠️ **PERHATIAN:** Semua variabel `VITE_*` akan terekspos di bundle JavaScript browser. Jangan simpan secret di sini!

### 4. Menjalankan Development Server
```bash
npm run dev
```
Aplikasi aktif di: **`http://localhost:5173`**

---

## 🧪 Linting & Build

```bash
# Menjalankan linter ESLint
npm run lint

# Menjalankan Prettier formatter
npm run format

# Membangun bundle produksi
npm run build

# Preview hasil build lokal
npm run preview

# Build mode development (tanpa minifikasi)
npm run build:dev
```

---

## 🛠️ Troubleshooting & Solusi

### 1. Error `VITE_API_BASE_URL is not defined`
- **Penyebab:** File `.env.local` belum dibuat atau variabel salah nama.
- **Solusi:** Jalankan `cp .env.example .env.local`, pastikan diawali `VITE_`, lalu restart dev server.

### 2. Login berhasil tapi langsung logout
- **Penyebab:** Token refresh gagal karena `VITE_API_BASE_URL` salah atau backend tidak aktif.
- **Solusi:** Pastikan backend berjalan di port yang sesuai (`http://localhost:3001`) dan CORS terkonfigurasi dengan benar.

### 3. File preview tidak muncul (gambar/PDF blank)
- **Penyebab:** Backend endpoint `/preview/:id` tidak dapat diakses atau CORS tidak mengizinkan.
- **Solusi:** Pastikan `FRONTEND_URL` di backend `.env` sesuai dengan URL dev frontend (`http://localhost:5173`).

### 4. Build gagal dengan error TypeScript
- **Solusi:** Jalankan `npx tsc --noEmit` untuk melihat detail error. Pastikan `routeTree.gen.ts` tidak di-edit manual dan regenerasi dengan `npm run dev` sekali dulu.

### 5. Lottie animation tidak muncul
- **Penyebab:** `@lottiefiles/dotlottie-react` butuh browser modern dengan WASM support.
- **Solusi:** Update browser ke versi terbaru. Fallback ke `loading_cat.gif` sudah disediakan untuk browser lama.

---

## 🔗 Ekosistem Repositori MewDrive

| Komponen | Repositori GitHub | Deskripsi & Stack |
|---|---|---|
| **Frontend Web App** | [Frontend-MewDrive](https://github.com/NadhiefIlmi/Frontend-MewDrive) | Cloud Storage UI (TanStack Start, React 19, Tailwind CSS v4, shadcn/ui, Tiptap) |
| **Backend REST API** | [Backend-MewDrive](https://github.com/NadhiefIlmi/Backend-MewDrive) | REST API (Node.js, Express, PostgreSQL, JWT, Multer, PM2) |
