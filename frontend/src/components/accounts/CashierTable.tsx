import React from 'react';
import type { User } from '../../types';
import AccountActions from './AccountActions';

interface CashierTableProps {
  accounts: User[];
  isLoading: boolean;
  onDeactivate: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

/**
 * Tabel daftar akun kasir.
 * Kolom: No, Nama Lengkap, Username, Status, Aksi
 * Requirements: 8.1, 8.4, 8.8
 */
const CashierTable: React.FC<CashierTableProps> = ({
  accounts,
  isLoading,
  onDeactivate,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <svg
          className="animate-spin h-6 w-6 mr-2 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        Memuat data…
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <span className="text-4xl mb-3" aria-hidden="true">👤</span>
        <p className="text-sm">Belum ada akun kasir.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12"
            >
              No
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              Nama Lengkap
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              Username
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {accounts.map((account, index) => (
            <tr
              key={account.id}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3 text-gray-500 tabular-nums">
                {index + 1}
              </td>
              <td className="px-4 py-3 font-medium text-gray-800">
                {account.fullName}
              </td>
              <td className="px-4 py-3 text-gray-600 font-mono">
                {account.username}
              </td>
              <td className="px-4 py-3">
                {account.isActive ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                    Nonaktif
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <AccountActions
                  account={account}
                  onDeactivate={onDeactivate}
                  onDelete={onDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CashierTable;
