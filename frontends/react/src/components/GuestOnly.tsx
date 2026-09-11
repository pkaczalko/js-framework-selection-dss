import { Navigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import type { ReactNode } from 'react';

export function GuestOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
