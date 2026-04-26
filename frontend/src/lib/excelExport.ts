import * as XLSX from 'xlsx';

/**
 * One row in the export spreadsheet — one row per transaction item.
 * Requirements: 5.12
 */
export interface ExportRow {
  namaMenu: string;
  jumlahDibeli: number;
  totalHarga: number;
  namaKasir: string;
  namaCustomer: string;
}

/**
 * Converts an array of ExportRow objects into an .xlsx file and triggers a
 * browser download.
 *
 * Column order: Nama Menu | Jumlah Dibeli | Total Harga | Nama Kasir | Nama Customer
 * Filename format: penjualan-YYYY-MM-DD.xlsx
 *
 * Requirements: 5.11, 5.12, 5.13
 */
export function exportToExcel(rows: ExportRow[], date: string): void {
  // Build worksheet data: header row followed by data rows
  const worksheetData = [
    ['Nama Menu', 'Jumlah Dibeli', 'Total Harga', 'Nama Kasir', 'Nama Customer'],
    ...rows.map((row) => [
      row.namaMenu,
      row.jumlahDibeli,
      row.totalHarga,
      row.namaKasir,
      row.namaCustomer,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Penjualan');

  // Filename: penjualan-YYYY-MM-DD.xlsx (Requirement 5.13)
  const filename = `penjualan-${date}.xlsx`;

  XLSX.writeFile(workbook, filename);
}
