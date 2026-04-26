import React, { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import type { StockHistory, StockItem } from '../../types';

interface StockHistoryPanelProps {
  selectedProduct: StockItem | null;
}

/**
 * Format tanggal/waktu ke format lokal Indonesia.
 */
const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));

/**
 * Panel riwayat perubahan stok untuk produk yang dipilih.
 * Menampilkan riwayat urutan terbaru terlebih dahulu.
 * Requirements: 6.10, 6.11
 */
const StockHistoryPanel: React.FC<StockHistoryPanelProps> = ({ selectedProduct }) => {
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (productId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<StockHistory[]>(`/stock/${productId}/history`);
      setHistory(response.data);
    } catch {
      setError('Gagal memuat riwayat stok. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchHistory(selectedProduct.id);
    } else {
      setHistory([]);
      setError(null);
    }
  }, [selectedProduct, fetchHistory]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header panel */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-base font-semibold text-gray-800">
          Riwayat Stok
          {selectedProduct && (
            <span className="ml-2 text-blue-600">— {selectedProduct.name}</span>
          )}
        </h2>
      </div>

      {/* Konten panel */}
      <div className="p-5">
        {/* Belum ada produk dipilih */}
        {!selectedProduct && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <span className="text-4xl mb-3" aria-hidden="true">📋</span>
            <p className="text-sm">Pilih produk untuk melihat riwayat</p>
          </div>
        )}

        {/* Loading */}
        {selectedProduct && isLoading && (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <svg
              className="animate-spin h-5 w-5 mr-2 text-blue-500"
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
            Memuat riwayat…
          </div>
        )}

        {/* Error */}
        {selectedProduct && !isLoading && error && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Riwayat kosong */}
        {selectedProduct && !isLoading && !error && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <span className="text-3xl mb-2" aria-hidden="true">📭</span>
            <p className="text-sm">Belum ada riwayat stok untuk produk ini.</p>
          </div>
        )}

        {/* Tabel riwayat */}
        {selectedProduct && !isLoading && !error && history.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Waktu
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Jenis
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Jumlah
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Stok Setelah
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {history.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">
                      {formatDateTime(entry.recordedAt)}
                    </td>
                    <td className="px-3 py-2">
                      {entry.changeType === 'addition' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Penambahan
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Pengurangan
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-700 tabular-nums font-medium">
                      {entry.changeType === 'addition' ? '+' : '-'}
                      {entry.quantityChange}
                    </td>
                    <td className="px-3 py-2 text-gray-700 tabular-nums">
                      {entry.stockAfter}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockHistoryPanel;
