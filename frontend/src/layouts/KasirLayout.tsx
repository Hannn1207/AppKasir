import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

const navItems = [
  { to: '/kasir/pos',       label: 'Kasir' ,     },
  { to: '/kasir/menu',      label: 'Menu' ,      },
  { to: '/kasir/stock',     label: 'Stok' ,      },
  { to: '/kasir/dashboard', label: 'Dashboard' , },
];

/**
 * KasirLayout — Sticky header + navbar yang responsif.
 * Desktop: navbar horizontal di bawah header.
 * Mobile: navbar horizontal scrollable dengan icon + label.
 */
const KasirLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    {/* Header sticky */}
    <header className="sticky top-0 z-50 bg-blue-800 text-white shadow-md">
      <AppHeader />

      {/* Navbar — scrollable horizontal di mobile */}
      <nav
        className="flex overflow-x-auto scrollbar-hide px-2 pb-1 gap-1"
        aria-label="Navigasi utama"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {navItems.map(({ to, label,}) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium',
                'rounded-t-lg transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-white text-blue-800'
                  : 'text-white/80 hover:bg-white/20 hover:text-white',
              ].join(' ')
            }
          >
            <span className="text-base" aria-hidden="true"></span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </header>

    {/* Konten halaman */}
    <main className="flex-1 min-h-0">
      <Outlet />
    </main>
  </div>
);

export default KasirLayout;
