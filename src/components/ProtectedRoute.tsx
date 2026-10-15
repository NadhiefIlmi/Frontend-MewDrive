/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */

import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';

import loadingCat from '@/assets/loading_cat.gif';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center justify-center p-4">
          <img
            src={loadingCat}
            alt="Loading..."
            className="h-44 w-auto object-contain max-w-[280px] dark:mix-blend-screen dark:invert"
          />
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
