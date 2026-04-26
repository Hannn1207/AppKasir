import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

import KasirLayout from './layouts/KasirLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import AccountsPage from './pages/AccountsPage';
import POSPage from './pages/POSPage';
import MenuPage from './pages/MenuPage';
import StockPage from './pages/StockPage';
import DashboardPage from './pages/DashboardPage';

/**
 * RootRedirect — Redirect dari "/" berdasarkan status login dan role.
 * - Belum login → /login
 * - Admin → /admin/accounts
 * - Kasir → /kasir/pos
 */
const RootRedirect: React.FC = () => {
  const { token, user } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/accounts" replace />;
  return <Navigate to="/kasir/pos" replace />;
};

/**
 * App — Root komponen dengan definisi semua routes.
 * Requirements: 8.8, 8.9, 8.10
 */
const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Halaman login (public) */}
      <Route path="/login" element={<LoginPage />} />

      {/* Route admin — hanya role admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="accounts" element={<AccountsPage />} />
        {/* Redirect /admin ke /admin/accounts */}
        <Route index element={<Navigate to="/admin/accounts" replace />} />
      </Route>

      {/* Route kasir — hanya role kasir */}
      <Route
        path="/kasir"
        element={
          <ProtectedRoute role="kasir">
            <KasirLayout />
          </ProtectedRoute>
        }
      >
        <Route path="pos" element={<POSPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        {/* Redirect /kasir ke /kasir/pos */}
        <Route index element={<Navigate to="/kasir/pos" replace />} />
      </Route>

      {/* Fallback — redirect semua route tidak dikenal ke root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
