import React from 'react';
import { Product } from '../../types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  className?: string;
}

const CATEGORY_ORDER = ['Makanan', 'Minuman', 'Snack', 'Dessert', 'Paket', 'Lainnya'];

const CATEGORY_COLORS: Record<string, string> = {
  'Makanan':  'bg-orange-100 text-orange-700 border-orange-200',
  'Minuman':  'bg-blue-100 text-blue-700 border-blue-200',
  'Snack':    'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Dessert':  'bg-pink-100 text-pink-700 border-pink-200',
  'Paket':    'bg-purple-100 text-purple-700 border-purple-200',
  'Lainnya':  'bg-gray-100 text-gray-600 border-gray-200',
};

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  className = '',
}) => {
  if (products.length === 0) {
    return (
      <div className={`flex items-center justify-center py-16 text-gray-400 ${className}`}>
        <p className="text-sm">Tidak ada produk ditemukan</p>
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

  // Urutkan kategori sesuai CATEGORY_ORDER, sisanya di belakang
  const sortedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  return (
    <div className={`p-2 space-y-5 ${className}`}>
      {sortedCategories.map((category) => (
        <div key={category}>
          {/* Label kategori */}
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {category}
            </span>
            <span className="text-xs text-gray-400">{grouped[category].length} item</span>
          </div>

          {/* Grid produk dalam kategori ini */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {grouped[category].map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;
