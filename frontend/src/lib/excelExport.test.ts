import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { exportToExcel, type ExportRow } from './excelExport';

// ── Mock SheetJS ──────────────────────────────────────────────────────────────
vi.mock('xlsx', () => {
  const mockWorksheet = {};
  const mockWorkbook = { SheetNames: [], Sheets: {} };

  return {
    utils: {
      aoa_to_sheet: vi.fn().mockReturnValue(mockWorksheet),
      book_new: vi.fn().mockReturnValue(mockWorkbook),
      book_append_sheet: vi.fn(),
    },
    writeFile: vi.fn(),
  };
});

// ── Sample data ───────────────────────────────────────────────────────────────

const sampleRows: ExportRow[] = [
  {
    namaMenu: 'Kopi Hitam',
    jumlahDibeli: 2,
    totalHarga: 30000,
    namaKasir: 'Kasir Satu',
    namaCustomer: 'Budi',
  },
  {
    namaMenu: 'Teh Manis',
    jumlahDibeli: 1,
    totalHarga: 8000,
    namaKasir: 'Kasir Satu',
    namaCustomer: 'Budi',
  },
  {
    namaMenu: 'Nasi Goreng',
    jumlahDibeli: 3,
    totalHarga: 45000,
    namaKasir: 'Kasir Dua',
    namaCustomer: 'Ani',
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('exportToExcel', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Filename format (Requirement 5.13) ──────────────────────────────────────

  describe('filename format', () => {
    it('generates filename with penjualan- prefix and .xlsx extension (Requirement 5.13)', () => {
      exportToExcel(sampleRows, '2024-06-15');

      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        'penjualan-2024-06-15.xlsx'
      );
    });

    it('uses the provided date in the filename (Requirement 5.13)', () => {
      exportToExcel(sampleRows, '2024-01-01');
      expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'penjualan-2024-01-01.xlsx');

      vi.clearAllMocks();

      exportToExcel(sampleRows, '2025-12-31');
      expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'penjualan-2025-12-31.xlsx');
    });

    it('filename matches pattern penjualan-YYYY-MM-DD.xlsx (Requirement 5.13)', () => {
      exportToExcel(sampleRows, '2024-06-15');

      const [, filename] = vi.mocked(XLSX.writeFile).mock.calls[0];
      expect(filename).toMatch(/^penjualan-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });
  });

  // ── Row structure (Requirement 5.12) ────────────────────────────────────────

  describe('row structure', () => {
    it('creates one data row per ExportRow item (Requirement 5.12)', () => {
      exportToExcel(sampleRows, '2024-06-15');

      const aoaCall = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[0][0] as unknown[][];
      // First row is header, remaining rows are data
      const dataRows = aoaCall.slice(1);
      expect(dataRows).toHaveLength(sampleRows.length);
    });

    it('each data row contains the correct values in order (Requirement 5.12)', () => {
      exportToExcel(sampleRows, '2024-06-15');

      const aoaCall = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[0][0] as unknown[][];
      const dataRows = aoaCall.slice(1);

      expect(dataRows[0]).toEqual(['Kopi Hitam', 2, 30000, 'Kasir Satu', 'Budi']);
      expect(dataRows[1]).toEqual(['Teh Manis', 1, 8000, 'Kasir Satu', 'Budi']);
      expect(dataRows[2]).toEqual(['Nasi Goreng', 3, 45000, 'Kasir Dua', 'Ani']);
    });

    it('handles empty rows array without throwing', () => {
      expect(() => exportToExcel([], '2024-06-15')).not.toThrow();

      const aoaCall = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[0][0] as unknown[][];
      // Only header row
      expect(aoaCall).toHaveLength(1);
    });

    it('preserves numeric types for jumlahDibeli and totalHarga (Requirement 5.12)', () => {
      exportToExcel(sampleRows, '2024-06-15');

      const aoaCall = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[0][0] as unknown[][];
      const firstDataRow = aoaCall[1] as unknown[];
      expect(typeof firstDataRow[1]).toBe('number'); // jumlahDibeli
      expect(typeof firstDataRow[2]).toBe('number'); // totalHarga
    });
  });

  // ── Column headers (Requirement 5.12) ───────────────────────────────────────

  describe('column headers', () => {
    it('first row contains the correct column headers (Requirement 5.12)', () => {
      exportToExcel(sampleRows, '2024-06-15');

      const aoaCall = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[0][0] as unknown[][];
      const headerRow = aoaCall[0];
      expect(headerRow).toEqual([
        'Nama Menu',
        'Jumlah Dibeli',
        'Total Harga',
        'Nama Kasir',
        'Nama Customer',
      ]);
    });

    it('has exactly 5 columns (Requirement 5.12)', () => {
      exportToExcel(sampleRows, '2024-06-15');

      const aoaCall = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[0][0] as unknown[][];
      expect(aoaCall[0]).toHaveLength(5);
    });
  });

  // ── Workbook creation ────────────────────────────────────────────────────────

  it('creates a workbook and appends a sheet named Penjualan', () => {
    exportToExcel(sampleRows, '2024-06-15');

    expect(XLSX.utils.book_new).toHaveBeenCalledOnce();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'Penjualan'
    );
  });

  it('calls writeFile to trigger browser download', () => {
    exportToExcel(sampleRows, '2024-06-15');
    expect(XLSX.writeFile).toHaveBeenCalledOnce();
  });
});
