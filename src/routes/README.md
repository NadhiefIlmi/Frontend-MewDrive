# Routes Structure

Dokumentasi lengkap struktur routing MewDrive menggunakan TanStack Router.

## 📁 File Structure

```
src/routes/
├── __root.tsx                 # Root layout (wrapper untuk semua route)
├── index.tsx                  # Homepage / Dashboard
├── login.tsx                  # Login page
└── users/                     # User Management routes
    ├── index.tsx              # User list page
    ├── $userId.tsx            # User detail page (dynamic)
    └── -components/           # Private components (tidak jadi route)
        ├── AddUserDialog.tsx
        ├── EditUserDialog.tsx
        ├── StorageQuotaDialog.tsx
        ├── PermissionsTab.tsx
        ├── SharedTab.tsx
        ├── ShareDialog.tsx
        └── ActivityTab.tsx
```

## 🗺️ Route Mapping

| File | URL | Description | Access |
|------|-----|-------------|--------|
| `__root.tsx` | - | Root layout component | All |
| `index.tsx` | `/` | Homepage / Dashboard | Authenticated |
| `login.tsx` | `/login` | Login page | Public |
| `users/index.tsx` | `/users` | User list & management | Admin only |
| `users/$userId.tsx` | `/users/:userId` | User detail page | Admin only |

### Example URLs:
- `/` → Dashboard
- `/login` → Login page
- `/users` → User list
- `/users/1` → Detail user dengan ID 1
- `/users/abc123` → Detail user dengan ID abc123

## 🔑 Naming Conventions

### 1. **`index.tsx`**
```
File: users/index.tsx
Route: /users
```
- File bernama `index.tsx` = halaman utama/index dari route tersebut
- Sama seperti `index.html` di folder

### 2. **`$paramName.tsx`**
```
File: users/$userId.tsx
Route: /users/:userId (dynamic)
```
- Prefix `$` = dynamic parameter
- `$userId` → dapat diakses sebagai `:userId` di URL
- Contoh: `/users/123`, `/users/abc`, dll

### 3. **`__root.tsx`**
```
File: __root.tsx
Type: Special file (layout, bukan route)
```
- Double underscore `__` = file spesial
- Ini adalah root layout yang wrap semua route
- Tidak akan jadi URL

### 4. **`-components/` folder**
```
Folder: users/-components/
Type: Private folder (tidak jadi route)
```
- Prefix `-` (minus) = folder private/internal
- Tidak akan dijadikan route oleh TanStack Router
- Aman untuk simpan komponen helper

## 📖 How to Read Route Files

Setiap file route memiliki struktur:

```tsx
/**
 * Route: /actual/url
 * Description: Penjelasan halaman ini
 * Features:
 * - Feature 1
 * - Feature 2
 */

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/actual/url")({
  component: PageComponent,
});

function PageComponent() {
  return <div>Content</div>;
}
```

## 🎯 Quick Reference

### Adding New Routes

#### Static Route:
```tsx
// File: src/routes/about.tsx
// URL: /about

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});
```

#### Dynamic Route:
```tsx
// File: src/routes/posts/$postId.tsx
// URL: /posts/:postId

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/posts/$postId")({
  component: PostDetailPage,
});
```

#### Nested Route:
```tsx
// File: src/routes/settings/profile.tsx
// URL: /settings/profile

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/profile")({
  component: ProfileSettingsPage,
});
```

## 🚀 Best Practices

1. **Selalu tambahkan comment header** di setiap file route
2. **Gunakan folder structure** untuk grup route yang related
3. **Simpan components di `-components/`** folder untuk organize kode
4. **Dokumentasikan dynamic params** di comment header
5. **Konsisten dengan naming convention** TanStack Router

## 🔗 Resources

- [TanStack Router Docs](https://tanstack.com/router)
- [File-based Routing Guide](https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing)
- [Route Trees](https://tanstack.com/router/latest/docs/framework/react/guide/route-trees)

## 📝 Notes

- File `routeTree.gen.ts` adalah **auto-generated**, jangan edit manual
- Setiap perubahan di `src/routes/` akan trigger regenerate `routeTree.gen.ts`
- Dev server akan auto-reload saat routes berubah
