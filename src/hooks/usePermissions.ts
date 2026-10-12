/**
 * usePermissions hook
 * Ambil permission user yang sedang login dari API dan cache di memory.
 * Dipanggil sekali saat mount, refresh otomatis kalau userId berubah.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export type PermissionName =
  | 'create_files'
  | 'view_files'
  | 'edit_files'
  | 'delete_files'
  | 'download_files'
  | 'share_files'
  | 'manage_users'
  | 'storage_management';

interface UsePermissionsReturn {
  /** Set nama permission yang dimiliki user */
  permissions: Set<PermissionName>;
  /** true selama fetch pertama belum selesai */
  loading: boolean;
  /** Cek apakah user punya permission tertentu */
  can: (permission: PermissionName) => boolean;
  /** Paksa refresh dari server (dipanggil setelah admin ubah permission) */
  refresh: () => Promise<void>;
}

export function usePermissions(userId: number | null | undefined): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<Set<PermissionName>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!userId) {
      setPermissions(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await api.getUserPermissions(userId);
    if (res.success && res.data) {
      setPermissions(new Set(res.data.map(p => p.name as PermissionName)));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const can = useCallback(
    (permission: PermissionName) => permissions.has(permission),
    [permissions]
  );

  return { permissions, loading, can, refresh: fetchPermissions };
}
