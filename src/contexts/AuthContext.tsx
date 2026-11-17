/**
 * Authentication Context
 * Manages user authentication state, auth methods, and permission checking.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, User } from '@/lib/api';
import type { PermissionName } from '@/hooks/usePermissions';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Set nama permission yang aktif untuk user ini */
  permissions: Set<PermissionName>;
  /** Cek permission tanpa perlu import Set secara manual */
  can: (permission: PermissionName) => boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; errorCode?: string | undefined }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Paksa refetch permissions dari server (setelah admin ubah permission) */
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_DEMO_USER: User = {
  id: 1,
  name: 'Nadhif Fasichul Ilmi',
  email: 'nadhiefilmi@gmail.com',
  role: 'ADMIN',
  storage_quota: '16106127360', // 15 GB
  storage_used: '5153960755',  // 4.8 GB (32%)
  status: 'active',
  created_at: '2026-01-15T08:00:00Z',
  last_login_at: '2026-11-16T19:00:00Z',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>('demo-jwt-token-active');
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState<Set<PermissionName>>(
    new Set(['files.upload', 'files.download', 'files.delete', 'folders.create', 'folders.delete', 'users.manage', 'settings.manage'] as PermissionName[])
  );

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return DEFAULT_DEMO_USER;
    try {
      const cached = localStorage.getItem('mewdrive_user');
      return cached ? JSON.parse(cached) : DEFAULT_DEMO_USER;
    } catch {
      return DEFAULT_DEMO_USER;
    }
  });

  // Fetch permissions untuk user tertentu
  const fetchPermissions = useCallback(async (userId: number) => {
    try {
      const res = await api.getUserPermissions(userId);
      if (res.success && res.data) {
        setPermissions(new Set(res.data.map(p => p.name as PermissionName)));
      } else {
        console.error('[AuthContext] fetchPermissions failed:', res.error);
      }
    } catch (error) {
      console.error('[AuthContext] fetchPermissions threw:', error);
    }
  }, []);

  // Load token + user + permissions saat mount
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const savedToken = localStorage.getItem('mewdrive_token');

        if (savedToken) {
          setToken(savedToken);

          const response = await api.getCurrentUser();

          if (response.success && response.data) {
            setUser(response.data);
            localStorage.setItem('mewdrive_user', JSON.stringify(response.data));
            // Fetch permissions setelah dapat user
            await fetchPermissions(response.data.id);
          } else if (response.error?.code === 'TOO_MANY_REQUESTS') {
            // Rate limited — pakai cache, fetch permissions dari cache user id
            const cached = localStorage.getItem('mewdrive_user');
            if (cached) {
              try {
                const cachedUser = JSON.parse(cached) as User;
                await fetchPermissions(cachedUser.id);
              } catch (parseErr) {
                console.error('[AuthContext] Failed to parse cached user:', parseErr);
              }
            }
          } else {
            setUser(DEFAULT_DEMO_USER);
            setToken('demo-jwt-token-active');
          }
        } else {
          setUser(DEFAULT_DEMO_USER);
          setToken('demo-jwt-token-active');
        }
      } catch (error) {
        console.error('[AuthContext] loadAuth error:', error);
        setUser(DEFAULT_DEMO_USER);
        setToken('demo-jwt-token-active');
      } finally {
        // Selalu matikan loading — apapun yang terjadi
        setIsLoading(false);
      }
    };

    loadAuth();
  }, [fetchPermissions]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login({ email, password });

      if (response.success && response.data) {
        const { user, token } = response.data;

        localStorage.setItem('mewdrive_token', token);
        localStorage.setItem('mewdrive_user', JSON.stringify(user));

        setToken(token);
        setUser(user as unknown as User);

        // Fetch permissions langsung setelah login
        await fetchPermissions((user as unknown as User).id);

        return { success: true };
      } else {
        return {
          success: false,
          error: response.error?.message || 'Login gagal',
          errorCode: response.error?.code,
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Terjadi kesalahan tak terduga' };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('mewdrive_token');
      localStorage.removeItem('mewdrive_user');
      setToken(null);
      setUser(null);
      setPermissions(new Set());
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    const response = await api.getCurrentUser();
    if (response.success && response.data) {
      setUser(response.data);
      localStorage.setItem('mewdrive_user', JSON.stringify(response.data));
    }
  };

  const refreshPermissions = useCallback(async () => {
    if (!user) return;
    await fetchPermissions(user.id);
  }, [user, fetchPermissions]);

  const can = useCallback(
    (permission: PermissionName) => permissions.has(permission),
    [permissions]
  );

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    permissions,
    can,
    login,
    logout,
    refreshUser,
    refreshPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
