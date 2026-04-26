import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

/**
 * AdminLayout — Layout untuk semua route admin.
 * Menyertakan AppHeader (sticky, 64px) di atas konten halaman.
 * Requirements: 8.9
 */
const AdminLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <AppHeader />
    <Outlet />
  </div>
);

export default AdminLayout;
