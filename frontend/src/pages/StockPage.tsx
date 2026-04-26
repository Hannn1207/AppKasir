import React, { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import type { StockItem } from '../types';
import StockTable from '../components/stock/StockTable';
import StockAddForm from '../components/stock/StockAddForm';
import StockHistoryPanel from '../components/stock/StockHistoryPanel';

type AlertType = 'success' | 'error';

interface Alert {
  type: AlertType;
  message: string;
}

/**
 * Halaman Manajemen Stok Gudang.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.9, 6.10, 6.11
 */
const StockPage: React.FC = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<Alert | null>(null);

  /** Produk yang sedang dipilih (untuk form tambah stok & panel riwayat) */
  const [selectedProduct, setSelectedProduct] = useState<StockItem | null>(null);

  // Auto-dismiss alert setelah 4 detik
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 4000);
    return () => clearTimeout(timer);
  }, [alert]);

  const showAlert = (type: AlertType, message: string) => {
    setAlert({ type, message });
  };

  // Fetch daftar stok dari API (Req 6.1, 6.4)
  const fetchStock = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<StockItem[]>('/stock');
      setStockItems(response.data);
    } catch {
      showAlert('error', 'Gagal memuat data stok. Coba refresh halaman.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  // Handler: klik baris produk di tabel — pilih produk
  const handleSelectProduct = (item: StockItem) => {
    setSelectedProduct((prev) => (prev?.id === item.id ? null : item));
  };

  // Handler: klik tombol "Tambah Stok" di baris tabel
  const handleAddStockClick = (item: StockItem) => {
    setSelectedProduct(item);
    // Scroll ke form tambah stok
    document.getElementById('stock-add-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Handler: stok berhasil ditambahkan (Req 6.2, 6.3)
  const handleStockAdded = (updatedProduct: StockItem) => {
    // Perbarui daftar stok dengan data terbaru dari server
    setStockItems((prev) =>
      prev.map((item) =>
        item.id === updatedProduct.id
          ? {
              ...updatedProduct,
              // Hitung ulang flag berdasarkan data terbaru
              isLowStock: updatedProduct.stockQuantity <= 5,
              isOverCapacity:
                updatedProduct.maxCapacity > 0 &&
                updatedProduct.stockQuantity >= updatedProduct.maxCapacity,
            }
          : item
      )
    );

    // Perbarui selectedProduct jika produk yang diperbarui sedang dipilih
    if (selectedProduct?.id === updatedProduct.id) {
      setSelectedProduct({
        ...updatedProduct,
        isLowStock: updatedProduct.stockQuantity <= 5,
        isOverCapacity:
          updatedProduct.maxCapacity > 0 &&
          updatedProduct.stockQuantity >= updatedProduct.maxCapacity,
      });
    }

    showAlert(
      'success',
      `Stok "${updatedProduct.name}" berhasil ditambahkan. Stok saat ini: ${updatedProduct.stockQuantity}.`
    );

    // Refresh data stok untuk mendapatkan lastAddedAt terbaru
    fetchStock();
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Judul halaman */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Stok Gudang</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pantau dan kelola stok produk di gudang.
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

        {/* Form tambah stok */}
        <div id="stock-add-form" className="mb-6">
          <StockAddForm
            selectedProduct={selectedProduct}
            allProducts={stockItems}
            onStockAdded={handleStockAdded}
            onProductSelect={setSelectedProduct}
          />
        </div>

        {/* Tabel stok produk */}
        <div className="mb-6">
          <StockTable
            items={stockItems}
            isLoading={isLoading}
            selectedProductId={selectedProduct?.id ?? null}
            onSelectProduct={handleSelectProduct}
            onAddStock={handleAddStockClick}
          />
        </div>

        {/* Panel riwayat stok */}
        <StockHistoryPanel selectedProduct={selectedProduct} />
      </main>
  );
};

export default StockPage;
