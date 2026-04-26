import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const STORE_NAME = import.meta.env.VITE_STORE_NAME ?? 'Kasir POS';

const AppHeader: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="flex items-center justify-between px-3 md:px-4 h-12 md:h-14 bg-blue-800 text-white">
      {/* Kiri: nama toko */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-xl" aria-hidden="true">🏪</span>
        <span className="font-bold text-base md:text-lg tracking-wide truncate">{STORE_NAME}</span>
      </div>

      {/* Kanan: nama user + logout */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="hidden sm:block text-sm font-medium truncate max-w-[120px]">
          {user?.fullName ?? 'Kasir'}
        </span>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-semibold rounded-lg
                     bg-white/20 hover:bg-white/30 transition-colors whitespace-nowrap"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default AppHeader;
