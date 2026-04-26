import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '../lib/api';
import type { Product } from '../types';
import ProductTable from '../components/menu/ProductTable';
import ProductForm from '../components/menu/ProductForm';
import SearchBar from '../components/SearchBar';

type AlertType = 'success' | 'error';

interface Alert {
  type: AlertType;
  message: string;
}

/**
 * Halaman Manajemen Menu/Produk.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */
const MenuPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<Alert | null>(null);

  // Pencarian real-time (Req 1.7)
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Dialog konfirmasi hapus
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-dismiss alert setelah 4 detik
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 4000);
    return () => clearTimeout(timer);
  }, [alert]);

  const showAlert = (type: AlertType, message: string) => {
    setAlert({ type, message });
  };

  // Fetch produk dari API (Req 1.1, 1.7)
  const fetchProducts = useCallback(async (search = '') => {
    setIsLoading(true);
    try {
      const params = search.trim() ? { search: search.trim() } : {};
      const response = await apiClient.get<Product[]>('/products', { params });
      setProducts(response.data);
    } catch {
      showAlert('error', 'Gagal memuat daftar produk. Coba refresh halaman.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch awal
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debounce pencarian (Req 1.7)
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchProducts(value);
    }, 300);
  };

  // Cleanup timer saat unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  // Handler: buka form tambah
  const handleAddNew = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  // Handler: buka form edit (Req 1.3)
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  // Handler: tutup form
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  // Handler: produk berhasil disimpan (tambah/edit) (Req 1.2, 1.3)
  const handleProductSaved = (saved: Product) => {
    setProducts((prev) => {
      const exists = prev.find((p) => p.id === saved.id);
      if (exists) {
        return prev.map((p) => (p.id === saved.id ? saved : p));
      }
      return [saved, ...prev];
    });
    setShowForm(false);
    setEditingProduct(null);
    showAlert(
      'success',
      editingProduct
        ? `Produk "${saved.name}" berhasil diperbarui.`
        : `Produk "${saved.name}" berhasil ditambahkan.`
    );
  };

  // Handler: klik tombol hapus — tampilkan konfirmasi (Req 1.4)
  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
  };

  // Handler: konfirmasi hapus (Req 1.4)
  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/products/${deletingProduct.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      showAlert('success', `Produk "${deletingProduct.name}" berhasil dihapus.`);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { error?: string; message?: string } };
      };
      const msg =
        axiosError.response?.data?.error ??
        axiosError.response?.data?.message ??
        'Gagal menghapus produk. Coba lagi.';
      showAlert('error', msg);
    } finally {
      setIsDeleting(false);
      setDeletingProduct(null);
    }
  };

  // Handler: batal hapus
  const handleDeleteCancel = () => {
    setDeletingProduct(null);
  };

  /** Daftar nama produk yang sudah ada (untuk validasi duplikat di ProductForm) */
  const existingProductNames = products.map((p) => p.name);

  return (
    <>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {/* Judul halaman */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Menu</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola daftar produk: tambah, edit, atau hapus produk.
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

        {/* Form tambah / edit produk */}
        {showForm && (
          <div className="mb-6">
            <ProductForm
              editingProduct={editingProduct}
              existingNames={existingProductNames}
              onSaved={handleProductSaved}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        {/* Toolbar: tombol tambah + search bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          {!showForm && (
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                         bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold
                         transition-colors focus:outline-none focus:ring-2
                         focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
            >
              <span aria-hidden="true">+</span>
              Tambah Produk
            </button>
          )}
          <div className="w-full sm:max-w-xs">
            <SearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Tabel produk */}
        <ProductTable
          products={products}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </main>

      {/* Modal konfirmasi hapus (Req 1.4) */}
      {deletingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h2 id="delete-dialog-title" className="text-base font-semibold text-gray-800 mb-2">
              Hapus Produk
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              Apakah Anda yakin ingin menghapus produk{' '}
              <strong>"{deletingProduct.name}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700
                           disabled:bg-red-300 text-white text-sm font-semibold
                           transition-colors focus:outline-none focus:ring-2
                           focus:ring-red-500 focus:ring-offset-2"
              >
                {isDeleting ? 'Menghapus…' : 'Hapus'}
              </button>
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl border border-gray-300 bg-white
                           hover:bg-gray-50 text-gray-700 text-sm font-medium
                           transition-colors focus:outline-none focus:ring-2
                           focus:ring-gray-400 focus:ring-offset-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuPage;
