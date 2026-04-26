import React, { useState } from 'react';
import type { User } from '../../types';

interface AccountActionsProps {
  account: User;
  onDeactivate: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

/**
 * Tombol aksi untuk satu akun kasir: nonaktifkan dan hapus.
 * Requirements: 8.4, 8.8
 */
const AccountActions: React.FC<AccountActionsProps> = ({
  account,
  onDeactivate,
  onDelete,
}) => {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await onDeactivate(account.id);
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(account.id);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Tombol Nonaktifkan — disabled jika sudah nonaktif */}
      <button
        onClick={handleDeactivate}
        disabled={!account.isActive || isDeactivating}
        title={account.isActive ? 'Nonaktifkan akun' : 'Akun sudah nonaktif'}
        className="px-3 py-1.5 text-xs font-medium rounded-lg border
                   border-yellow-400 text-yellow-700 bg-yellow-50
                   hover:bg-yellow-100 transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isDeactivating ? 'Memproses…' : 'Nonaktifkan'}
      </button>

      {/* Tombol Hapus */}
      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
          title="Hapus akun"
          className="px-3 py-1.5 text-xs font-medium rounded-lg border
                     border-red-400 text-red-700 bg-red-50
                     hover:bg-red-100 transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Hapus
        </button>
      ) : (
        /* Dialog konfirmasi hapus inline */
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-600">Yakin?</span>
          <button
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg
                       bg-red-600 text-white hover:bg-red-700 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isDeleting ? '…' : 'Ya'}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isDeleting}
            className="px-2.5 py-1 text-xs font-medium rounded-lg
                       bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Batal
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountActions;
