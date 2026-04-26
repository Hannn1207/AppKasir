import React, { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import type { User } from '../types';
import CashierTable from '../components/accounts/CashierTable';
import CreateCashierForm from '../components/accounts/CreateCashierForm';

type AlertType = 'success' | 'error';

interface Alert {
  type: AlertType;
  message: string;
}

/**
 * Halaman Manajemen Akun Kasir — hanya dapat diakses oleh admin.
 * Requirements: 8.1, 8.4, 8.8, 8.9
 */
const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<Alert | null>(null);

  // Auto-dismiss alert setelah 4 detik
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 4000);
    return () => clearTimeout(timer);
  }, [alert]);

  const showAlert = (type: AlertType, message: string) => {
    setAlert({ type, message });
  };

  // Fetch daftar akun kasir
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<User[]>('/accounts');
      setAccounts(response.data);
    } catch {
      showAlert('error', 'Gagal memuat daftar akun. Coba refresh halaman.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Handler: akun baru berhasil dibuat
  const handleAccountCreated = (newAccount: User) => {
    setAccounts((prev) => [newAccount, ...prev]);
    showAlert('success', `Akun kasir "${newAccount.fullName}" berhasil dibuat.`);
  };

  // Handler: nonaktifkan akun
  const handleDeactivate = async (id: number) => {
    try {
      const response = await apiClient.put<User>(`/accounts/${id}/deactivate`);
      const updated = response.data;
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === id ? { ...acc, isActive: updated.isActive ?? false } : acc))
      );
      showAlert('success', 'Akun kasir berhasil dinonaktifkan.');
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { error?: string; message?: string } };
      };
      const msg =
        axiosError.response?.data?.error ??
        axiosError.response?.data?.message ??
        'Gagal menonaktifkan akun. Coba lagi.';
      showAlert('error', msg);
    }
  };

  // Handler: hapus akun
  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/accounts/${id}`);
      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
      showAlert('success', 'Akun kasir berhasil dihapus.');
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { error?: string; message?: string } };
      };
      const msg =
        axiosError.response?.data?.error ??
        axiosError.response?.data?.message ??
        'Gagal menghapus akun. Coba lagi.';
      showAlert('error', msg);
    }
  };

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
      {/* Judul halaman */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Akun Kasir</h1>
        <p className="mt-1 text-sm text-gray-500">
          Kelola akun kasir: buat, nonaktifkan, atau hapus akun.
        </p>
      </div>

      {/* Alert sukses / error */}
      {alert && (
        <div
          role="alert"
          className={[
            'mb-5 rounded-xl border px-4 py-3 text-sm font-medium',
            alert.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700',
          ].join(' ')}
        >
          {alert.message}
        </div>
      )}

      {/* Form buat akun kasir baru */}
      <div className="mb-6">
        <CreateCashierForm onCreated={handleAccountCreated} />
      </div>

      {/* Tabel daftar kasir */}
      <CashierTable
        accounts={accounts}
        isLoading={isLoading}
        onDeactivate={handleDeactivate}
        onDelete={handleDelete}
      />
    </main>
  );
};

export default AccountsPage;
