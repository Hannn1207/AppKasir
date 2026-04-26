import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

type AllowedRole = 'admin' | 'kasir';

interface ProtectedRouteProps {
  /** The role required to access this route */
  role: AllowedRole;
  children: React.ReactNode;
}

/**
 * ProtectedRoute — Memeriksa autentikasi dan role dari authStore.
 *
 * - Jika tidak terautentikasi (token null) → redirect ke /login
 * - Jika role admin mencoba akses route kasir → redirect ke /admin/accounts (Req 8.9)
 * - Jika role kasir mencoba akses route admin → redirect ke /kasir/pos (Req 8.10)
 * - Jika role sesuai → render children
 *
 * Requirements: 8.8, 8.9, 8.10
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ role, children }) => {
  const { token, user } = useAuthStore();

  // Belum login → redirect ke halaman login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Sudah login tapi role tidak sesuai
  if (user && user.role !== role) {
    if (user.role === 'admin') {
      // Admin mencoba akses route kasir → redirect ke halaman admin
      return <Navigate to="/admin/accounts" replace />;
    } else {
      // Kasir mencoba akses route admin → redirect ke halaman kasir
      return <Navigate to="/kasir/pos" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
