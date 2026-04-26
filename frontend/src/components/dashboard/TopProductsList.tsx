import React from 'react';
import type { PopularProduct } from '../../types';

interface TopProductsListProps {
  products: PopularProduct[];
  isLoading: boolean;
}

const RANK_COLORS = [
  'bg-yellow-400 text-white',   // 1st
  'bg-gray-400 text-white',     // 2nd
  'bg-amber-600 text-white',    // 3rd
  'bg-gray-200 text-gray-600',  // 4th
  'bg-gray-200 text-gray-600',  // 5th
];

/**
 * TopProductsList — Daftar 5 produk terlaris berdasarkan total kuantitas terjual.
 * Requirements: 5.7
 */
const TopProductsList: React.FC<TopProductsListProps> = ({ products, isLoading }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4">
        🏆 5 Produk Terlaris
      </h2>

      {isLoading ? (
        <ul className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
            </li>
          ))}
        </ul>
      ) : products.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          Belum ada data penjualan hari ini.
        </p>
      ) : (
        <ol className="space-y-3">
          {products.slice(0, 5).map((product, index) => (
            <li key={product.productId} className="flex items-center gap-3">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${RANK_COLORS[index] ?? 'bg-gray-200 text-gray-600'}`}
              >
                {index + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                {product.productName}
              </span>
              <span className="text-sm font-semibold text-blue-600 whitespace-nowrap">
                {product.totalQuantity} item
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default TopProductsList;
