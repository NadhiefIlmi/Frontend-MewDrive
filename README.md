# MewDrive Frontend

Frontend untuk MewDrive — Personal File Management System berbasis React + TanStack.

## Tech Stack

- **Framework**: React 19 + TanStack Start (SSR)
- **Routing**: TanStack Router (file-based)
- **Styling**: Tailwind CSS v4 + desain brutal (border-2, shadow-brutal)
- **State**: React Context (Auth, Theme) + TanStack Query
- **Editor**: Tiptap v2 (rich text editor untuk Catatan)
- **Icons**: Lucide React
- **Build**: Vite

---

## Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

App berjalan di: `http://localhost:5173`

> Pastikan backend sudah berjalan di `http://localhost:3001` sebelum membuka app.

---

## Scripts

| Script | Keterangan |
|--------|------------|
| `npm run dev` | Start dev server dengan HMR |
| `npm run build` | Build production |
| `npm run build:dev` | Build mode development |
| `npm run preview` | Preview hasil build |
| `npm run lint` | Lint dengan ESLint |
| `npm run format` | Format kode dengan Prettier |

---

## Fitur Utama

| Fitur | Keterangan |
|-------|------------|
| **Autentikasi** | Login/logout dengan JWT, permission-based access |
| **Dokumen saya** | Upload, download, rename, star, pindah folder, preview |
| **Folder** | Buat, edit (nama, icon, warna), pindahkan, trash |
| **Favorit** | File dan folder berbintang |
| **Catatan** | Rich text editor (bold, tabel, list, heading, dll.) |
| **Sampah** | Restore atau hapus permanen, bulk restore, kosongkan |
| **Pencarian** | Cari file dan folder secara global |
| **Storage** | Breakdown penggunaan storage per tipe file |
| **Pengaturan** | Ganti tema Light/Dark |
| **User Management** | Admin: kelola user, permission, storage quota, reset password |
| **Share Link** | Buat tautan publik untuk berbagi file |
| **Tema** | Light / Dark |
| **Responsif** | Mobile-first, bottom sheet untuk dialog di HP |

---

## Struktur Project

```
frontend/
├── public/
│   ├── cat.png              # Favicon + logo app
│   └── robots.txt
├── src/
│   ├── assets/              # Gambar (kucing, logo, gif)
│   ├── components/
│   │   ├── dashboard/       # Semua section halaman utama
│   │   │   ├── DashboardHeader.tsx    # Navbar + search + menu profil
│   │   │   ├── DashboardSidebar.tsx   # Sidebar navigasi
│   │   │   ├── HomeSection.tsx        # Halaman beranda (ringkasan)
│   │   │   ├── FilesSection.tsx       # Halaman dokumen saya
│   │   │   ├── FolderSection.tsx      # Komponen folder + CRUD
│   │   │   ├── FavoritesSection.tsx   # Halaman favorit
│   │   │   ├── NotesSection.tsx       # Halaman catatan
│   │   │   ├── TrashSection.tsx       # Halaman sampah
│   │   │   ├── StorageSection.tsx     # Halaman penyimpanan
│   │   │   ├── SettingsSection.tsx    # Halaman pengaturan tema
│   │   │   ├── UsersSection.tsx       # Halaman user management (Admin)
│   │   │   ├── RecentSection.tsx      # File terbaru
│   │   │   ├── SearchBar.tsx          # Komponen pencarian global
│   │   │   ├── FilePreviewDialog.tsx  # Preview file (gambar, PDF, video)
│   │   │   ├── ShareLinkDialog.tsx    # Dialog share link
│   │   │   └── MoveDialog.tsx         # Dialog pindah file/folder
│   │   ├── ui/
│   │   │   ├── button.tsx             # Komponen Button (CVA variants)
│   │   │   ├── ConfirmDialog.tsx      # Dialog konfirmasi (bottom sheet mobile)
│   │   │   └── RichTextEditor.tsx     # Editor Tiptap untuk catatan
│   │   ├── users/                     # Dialog-dialog user management
│   │   │   ├── AddUserDialog.tsx
│   │   │   ├── EditUserDialog.tsx
│   │   │   ├── ViewUserDetailsDialog.tsx
│   │   │   ├── ManagePermissionsDialog.tsx
│   │   │   ├── StorageQuotaDialog.tsx
│   │   │   └── ResetPasswordDialog.tsx
│   │   └── ProtectedRoute.tsx         # Guard route — redirect ke login jika belum auth
│   ├── contexts/
│   │   ├── AuthContext.tsx            # Auth state, login, logout, can()
│   │   └── ThemeContext.tsx           # Tema light/dark
│   ├── hooks/
│   │   ├── useTheme.ts                # Wrapper useThemeContext
│   │   └── usePermissions.ts          # Type PermissionName
│   ├── lib/
│   │   ├── api.ts                     # Semua API call ke backend
│   │   ├── dashboard-constants.ts     # Navigasi, tema options, data statis
│   │   └── utils.ts                   # cn() helper (clsx + twMerge)
│   ├── routes/
│   │   ├── __root.tsx                 # Root layout (Head, ThemeProvider, AuthProvider)
│   │   ├── index.tsx                  # Dashboard utama (semua section)
│   │   ├── login.tsx                  # Halaman login
│   │   └── share/                     # Halaman publik share link
│   ├── types/
│   │   └── dashboard.ts               # Tipe data frontend (User, FolderItem, dll.)
│   ├── router.tsx                     # Setup TanStack Router
│   ├── start.ts                       # Entry point TanStack Start
│   └── styles.css                     # Global CSS + Tailwind + Tiptap styles
└── package.json
```

---

## Arsitektur

### Routing
TanStack Router dengan file-based routing. Semua route ada di `src/routes/`.

```
/           → Dashboard utama (index.tsx) — dilindungi ProtectedRoute
/login      → Halaman login
/share/:token → Preview file publik via share link
```

### Auth & Permission
`AuthContext` menyimpan:
- `user` — data user yang sedang login
- `token` — JWT token
- `permissions` — Set permission aktif
- `can(permissionName)` — fungsi cek permission

Permission di-fetch dari `GET /api/users/:id/permissions` saat login dan saat mount. User hanya bisa akses permission miliknya sendiri; Admin bisa akses semua.

### Theme
`ThemeContext` handle Light/Dark. Pilihan disimpan di `localStorage` dengan key `MewDrive-theme`. Default: `light`.

### API Layer
Semua call ke backend terpusat di `src/lib/api.ts` melalui class `ApiClient`. Menggunakan `fetch` native dengan Bearer token otomatis dari localStorage.

### Mobile Responsiveness
- Dialog pakai **bottom sheet** di `< sm`, **centered modal** di `sm+`
- Layout pakai **card** di mobile, **table** di desktop (UsersSection)
- Semua padding, font size, dan spacing ada breakpoint `sm:`

---

## Environment

Tidak ada file `.env` untuk frontend — base URL API sudah hardcode di `src/lib/api.ts`:

```ts
const BASE_URL = "http://localhost:3001/api";  // development
```

Untuk production, ubah nilai ini ke URL backend production sebelum build.

---

## Design System

Proyek ini menggunakan desain **brutalist** dengan kelas Tailwind kustom:

| Kelas | Keterangan |
|-------|------------|
| `rounded-ui` | Border radius standar |
| `shadow-brutal` | Shadow tebal offset kanan-bawah |
| `shadow-brutal-sm` | Versi kecil shadow brutal |
| `border-ink` | Border hitam standar |
| `bg-sun` | Kuning |
| `bg-lime` | Hijau |
| `bg-lilac` | Ungu |
| `bg-sky` | Biru |
| `bg-coral` | Merah/oranye |
| `font-display` | Font Space Grotesk (heading) |

---

## Troubleshooting

**App tidak bisa konek ke backend**
```
Pastikan backend berjalan di http://localhost:3001
Cek CORS di backend — FRONTEND_URL harus http://localhost:5173
```

**Permission tidak muncul setelah admin ubah permission user**
```
User perlu logout lalu login ulang, atau admin bisa trigger refresh
dari detail pengguna. Permission di-cache di memory selama sesi.
```

**Favicon tidak berubah setelah ganti cat.png**
```
Hard refresh: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
Atau buka di tab incognito.
```

**Build error**
```bash
# Pastikan semua dependency terinstall
npm install

# Cek TypeScript error
npx tsc --noEmit
```
