import React from 'react';
import { CartItem } from '../../types';
import { formatRupiah } from '../../lib/calculations';

interface OrderCartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: number, qty: number) => void;
  onRemoveFromCart: (productId: number) => void;
}

const OrderCart: React.FC<OrderCartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveFromCart,
}) => {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-400">
        <p className="text-sm">Belum ada produk dipilih</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100" aria-label="Daftar item pesanan">
      {items.map(({ product, quantity, subtotal }) => {
        const isAtMax = quantity >= product.stockQuantity;
        const isAtMin = quantity <= 1;

        return (
          <li key={product.id} className="py-3 px-1">
            {/* Baris atas: nama + hapus */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {product.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatRupiah(product.price)} / pcs
                </p>
              </div>
              <button
                onClick={() => onRemoveFromCart(product.id)}
                aria-label={`Hapus ${product.name}`}
                className="text-red-500 hover:text-red-700 transition-colors p-0.5 rounded text-xs font-semibold flex-shrink-0"
              >
                Hapus
              </button>
            </div>

            {/* Baris bawah: tombol - qty + dan subtotal */}
            <div className="flex items-center justify-between">
              {/* Kontrol kuantitas +/- */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                  disabled={isAtMin}
                  aria-label={`Kurangi ${product.name}`}
                  className="w-7 h-7 rounded-full border border-gray-300 flex items-center
                             justify-center text-gray-600 hover:bg-gray-100
                             disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                             font-bold text-base leading-none"
                >
                  −
                </button>

                <span
                  className={[
                    'w-8 text-center text-sm font-semibold',
                    isAtMax ? 'text-amber-600' : 'text-gray-800',
                  ].join(' ')}
                  aria-label={`Kuantitas ${product.name}: ${quantity}`}
                >
                  {quantity}
                </span>

                <button
                  onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                  disabled={isAtMax}
                  aria-label={`Tambah ${product.name}`}
                  className="w-7 h-7 rounded-full border border-gray-300 flex items-center
                             justify-center text-gray-600 hover:bg-gray-100
                             disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                             font-bold text-base leading-none"
                >
                  +
                </button>

                {isAtMax && (
                  <span className="text-xs text-amber-600">maks</span>
                )}
              </div>

              {/* Subtotal */}
              <p className="text-sm font-semibold text-gray-800">
                {formatRupiah(subtotal)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default OrderCart;
