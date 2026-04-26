import React from 'react';
import { Product } from '../../types';
import { formatRupiah } from '../../lib/calculations';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const isAvailable = product.stockQuantity > 0;

  return (
    <div
      onClick={() => isAvailable && onAddToCart(product)}
      role="button"
      aria-label={`${product.name}, ${formatRupiah(product.price)}${!isAvailable ? ', stok habis' : ''}`}
      aria-disabled={!isAvailable}
      tabIndex={isAvailable ? 0 : -1}
      onKeyDown={(e) => {
        if (isAvailable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onAddToCart(product);
        }
      }}
      className={[
        'relative flex flex-col items-center justify-center gap-1',
        'rounded-xl p-3 min-h-[90px]',
        'bg-white border border-gray-200',
        'transition-all duration-150 select-none',
        isAvailable
          ? 'cursor-pointer hover:shadow-md hover:border-blue-300 hover:bg-blue-50 active:scale-95'
          : 'opacity-40 cursor-not-allowed',
      ].join(' ')}
    >
      {/* Badge stok */}
      <span className={[
        'absolute top-1.5 right-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full',
        isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600',
      ].join(' ')}>
        {isAvailable ? `${product.stockQuantity}` : 'Habis'}
      </span>

      {/* Nama produk */}
      <p className="font-semibold text-sm text-center text-gray-800 line-clamp-2 leading-tight">
        {product.name}
      </p>

      {/* Harga */}
      <p className="text-xs text-blue-600 font-medium text-center">
        {formatRupiah(product.price)}
      </p>
    </div>
  );
};

export default ProductCard;
