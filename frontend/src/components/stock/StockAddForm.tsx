import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import type { StockItem } from '../../types';

interface StockAddFormProps {
  /** Produk yang dipilih. Jika null, form menampilkan dropdown pemilihan produk. */
  selectedProduct: StockItem | null;
  /** Semua produk tersedia untuk dropdown. */
  allProducts: StockItem[];
  onStockAdded: (updatedProduct: StockItem) => void;
  onProductSelect: (item: StockItem) => void;
}

/**
 * Form penambahan stok produk.
 * Requirements: 6.2, 6.3, 6.9
 */
const StockAddForm: React.FC<StockAddFormProps> = ({
  selectedProduct,
  allProducts,
  onStockAdded,
  onProductSelect,
}) => {
  const [quantity, setQuantity] = useState('');
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form saat produk yang dipilih berubah
  useEffect(() => {
    setQuantity('');
    setQuantityError(null);
    setServerError(null);
  }, [selectedProduct?.id]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(e.target.value);
    setQuantityError(null);
    setServerError(null);
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value, 10);
    const found = allProducts.find((p) => p.id === id);
    if (found) onProductSelect(found);
  };

  const validate = (): boolean => {
    const num = Number(quantity);
    if (!quantity.trim()) {
      setQuantityError('Jumlah tambah tidak boleh kosong.');
      return false;
    }
    if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
      setQuantityError('Jumlah tambah harus berupa bilangan bulat lebih dari 0.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!selectedProduct) {
      setServerError('Pilih produk terlebih dahulu.');
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.post<StockItem>(
        `/stock/${selectedProduct.id}/add`,
        { quantity: Number(quantity) }
      );
      onStockAdded(response.data);
      setQuantity('');
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { error?: string; message?: string } };
      };
      const msg =
        axiosError.response?.data?.error ??
        axiosError.response?.data?.message ??
        'Gagal menambah stok. Coba lagi.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    [
      'w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      'disabled:bg-gray-50 disabled:text-gray-400',
      hasError ? 'border-red-400' : 'border-gray-300',
    ].join(' ');

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-800 mb-4">Tambah Stok</h2>

      {/* Error dari server */}
      {serverError && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pilih Produk */}
          <div>
            <label htmlFor="stock-product" className="block text-sm font-medium text-gray-700 mb-1">
              Produk <span className="text-red-500">*</span>
            </label>
            <select
              id="stock-product"
              value={selectedProduct?.id ?? ''}
              onChange={handleProductChange}
              disabled={isSubmitting || allProducts.length === 0}
              className={[
                'w-full rounded-lg border px-3 py-2 text-sm bg-white',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'disabled:bg-gray-50 disabled:text-gray-400',
                'border-gray-300',
              ].join(' ')}
            >
              <option value="">— Pilih produk —</option>
              {allProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stok: {p.stockQuantity})
                </option>
              ))}
            </select>
          </div>

          {/* Jumlah Tambah */}
          <div>
            <label htmlFor="stock-quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah Tambah <span className="text-red-500">*</span>
            </label>
            <input
              id="stock-quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={handleQuantityChange}
              disabled={isSubmitting}
              placeholder="Contoh: 10"
              className={inputClass(!!quantityError)}
            />
            {quantityError && (
              <p className="mt-1 text-xs text-red-600">{quantityError}</p>
            )}
          </div>
        </div>

        {/* Info produk terpilih */}
        {selectedProduct && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700">
            <span className="font-medium">{selectedProduct.name}</span>
            {' — '}Stok saat ini: <span className="font-semibold">{selectedProduct.stockQuantity}</span>
            {selectedProduct.maxCapacity > 0 && (
              <> / Kapasitas maks: <span className="font-semibold">{selectedProduct.maxCapacity}</span></>
            )}
          </div>
        )}

        {/* Tombol submit */}
        <div className="mt-4">
          <button
            type="submit"
            disabled={isSubmitting || !selectedProduct}
            className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700
                       disabled:bg-green-300 text-white text-sm font-semibold
                       transition-colors focus:outline-none focus:ring-2
                       focus:ring-green-500 focus:ring-offset-2
                       disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Menyimpan…' : 'Tambah Stok'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StockAddForm;
