import React from 'react';
import type { StockItem } from '../../types';

interface StockTableProps {
  items: StockItem[];
  isLoading: boolean;
  selectedProductId: number | null;
  onSelectProduct: (item: StockItem) => void;
  onAddStock: (item: StockItem) => void;
}

/**
 * Format tanggal/waktu ke format lokal Indonesia.
 * Mengembalikan "Belum ada" jika nilai null/undefined.
 */
const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return 'Belum ada';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

/**
 * Tabel daftar produk dengan informasi stok.
 * Kolom: No, Nama Produk, Stok Saat Ini, Waktu Masuk Terakhir, Status, Aksi
 * Requirements: 6.1, 6.4, 6.6, 6.7
 */
const StockTable: React.FC<StockTableProps> = ({
  items,
  isLoading,
  selectedProductId,
  onSelectProduct,
  onAddStock,
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

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <span className="text-4xl mb-3" aria-hidden="true">📦</span>
        <p className="text-sm">Belum ada produk.</p>
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
              Nama Produk
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              Stok Saat Ini
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              Waktu Masuk Terakhir
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
          {items.map((item, index) => {
            const isSelected = item.id === selectedProductId;
            return (
              <tr
                key={item.id}
                onClick={() => onSelectProduct(item)}
                className={[
                  'cursor-pointer transition-colors',
                  isSelected
                    ? 'bg-blue-50 hover:bg-blue-100'
                    : 'hover:bg-gray-50',
                ].join(' ')}
                aria-selected={isSelected}
              >
                <td className="px-4 py-3 text-gray-500 tabular-nums">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                <td className="px-4 py-3 text-gray-700 tabular-nums font-medium">
                  {item.stockQuantity}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {formatDateTime(item.lastAddedAt)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge item={item} />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddStock(item);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold
                               bg-green-50 text-green-700 hover:bg-green-100
                               transition-colors focus:outline-none focus:ring-2
                               focus:ring-green-500 focus:ring-offset-1 whitespace-nowrap"
                    aria-label={`Tambah stok untuk ${item.name}`}
                  >
                    Tambah Stok
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Badge status stok produk.
 * - Merah "Stok Rendah" jika isLowStock (≤ 5 unit) — Req 6.7
 * - Oranye "Kapasitas Penuh" jika isOverCapacity — Req 6.6
 * - Hijau "Normal" jika keduanya tidak berlaku
 */
const StatusBadge: React.FC<{ item: StockItem }> = ({ item }) => {
  if (item.isLowStock) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        Stok Rendah
      </span>
    );
  }
  if (item.isOverCapacity) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
        Kapasitas Penuh
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      Normal
    </span>
  );
};

export default StockTable;
