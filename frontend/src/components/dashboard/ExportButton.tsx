import React, { useState } from 'react';
import { apiClient } from '../../lib/api';
import { exportToExcel } from '../../lib/excelExport';
import type { ExportRow } from '../../lib/excelExport';

interface ExportButtonProps {
  /** Date in YYYY-MM-DD format to export */
  exportDate: string;
  onExportDateChange: (date: string) => void;
}

/**
 * ExportButton — Tombol ekspor Excel dengan date picker.
 * Requirements: 5.11, 5.12, 5.13
 */
const ExportButton: React.FC<ExportButtonProps> = ({ exportDate, onExportDateChange }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!exportDate) {
      setError('Pilih tanggal terlebih dahulu.');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const response = await apiClient.get<ExportRow[]>('/dashboard/export', {
        params: { date: exportDate },
      });

      const rows = response.data;

      if (rows.length === 0) {
        setError('Tidak ada data transaksi pada tanggal tersebut.');
        return;
      }

      exportToExcel(rows, exportDate);
    } catch {
      setError('Gagal mengekspor data. Coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="export-date" className="text-sm font-medium text-gray-600 whitespace-nowrap">
          Ekspor tanggal
        </label>
        <input
          id="export-date"
          type="date"
          value={exportDate}
          onChange={(e) => {
            onExportDateChange(e.target.value);
            setError(null);
          }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white"
        />
      </div>

      <button
        onClick={handleExport}
        disabled={isExporting || !exportDate}
        className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700
                   disabled:bg-gray-300 disabled:cursor-not-allowed
                   text-white text-sm font-semibold rounded-lg transition-colors
                   focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        {isExporting ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Mengekspor...
          </>
        ) : (
          <>
            <span aria-hidden="true">📥</span>
            Ekspor Excel
          </>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
};

export default ExportButton;
