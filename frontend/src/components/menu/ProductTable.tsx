import React from 'react';
import type { Product } from '../../types';

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const formatIDR = (amount: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const CATEGORY_COLORS: Record<string, string> = {
  'Makanan':  'bg-orange-100 text-orange-700',
  'Minuman':  'bg-blue-100 text-blue-700',
  'Snack':    'bg-yellow-100 text-yellow-700',
  'Dessert':  'bg-pink-100 text-pink-700',
  'Paket':    'bg-purple-100 text-purple-700',
  'Lainnya':  'bg-gray-100 text-gray-600',
};

/**
 * Tabel daftar produk/menu, dikelompokkan per kategori.
 * Requirements: 1.1, 1.3, 1.4
 */
const ProductTable: React.FC<ProductTableProps> = ({ products, isLoading, onEdit, onDelete }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <svg className="animate-spin h-6 w-6 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Memuat data…
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <span className="text-4xl mb-3" aria-hidden="true">🍽️</span>
        <p className="text-sm">Belum ada produk. Tambahkan produk baru.</p>
      </div>
    );
  }

  // Kelompokkan produk per kategori
  const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category || 'Lainnya';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const categoryOrder = ['Makanan', 'Minuman', 'Snack', 'Dessert', 'Paket', 'Lainnya'];
  const sortedCategories = [
    ...categoryOrder.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !categoryOrder.includes(c)),
  ];

  return (
    <div className="space-y-6">
      {sortedCategories.map((category) => (
        <div key={category}>
          {/* Header kategori */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-600'}`}>
              {category}
            </span>
            <span className="text-xs text-gray-400">{grouped[category].length} produk</span>
          </div>

          {/* Tabel per kategori */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Produk</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Harga</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stok</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kap. Maks</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {grouped[category].map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 tabular-nums">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums">{formatIDR(product.price)}</td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums">
                      {product.stockQuantity <= 5 ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" aria-hidden="true" />
                          <span className="text-yellow-700 font-medium">{product.stockQuantity}</span>
                        </span>
                      ) : product.stockQuantity}
                    </td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums">
                      {product.maxCapacity > 0 ? product.maxCapacity : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(product)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          aria-label={`Edit ${product.name}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(product)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          aria-label={`Hapus ${product.name}`}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductTable;
