/**
 * API Client for MewDrive Backend
 * Base URL: http://localhost:3001/api
 */

const API_BASE_URL = import.meta.env['VITE_API_URL'] || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    storage_quota?: string | number;
    storage_used?: string | number;
  };
  token: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  storage_quota: string;
  storage_used: string;
  status: string;
  created_at: string;
  last_login_at: string | null;
}

export interface Role {
  id: number;
  name: string;
  created_at: string;
}

export interface GetUsersParams {
  status?: 'active' | 'inactive';
  role?: 'ADMIN' | 'USER';
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetUsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
  storage_quota?: number;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
}

export interface Permission {
  id: number;
  name: string;
  label: string;
  description: string;
  category: 'files' | 'sharing' | 'admin';
}

// ─── Folder & File types ──────────────────────────────────────────────────────

export interface Folder {
  id: number;
  user_id: number;
  parent_id: number | null;
  name: string;
  color: string;
  is_starred: boolean;
  is_trashed: boolean;
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileItem {
  id: number;
  user_id: number;
  folder_id: number | null;
  name: string;
  original_name: string;
  mime_type: string;
  extension: string;
  size: number;
  storage_path: string;
  is_starred: boolean;
  is_trashed: boolean;
  trashed_at: string | null;
  last_accessed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface FilesPage {
  files: FileItem[];
  total: number;
}

export interface FoldersPage {
  folders: Folder[];
  total: number;
}

export interface BulkRestoreResult {
  restored: FileItem[] | Folder[];
  failed: { id: number; reason: string }[];
}

export interface CreateFolderRequest {
  name: string;
  parent_id?: number | null;
  color?: string;
  icon?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  color?: string;
  icon?: string;
  is_starred?: boolean;
}

export interface UpdateFileRequest {
  name?: string;
  is_starred?: boolean;
}

export interface MoveFolderRequest {
  /** ID folder tujuan. null = pindah ke root */
  target_parent_id: number | null;
}

export interface MoveFileRequest {
  /** ID folder tujuan. null = pindah ke root */
  target_folder_id: number | null;
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export interface NoteItem {
  id: number;
  user_id: number;
  title: string;
  body: string;
  color: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotesPage {
  notes: NoteItem[];
  total: number;
}

export interface CreateNoteRequest {
  title?: string;
  body?: string;
  color?: string;
  is_pinned?: boolean;
}

export interface UpdateNoteRequest {
  title?: string;
  body?: string;
  color?: string;
  is_pinned?: boolean;
}

// ─── Share Link ───────────────────────────────────────────────────────────────

export interface ShareLink {
  id: number;
  token: string;
  file_id: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  /** Tersedia di listShareLinks (JOIN ke files) */
  name?: string;
  extension?: string;
  size?: number;
  mime_type?: string;
}

export interface CreateShareLinkRequest {
  file_id: number;
  /** ISO date string, null = tidak ada expiry */
  expires_at?: string | null;
}

export interface PublicShareInfo {
  token: string;
  file_id: number;
  name: string;
  original_name: string;
  mime_type: string;
  extension: string;
  size: number;
  expires_at: string | null;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  folders: Folder[];
  files: FileItem[];
  total: number;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export interface StorageBreakdownItem {
  category: string;
  file_count: number;
  total_size: number;
  pct: number;
}

export interface StorageInfo {
  storage_used: number;
  storage_quota: number;
  storage_free: number;
  pct_used: number;
  breakdown: StorageBreakdownItem[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('mewdrive_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || {
            code: 'UNKNOWN_ERROR',
            message: 'An error occurred',
          },
        };
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to server',
        },
      };
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me', {
      method: 'GET',
    });
  }

  async logout(): Promise<ApiResponse<null>> {
    return this.request<null>('/auth/logout', {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ message: string; timestamp: string }>> {
    return this.request<{ message: string; timestamp: string }>('/health', {
      method: 'GET',
    });
  }

  // ─── User Management ────────────────────────────────────────────────────────

  async getUsers(params: GetUsersParams = {}): Promise<ApiResponse<GetUsersResponse>> {
    const qs = new URLSearchParams();
    if (params.status)  qs.set('status', params.status);
    if (params.role)    qs.set('role', params.role);
    if (params.search)  qs.set('search', params.search);
    if (params.page)    qs.set('page', String(params.page));
    if (params.limit)   qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return this.request<GetUsersResponse>(`/users${query}`);
  }

  async getUser(id: number): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}`);
  }

  async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: UpdateUserRequest): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async setUserStatus(id: number, status: 'active' | 'inactive'): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateStorageQuota(id: number, storage_quota: number): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}/storage-quota`, {
      method: 'PATCH',
      body: JSON.stringify({ storage_quota }),
    });
  }

  async resetPassword(id: number, new_password: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password }),
    });
  }

  async deleteUser(id: number): Promise<ApiResponse<{ id: number; name: string; email: string }>> {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // ─── Roles ──────────────────────────────────────────────────────────────────

  async getRoles(): Promise<ApiResponse<Role[]>> {
    return this.request<Role[]>('/roles');
  }

  // ─── Permissions ─────────────────────────────────────────────────────────────

  async getAllPermissions(): Promise<ApiResponse<Permission[]>> {
    return this.request<Permission[]>('/permissions');
  }

  async getUserPermissions(userId: number): Promise<ApiResponse<Permission[]>> {
    return this.request<Permission[]>(`/users/${userId}/permissions`);
  }

  async setUserPermissions(userId: number, permissions: string[]): Promise<ApiResponse<Permission[]>> {
    return this.request<Permission[]>(`/users/${userId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  }

  // ─── Folders ──────────────────────────────────────────────────────────────────

  async getFolders(parentId?: number | null, params?: PaginationParams): Promise<ApiResponse<FoldersPage>> {
    const qs = new URLSearchParams();
    if (parentId != null) qs.set('parent_id', String(parentId));
    if (params?.page)  qs.set('page',  String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const q = qs.toString() ? `?${qs.toString()}` : '';
    return this.request<FoldersPage>(`/folders${q}`);
  }

  async getFolderTrash(params?: PaginationParams): Promise<ApiResponse<FoldersPage>> {
    const qs = new URLSearchParams();
    if (params?.page)  qs.set('page',  String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const q = qs.toString() ? `?${qs.toString()}` : '';
    return this.request<FoldersPage>(`/folders/trash${q}`);
  }

  async getFolderStarred(params?: PaginationParams): Promise<ApiResponse<FoldersPage>> {
    const qs = new URLSearchParams();
    if (params?.page)  qs.set('page',  String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const q = qs.toString() ? `?${qs.toString()}` : '';
    return this.request<FoldersPage>(`/folders/starred${q}`);
  }

  async getFolder(id: number): Promise<ApiResponse<Folder>> {
    return this.request<Folder>(`/folders/${id}`);
  }

  async createFolder(data: CreateFolderRequest): Promise<ApiResponse<Folder>> {
    return this.request<Folder>('/folders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFolder(id: number, data: UpdateFolderRequest): Promise<ApiResponse<Folder>> {
    return this.request<Folder>(`/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async trashFolder(id: number): Promise<ApiResponse<Folder>> {
    return this.request<Folder>(`/folders/${id}`, { method: 'DELETE' });
  }

  async restoreFolder(id: number): Promise<ApiResponse<Folder>> {
    return this.request<Folder>(`/folders/${id}/restore`, { method: 'POST' });
  }

  async deleteFolderPermanent(id: number): Promise<ApiResponse<{ id: number; name: string }>> {
    return this.request(`/folders/${id}/permanent`, { method: 'DELETE' });
  }

  async moveFolder(id: number, targetParentId: number | null): Promise<ApiResponse<Folder>> {
    return this.request<Folder>(`/folders/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ target_parent_id: targetParentId }),
    });
  }

  // ─── Files ────────────────────────────────────────────────────────────────────

  async getFiles(folderId?: number | null, params?: PaginationParams): Promise<ApiResponse<FilesPage>> {
    const qs = new URLSearchParams();
    if (folderId != null) qs.set('folder_id', String(folderId));
    if (params?.page)  qs.set('page',  String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const q = qs.toString() ? `?${qs.toString()}` : '';
    return this.request<FilesPage>(`/files${q}`);
  }

  async getFileTrash(params?: PaginationParams): Promise<ApiResponse<FilesPage>> {
    const qs = new URLSearchParams();
    if (params?.page)  qs.set('page',  String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const q = qs.toString() ? `?${qs.toString()}` : '';
    return this.request<FilesPage>(`/files/trash${q}`);
  }

  async getFileStarred(params?: PaginationParams): Promise<ApiResponse<FilesPage>> {
    const qs = new URLSearchParams();
    if (params?.page)  qs.set('page',  String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const q = qs.toString() ? `?${qs.toString()}` : '';
    return this.request<FilesPage>(`/files/starred${q}`);
  }

  async getFileRecent(limit = 20): Promise<ApiResponse<FilesPage>> {
    return this.request<FilesPage>(`/files/recent?limit=${limit}`);
  }

  async getFile(id: number): Promise<ApiResponse<FileItem>> {
    return this.request<FileItem>(`/files/${id}`);
  }

  async updateFile(id: number, data: UpdateFileRequest): Promise<ApiResponse<FileItem>> {
    return this.request<FileItem>(`/files/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async trashFile(id: number): Promise<ApiResponse<FileItem>> {
    return this.request<FileItem>(`/files/${id}`, { method: 'DELETE' });
  }

  async restoreFile(id: number): Promise<ApiResponse<FileItem>> {
    return this.request<FileItem>(`/files/${id}/restore`, { method: 'POST' });
  }

  async deleteFilePermanent(id: number): Promise<ApiResponse<{ id: number; name: string }>> {
    return this.request(`/files/${id}/permanent`, { method: 'DELETE' });
  }

  async moveFile(id: number, targetFolderId: number | null): Promise<ApiResponse<FileItem>> {
    return this.request<FileItem>(`/files/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ target_folder_id: targetFolderId }),
    });
  }

  async emptyTrash(): Promise<ApiResponse<{ deleted: number; freed: number }>> {
    return this.request('/files/trash/empty', { method: 'DELETE' });
  }

  async bulkRestoreFiles(ids: number[]): Promise<ApiResponse<BulkRestoreResult>> {
    return this.request<BulkRestoreResult>('/files/trash/bulk-restore', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  async bulkRestoreFolders(ids: number[]): Promise<ApiResponse<BulkRestoreResult>> {
    return this.request<BulkRestoreResult>('/folders/trash/bulk-restore', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  // ─── Search ───────────────────────────────────────────────────────────────────

  /**
   * Cari file & folder berdasarkan keyword.
   * Menerima optional AbortSignal untuk membatalkan request lama saat user terus mengetik.
   */
  async search(q: string, signal?: AbortSignal): Promise<ApiResponse<SearchResult>> {
    const token = this.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(
        `${this.baseUrl}/search?q=${encodeURIComponent(q)}`,
        { headers, signal: signal ?? null }
      );
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || { code: 'UNKNOWN_ERROR', message: 'An error occurred' } };
      }
      return data;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // Request dibatalkan — bukan error sesungguhnya, abaikan saja
        return { success: false, error: { code: 'ABORTED', message: 'Request aborted' } };
      }
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Failed to connect to server' } };
    }
  }

  // ─── Storage ──────────────────────────────────────────────────────────────────

  async getStorage(): Promise<ApiResponse<StorageInfo>> {
    return this.request<StorageInfo>('/storage');
  }

  // ─── Download ─────────────────────────────────────────────────────────────────

  getFileDownloadUrl(fileId: number): string {
    const token = this.getToken();
    return `${this.baseUrl}/files/${fileId}/download?token=${token ?? ''}`;
  }

  getFilePreviewUrl(fileId: number): string {
    const token = this.getToken();
    return `${this.baseUrl}/files/${fileId}/preview?token=${token ?? ''}`;
  }

  // ─── Upload ───────────────────────────────────────────────────────────────────

  async uploadFile(
    file: File,
    folderId?: number | null,
    onProgress?: (pct: number) => void
  ): Promise<ApiResponse<FileItem>> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);
    if (folderId != null) formData.append('folder_id', String(folderId));

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.baseUrl}/files/upload`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch {
          resolve({ success: false, error: { code: 'PARSE_ERROR', message: 'Invalid response' } });
        }
      };

      xhr.onerror = () => {
        resolve({ success: false, error: { code: 'NETWORK_ERROR', message: 'Network error during upload' } });
      };

      xhr.send(formData);
    });
  }
  // ─── Notes ───────────────────────────────────────────────────────────────────

  async getNotes(params?: PaginationParams): Promise<ApiResponse<NotesPage>> {
    const qs = new URLSearchParams();
    if (params?.page)  qs.set('page',  String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const q = qs.toString() ? `?${qs.toString()}` : '';
    return this.request<NotesPage>(`/notes${q}`);
  }

  async getNote(id: number): Promise<ApiResponse<NoteItem>> {
    return this.request<NoteItem>(`/notes/${id}`);
  }

  async createNote(data: CreateNoteRequest): Promise<ApiResponse<NoteItem>> {
    return this.request<NoteItem>('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNote(id: number, data: UpdateNoteRequest): Promise<ApiResponse<NoteItem>> {
    return this.request<NoteItem>(`/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: number): Promise<ApiResponse<{ id: number; title: string }>> {
    return this.request(`/notes/${id}`, { method: 'DELETE' });
  }

  // ─── Share Link ───────────────────────────────────────────────────────────────

  async createShareLink(data: CreateShareLinkRequest): Promise<ApiResponse<ShareLink>> {
    return this.request<ShareLink>('/share', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getShareLinks(): Promise<ApiResponse<ShareLink[]>> {
    return this.request<ShareLink[]>('/share');
  }

  async toggleShareLink(id: number, isActive: boolean): Promise<ApiResponse<ShareLink>> {
    return this.request<ShareLink>(`/share/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  async deleteShareLink(id: number): Promise<ApiResponse<{ id: number; token: string }>> {
    return this.request(`/share/${id}`, { method: 'DELETE' });
  }

  /** Public endpoint — tidak butuh token JWT */
  async getPublicShareInfo(token: string): Promise<ApiResponse<PublicShareInfo>> {
    try {
      const response = await fetch(`${this.baseUrl}/share/public/${token}`);
      return await response.json();
    } catch {
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Gagal terhubung ke server' } };
    }
  }

  getPublicShareDownloadUrl(token: string): string {
    return `${this.baseUrl}/share/public/${token}/download`;
  }

  getPublicSharePreviewUrl(token: string): string {
    return `${this.baseUrl}/share/public/${token}/preview`;
  }
}

export const api = new ApiClient(API_BASE_URL);
