/**
 * Dashboard Route
 * Main dashboard — Task 5: file upload + real file list
 */

import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { api, type FileItem } from "@/lib/api";
import { apiUserToUser, gbToBytes, type ApiFolderItem } from "@/types/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { sectionCopy } from "@/lib/dashboard-constants";
import type { Section, User } from "@/types/dashboard";
import { useToast, ToastContainer } from "@/components/ui/Toast";

// Dialogs
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { EditUserDialog } from "@/components/users/EditUserDialog";
import { StorageQuotaDialog } from "@/components/users/StorageQuotaDialog";
import { ViewUserDetailsDialog } from "@/components/users/ViewUserDetailsDialog";
import { ManagePermissionsDialog } from "@/components/users/ManagePermissionsDialog";
import { ResetPasswordDialog } from "@/components/users/ResetPasswordDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// Sections
import { HomeSection } from "@/components/dashboard/HomeSection";
import { FolderSection } from "@/components/dashboard/FolderSection";
import { FilesSection } from "@/components/dashboard/FilesSection";
import { FavoritesSection } from "@/components/dashboard/FavoritesSection";
import { RecentSection } from "@/components/dashboard/RecentSection";
import { TrashSection } from "@/components/dashboard/TrashSection";
import { NotesSection } from "@/components/dashboard/NotesSection";
import { UsersSection } from "@/components/dashboard/UsersSection";
import { SettingsSection } from "@/components/dashboard/SettingsSection";
import { StorageSection } from "@/components/dashboard/StorageSection";
import { FilePreviewDialog } from "@/components/dashboard/FilePreviewDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MewDrive " },
      { name: "description", content: "Kelola file, folder, catatan, dan dokumen pribadi dengan rapi di MewDrive." },
      { property: "og:title", content: "MewDrive - Personal Document Manager" },
      { property: "og:description", content: "Kelola file, folder, catatan, dan dokumen pribadi dengan rapi di MewDrive." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { user: authUser, refreshUser, can, refreshPermissions } = useAuth();
  const { toasts, success: toastSuccess, error: toastError, info: toastInfo, dismiss } = useToast();

  // Helper: flash(msg) → success, flash(msg, "error") → error
  const flash = useCallback((msg: string, type: "success" | "error" | "info" = "success") => {
    if (type === "error") toastError(msg);
    else if (type === "info") toastInfo(msg);
    else toastSuccess(msg);
  }, [toastSuccess, toastError, toastInfo]);

  // ─── UI state ──────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [activeSection, setActiveSection] = useState<Section>(
    () => {
      if (typeof window === "undefined") return "home";
      return (localStorage.getItem("mewdrive_section") as Section) ?? "home";
    }
  );
  const [query, setQuery]                 = useState("");
  const fileInput                         = useRef<HTMLInputElement>(null);

  // ─── Files (real API — Task 5) ────────────────────────────────────────────
  const [apiFiles, setApiFiles]         = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesPage, setFilesPage]       = useState(1);
  const [filesTotal, setFilesTotal]     = useState(0);
  const [filesLoadingMore, setFilesLoadingMore] = useState(false);
  const FILES_LIMIT = 10;

  // ─── Folders (real API) ────────────────────────────────────────────────────
  const [apiFolders, setApiFolders]         = useState<ApiFolderItem[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [foldersPage, setFoldersPage]       = useState(1);
  const [foldersTotal, setFoldersTotal]     = useState(0);
  const [foldersLoadingMore, setFoldersLoadingMore] = useState(false);
  const FOLDERS_LIMIT = 12;

  // folderStack persist ke localStorage supaya refresh tetap di folder yang sama
  const [folderStack, setFolderStackRaw] = useState<{ id: number; name: string }[]>(() => {
    try {
      if (typeof window === "undefined") return [];
      const saved = localStorage.getItem("mewdrive_folder_stack");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const setFolderStack = (
    updater: { id: number; name: string }[] |
             ((prev: { id: number; name: string }[]) => { id: number; name: string }[])
  ) => {
    setFolderStackRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem("mewdrive_folder_stack", JSON.stringify(next));
      return next;
    });
  };

  const currentParentId = folderStack.length > 0 ? folderStack[folderStack.length - 1]!.id : null;
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  // ─── Upload state ─────────────────────────────────────────────────────────
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // ─── Users ────────────────────────────────────────────────────────────────
  const [users, setUsers]                     = useState<User[]>([]);
  const [usersLoading, setUsersLoading]       = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [editingUser, setEditingUser]         = useState<User | null>(null);
  const [storageUser, setStorageUser]         = useState<User | null>(null);
  const [viewingUser, setViewingUser]         = useState<User | null>(null);
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);
  const [openUserMenuId, setOpenUserMenuId]   = useState<number | null>(null);
  const [deletingUser, setDeletingUser]       = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);

  // ─── Dialogs ──────────────────────────────────────────────────────────────
  const [searchPreviewFile, setSearchPreviewFile] = useState<FileItem | null>(null);

  // ─── Fetch files dari API ─────────────────────────────────────────────────
  // Reset ke halaman 1 (fetch baru saat folder berubah)
  const fetchFiles = useCallback(async (folderId: number | null = null) => {
    setFilesLoading(true);
    setFilesPage(1);
    const res = await api.getFiles(folderId, { page: 1, limit: FILES_LIMIT });
    if (res.success && res.data) {
      setApiFiles(res.data.files);
      setFilesTotal(res.data.total);
    }
    setFilesLoading(false);
  }, [FILES_LIMIT]);

  // Load more: append ke list yang ada
  const loadMoreFiles = useCallback(async (folderId: number | null, nextPage: number) => {
    setFilesLoadingMore(true);
    const res = await api.getFiles(folderId, { page: nextPage, limit: FILES_LIMIT });
    if (res.success && res.data) {
      setApiFiles(prev => [...prev, ...res.data!.files]);
      setFilesPage(nextPage);
      setFilesTotal(res.data.total);
    }
    setFilesLoadingMore(false);
  }, [FILES_LIMIT]);

  // ─── Fetch folders dari API ───────────────────────────────────────────────
  const fetchFolders = useCallback(async (parentId: number | null = null) => {
    setFoldersLoading(true);
    setFoldersPage(1);
    const res = await api.getFolders(parentId, { page: 1, limit: FOLDERS_LIMIT });
    if (res.success && res.data) {
      setApiFolders(res.data.folders as ApiFolderItem[]);
      setFoldersTotal(res.data.total);
    }
    setFoldersLoading(false);
  }, [FOLDERS_LIMIT]);

  // Load more folders
  const loadMoreFolders = useCallback(async (parentId: number | null, nextPage: number) => {
    setFoldersLoadingMore(true);
    const res = await api.getFolders(parentId, { page: nextPage, limit: FOLDERS_LIMIT });
    if (res.success && res.data) {
      setApiFolders(prev => [...prev, ...(res.data!.folders as ApiFolderItem[])]);
      setFoldersPage(nextPage);
      setFoldersTotal(res.data.total);
    }
    setFoldersLoadingMore(false);
  }, [FOLDERS_LIMIT]);

  // Load saat section files / home dibuka atau folder berubah
  // Fetch folders + files secara PARALLEL (bukan sequential) untuk performa lebih cepat
  useEffect(() => {
    if (activeSection === "files" || activeSection === "home") {
      Promise.all([
        fetchFolders(currentParentId),
        fetchFiles(currentParentId),
      ]);
    }
  }, [activeSection, currentParentId, fetchFolders, fetchFiles]);

  // ─── Fetch users ──────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    const res = await api.getUsers({ limit: 100 });
    if (res.success && res.data) setUsers(res.data.users.map(apiUserToUser));
    setUsersLoading(false);
  }, []);

  useEffect(() => {
    if (activeSection === "users") fetchUsers();
  }, [activeSection, fetchUsers]);

  // ─── Navigation ───────────────────────────────────────────────────────────
  const selectSection = (section: Section) => {
    setActiveSection(section);
    localStorage.setItem("mewdrive_section", section);
    setQuery("");
    setSidebarOpen(false);
    if (section !== "files") {
      setFolderStack([]);
      localStorage.setItem("mewdrive_folder_stack", "[]");
    }
  };

  // ─── Upload handler (real API) ────────────────────────────────────────────
  const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

  const onUpload = async (list: FileList | null) => {
    if (!list?.length) return;

    // Cek permission dulu
    if (!can('create_files')) {
      flash("Kamu tidak punya izin untuk mengupload file", "error");
      return;
    }
    const files = Array.from(list);

    // Validasi ukuran di frontend dulu
    const oversized = files.filter(f => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized.length > 0) {
      flash(`File terlalu besar (max 15 MB): ${oversized.map(f => f.name).join(", ")}`, "error");
      if (oversized.length === files.length) return; // semua gagal, stop
    }

    const validFiles = files.filter(f => f.size <= MAX_FILE_SIZE_BYTES);
    let successCount = 0;
    let errorMsg = "";

    for (const file of validFiles) {
      setUploadProgress(0);
      const res = await api.uploadFile(file, currentParentId, (pct) => setUploadProgress(pct));
      if (res.success) {
        successCount++;
      } else {
        errorMsg = res.error?.message ?? "Upload gagal";
      }
    }

    setUploadProgress(null);

    if (successCount > 0) {
      flash(`${successCount} file berhasil diupload`);
      fetchFiles(currentParentId);
      refreshUser(); // update storage_used di sidebar
    }
    if (errorMsg) flash(errorMsg, "error");
  };

  // ─── Folder handlers ──────────────────────────────────────────────────────
  const handleFolderOpen = (folder: ApiFolderItem) => {
    setFolderStack((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setActiveSection("files");
  };

  const handleBreadcrumbNavigate = (index: number) => {
    setFolderStack((prev) => index < 0 ? [] : prev.slice(0, index + 1));
  };

  const handleFolderCreated    = (f: ApiFolderItem) => { setApiFolders(prev => [...prev, f]); setFoldersTotal(prev => prev + 1); };
  const handleFolderRenamed    = (f: ApiFolderItem) => setApiFolders(prev => prev.map(x => x.id === f.id ? f : x));
  const handleFolderTrashed    = (id: number)       => { setApiFolders(prev => prev.filter(x => x.id !== id)); setFoldersTotal(prev => Math.max(0, prev - 1)); };
  const handleFolderStarToggled = (f: ApiFolderItem) => setApiFolders(prev => prev.map(x => x.id === f.id ? f : x));

  const newFolderFromSidebar = () => { selectSection("files"); setShowCreateFolder(true); };

  // Upload dari mobile bottom nav: pindah ke section files dulu biar user tau
  // file tersimpan di mana, baru trigger file picker
  const uploadFromMobile = () => {
    selectSection("files");
    // Beri sedikit jeda supaya section render dulu sebelum dialog file terbuka
    setTimeout(() => fileInput.current?.click(), 80);
  };

  // ─── Note handlers ────────────────────────────────────────────────────────
  const newNote = () => {
    selectSection("notes");
  };

  // ─── User handlers ────────────────────────────────────────────────────────
  const toggleUserStatus = async (id: number) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const newStatus = user.status === "Active" ? "inactive" : "active";
    const res = await api.setUserStatus(id, newStatus);
    if (res.success) { flash(`${user.name} ${newStatus === "inactive" ? "dinonaktifkan" : "diaktifkan"}`); fetchUsers(); }
    else flash(res.error?.message ?? "Gagal mengubah status", "error");
    setOpenUserMenuId(null);
  };

  const deleteUser = async (id: number) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    setDeletingUser(user);
    setOpenUserMenuId(null);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;
    const res = await api.deleteUser(deletingUser.id);
    if (res.success) { flash(`${deletingUser.name} dihapus`); fetchUsers(); }
    else flash(res.error?.message ?? "Gagal menghapus user", "error");
    setDeletingUser(null);
  };

  const resetPassword = async (id: number) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    setResetPasswordUser(user);
    setOpenUserMenuId(null);
  };

  const confirmResetPassword = async (userId: number, newPassword: string) => {
    const res = await api.resetPassword(userId, newPassword);
    if (res.success) {
      flash(`Password ${resetPasswordUser?.name} berhasil direset`);
      setResetPasswordUser(null);
    } else {
      throw new Error(res.error?.message ?? "Gagal reset password");
    }
  };

  // ─── Filtered data ────────────────────────────────────────────────────────
  const visibleFiles = useMemo(() =>
    apiFiles.filter(f => f.name.toLowerCase().includes(query.toLowerCase())),
    [apiFiles, query]
  );

  const visibleFolders = useMemo(() =>
    apiFolders.filter(f => f.name.toLowerCase().includes(query.toLowerCase())),
    [apiFolders, query]
  );

  const visibleUsers = users.filter(u =>
    `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase())
  );

  const headerCount =
    activeSection === "users"     ? visibleUsers.length :
    activeSection === "files"     ? visibleFolders.length + visibleFiles.length :
    visibleFiles.length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground lg:flex">
        {/* Hidden file input */}
        <input
          ref={fileInput}
          type="file"
          multiple
          className="hidden"
          onChange={e => { onUpload(e.target.files); e.target.value = ""; }}
        />

        <DashboardSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeSection={activeSection}
          onSectionChange={selectSection}
          onFileUpload={() => fileInput.current?.click()}
          onFolderCreate={newFolderFromSidebar}
          onNoteCreate={newNote}
          userRole={authUser?.role}
          storageUsed={Number(authUser?.storage_used ?? 0)}
          storageQuota={Number(authUser?.storage_quota ?? 0)}
        />


        {/* Mobile bottom navigation — hidden on lg+ */}
        <MobileBottomNav
          activeSection={activeSection}
          onSectionChange={selectSection}
          onFileUpload={uploadFromMobile}
          onFolderCreate={newFolderFromSidebar}
          onNoteCreate={newNote}
          userRole={authUser?.role}
        />

        <main className="min-w-0 flex-1 pb-22 lg:pb-0">
          <DashboardHeader
            query={query}
            onQueryChange={setQuery}
            activeSection={activeSection}
            onSectionChange={selectSection}
            onSidebarToggle={() => setSidebarOpen(true)}
            onFlash={flash}
            onFolderSelect={(folder) => {
              // Buka folder yang dipilih dari search result
              handleFolderOpen(folder);
            }}
            onFileSelect={(file) => {
              // Buka preview file yang dipilih dari search result
              setSearchPreviewFile(file);
            }}
          />

          {/* Upload progress bar */}
          {uploadProgress !== null && (
            <div className="sticky top-0 z-40 border-b-2 border-ink bg-lime px-4 py-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">Mengupload... {uploadProgress}%</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full border border-ink bg-card">
                  <div
                    className="h-full bg-ink transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mx-auto max-w-[1500px] p-4 md:p-8">

            {/* Home */}
            {activeSection === "home" && (
              <HomeSection
                folders={apiFolders}
                foldersLoading={foldersLoading}
                foldersTotal={foldersTotal}
                filesTotal={filesTotal}
                onSectionChange={selectSection}
                onFolderOpen={handleFolderOpen}
                onFolderCreate={() => { selectSection("files"); setShowCreateFolder(true); }}
                onFolderRenamed={handleFolderRenamed}
                onFolderTrashed={handleFolderTrashed}
                onFolderStarToggled={handleFolderStarToggled}
                onFlash={flash}
              />
            )}

            {/* Files */}
            {activeSection === "files" && (
              <>
                <SectionHeader section="files" count={headerCount} />
                <FolderSection
                  folders={visibleFolders}
                  loading={foldersLoading}
                  currentParentId={currentParentId}
                  breadcrumb={folderStack}
                  onBreadcrumbNavigate={handleBreadcrumbNavigate}
                  onFolderOpen={handleFolderOpen}
                  onFolderCreated={handleFolderCreated}
                  onFolderRenamed={handleFolderRenamed}
                  onFolderTrashed={handleFolderTrashed}
                  onFolderStarToggled={handleFolderStarToggled}
                  onFlash={flash}
                  forceShowCreate={showCreateFolder}
                  onCreateDialogClosed={() => setShowCreateFolder(false)}
                  onUploadClick={() => fileInput.current?.click()}
                  foldersTotal={foldersTotal}
                  loadingMore={foldersLoadingMore}
                  onLoadMore={() => loadMoreFolders(currentParentId, foldersPage + 1)}
                />
                <div className="mt-6">
                  <h2 className="mb-3 font-display text-xl font-bold">
                    File
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({filesTotal})
                    </span>
                  </h2>
                  <FilesSection
                    files={visibleFiles}
                    loading={filesLoading}
                    filesTotal={filesTotal}
                    loadingMore={filesLoadingMore}
                    onLoadMore={() => loadMoreFiles(currentParentId, filesPage + 1)}
                    onFilesChanged={() => fetchFiles(currentParentId)}
                    onFlash={flash}
                    onUploadClick={() => fileInput.current?.click()}
                    onFileDrop={(fileList) => onUpload(fileList)}
                  />
                </div>
              </>
            )}

            {/* Favorites */}
            {activeSection === "favorites" && (
              <>
                <SectionHeader section="favorites" />
                <FavoritesSection
                  onFolderOpen={(folder) => {
                    handleFolderOpen(folder as any);
                  }}
                  onFlash={flash}
                />
              </>
            )}

            {/* Recent */}
            {activeSection === "recent" && (
              <>
                <SectionHeader section="recent" />
                <RecentSection onFlash={flash} />
              </>
            )}

            {/* Trash */}
            {activeSection === "trash" && (
              <>
                <SectionHeader section="trash" />
                <TrashSection
                  onFlash={flash}
                  onStorageChanged={refreshUser}
                />
              </>
            )}

            {/* Notes */}
            {activeSection === "notes" && (
              <>
                <SectionHeader section="notes" />
                <NotesSection onFlash={flash} />
              </>
            )}

            {/* Users */}
            {activeSection === "users" && (
              <>
                <SectionHeader section="users" count={visibleUsers.length} />
                <UsersSection
                  users={visibleUsers}
                  isLoading={usersLoading}
                  openUserMenuId={openUserMenuId}
                  onUserMenuToggle={setOpenUserMenuId}
                  onUserAdd={() => setShowAddUserDialog(true)}
                  onUserEdit={setEditingUser}
                  onUserView={setViewingUser}
                  onUserPermissions={setPermissionsUser}
                  onUserStorage={setStorageUser}
                  onUserToggle={toggleUserStatus}
                  onUserDelete={deleteUser}
                  onPasswordReset={resetPassword}
                />
              </>
            )}

            {activeSection === "settings" && <SettingsSection />}
            {activeSection === "storage"  && <StorageSection />}
          </div>
        </main>

        {/* ─── Dialogs ───────────────────────────────────────────────────── */}
        {showAddUserDialog && (
          <AddUserDialog
            onClose={() => setShowAddUserDialog(false)}
            onAdd={async ({ name, email, password, role, storageQuota }) => {
              const res = await api.createUser({ name, email, password, role: role.toUpperCase(), storage_quota: gbToBytes(storageQuota) });
              if (res.success) { flash(`User ${name} berhasil ditambahkan`); setShowAddUserDialog(false); fetchUsers(); }
              else flash(res.error?.message ?? "Gagal membuat user");
            }}
          />
        )}

        {editingUser && (
          <EditUserDialog
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={async ({ name, email, role, status }) => {
              const res = await api.updateUser(editingUser.id, { name, email, role: role.toUpperCase() });
              if (res.success && status !== editingUser.status) {
                await api.setUserStatus(editingUser.id, status === "Active" ? "active" : "inactive");
              }
              if (res.success) { flash(`User ${name} berhasil diupdate`); setEditingUser(null); fetchUsers(); }
              else flash(res.error?.message ?? "Gagal update user");
            }}
          />
        )}

        {storageUser && (
          <StorageQuotaDialog
            user={storageUser}
            onClose={() => setStorageUser(null)}
            onSave={async (userId, newQuotaGb) => {
              const res = await api.updateStorageQuota(userId, gbToBytes(newQuotaGb));
              if (res.success) {
                flash(`Storage quota ${storageUser.name} berhasil diupdate`);
                setStorageUser(null);
                fetchUsers();
                // Kalau yang diubah adalah akun sendiri, update sidebar juga
                if (userId === authUser?.id) refreshUser();
              }
              else flash(res.error?.message ?? "Gagal update quota");
            }}
          />
        )}

        {viewingUser && (
          <ViewUserDetailsDialog
            user={viewingUser}
            onClose={() => setViewingUser(null)}
            onEditUser={u => { setViewingUser(null); setEditingUser(u); }}
            onManagePermissions={u => { setViewingUser(null); setPermissionsUser(u); }}
          />
        )}

        {permissionsUser && (
          <ManagePermissionsDialog
            user={permissionsUser}
            onClose={() => setPermissionsUser(null)}
            onSave={async () => {
              flash(`Izin ${permissionsUser.name} berhasil diupdate`);
              setPermissionsUser(null);
              // Refresh permissions di context kalau yang diubah adalah user sendiri
              if (permissionsUser.id === authUser?.id) {
                await refreshPermissions();
              }
            }}
          />
        )}

        {/* Konfirmasi hapus user */}
        {deletingUser && (
          <ConfirmDialog
            title="Hapus Pengguna"
            message={`Akun "${deletingUser.name}" akan dihapus permanen. Semua data milik user ini tetap ada di sistem. Tindakan ini tidak bisa dibatalkan.`}
            confirmLabel="Ya, Hapus"
            variant="destructive"
            onConfirm={confirmDeleteUser}
            onCancel={() => setDeletingUser(null)}
          />
        )}

        {/* Reset password */}
        {resetPasswordUser && (
          <ResetPasswordDialog
            user={resetPasswordUser}
            onClose={() => setResetPasswordUser(null)}
            onReset={confirmResetPassword}
          />
        )}

        <ToastContainer toasts={toasts} onDismiss={dismiss} />

        {/* Preview file dari hasil search */}
        {searchPreviewFile && (
          <FilePreviewDialog
            file={searchPreviewFile}
            onClose={() => setSearchPreviewFile(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// ─── Section header helper ────────────────────────────────────────────────────
function SectionHeader({ section, count }: { section: Section; count?: number }) {
  const copy = sectionCopy[section as Exclude<Section, "home">];
  if (!copy) return null;
  return (
    <section className="border-b-2 border-ink pb-7">
      <p className="text-sm font-bold uppercase text-muted-foreground">{copy.eyebrow}</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold md:text-5xl">{copy.title}</h1>
          <p className="mt-2 font-medium text-muted-foreground">{copy.description}</p>
        </div>
        {count !== undefined && (
          <span className="rounded-ui border-2 border-ink bg-sun px-4 py-2 font-bold shadow-brutal-sm">
            {count} item
          </span>
        )}
      </div>
    </section>
  );
}
