import React, { useEffect, useState } from 'react';
import SearchBar from '../components/SearchBar';
import ProductGrid from '../components/pos/ProductGrid';
import OrderCart from '../components/pos/OrderCart';
import PaymentPanel from '../components/pos/PaymentPanel';
import ReceiptModal from '../components/pos/ReceiptModal';
import { useProductStore } from '../stores/productStore';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../lib/api';
import type { Transaction, TransactionItem } from '../types';

type MobileTab = 'produk' | 'pesanan';

const POSPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const { searchQuery, setSearchQuery, availableProducts, fetchProducts } = useProductStore();
  const { cartItems, total, addToCart, updateQuantity, removeFromCart, clearCart, setLastTransactionAt } = useCartStore();

  const [customerName, setCustomerName] = useState('');
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [transactionForReceipt, setTransactionForReceipt] = useState<
    (Transaction & { items: TransactionItem[] }) | null
  >(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('produk');

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const change = typeof amountPaid === 'number' ? amountPaid - total : 0;
  const isConfirmDisabled =
    cartItems.length === 0 || !customerName.trim() || amountPaid === '' || change < 0 || isSubmitting;

  const handleConfirmTransaction = async () => {
    if (isConfirmDisabled) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        customerName: customerName.trim(),
        amountPaid: amountPaid as number,
        items: cartItems.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
      };
      const response = await apiClient.post<Transaction & { items: TransactionItem[] }>('/transactions', payload);
      setTransactionForReceipt(response.data);
      setShowReceipt(true);
      setLastTransactionAt(Date.now());
      fetchProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memproses transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiptClose = () => {
    clearCart();
    setCustomerName('');
    setAmountPaid('');
    setShowReceipt(false);
    setTransactionForReceipt(null);
    setMobileTab('produk');
    fetchProducts();
  };

  // Panel pesanan (dipakai di desktop kanan & mobile tab pesanan)
  const orderPanel = (
    <div className="flex flex-col h-full">
      {/* Header pesanan */}
      <div className="p-3 md:p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-base md:text-lg font-bold text-gray-800">
          Pesanan
          {cartItems.length > 0 && (
            <span className="ml-2 text-xs font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
              {cartItems.length}
            </span>
          )}
        </h2>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-3 md:px-4 py-2">
        <OrderCart items={cartItems} onUpdateQuantity={updateQuantity} onRemoveFromCart={removeFromCart} />
      </div>

      {/* Payment + konfirmasi */}
      <div className="border-t border-gray-200 p-3 md:p-4 space-y-3 bg-white flex-shrink-0">
        <PaymentPanel total={total} amountPaid={amountPaid} change={change} onAmountPaidChange={setAmountPaid} />

        <div>
          <label htmlFor="customer-name" className="block text-xs font-medium text-gray-600 mb-1">
            Nama Customer
          </label>
          <input
            id="customer-name"
            type="text"
            placeholder="Masukkan nama customer"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {error && <p role="alert" className="text-xs text-red-600 text-center">{error}</p>}

        <button
          onClick={handleConfirmTransaction}
          disabled={isConfirmDisabled}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300
                     disabled:cursor-not-allowed text-white font-semibold py-3
                     rounded-xl transition-colors text-sm md:text-base"
        >
          {isSubmitting ? 'Memproses...' : 'Konfirmasi Transaksi'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP: split view 70-30 ── */}
      <div className="hidden md:flex flex-row overflow-hidden bg-gray-50" style={{ height: 'calc(100vh - 88px)' }}>
        {/* Kolom kiri: produk */}
        <div className="w-[70%] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-white flex-shrink-0">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Cari produk..." />
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <ProductGrid products={availableProducts()} onAddToCart={addToCart} />
          </div>
        </div>

        {/* Kolom kanan: pesanan */}
        <div className="w-[30%] border-l border-gray-200 bg-white shadow-lg overflow-hidden">
          {orderPanel}
        </div>
      </div>

      {/* ── MOBILE: tab switching ── */}
      <div className="flex md:hidden flex-col bg-gray-50" style={{ height: 'calc(100vh - 88px)' }}>
        {/* Tab switcher */}
        <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={() => setMobileTab('produk')}
            className={[
              'flex-1 py-2.5 text-sm font-semibold transition-colors',
              mobileTab === 'produk'
                ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            🛍️ Produk
          </button>
          <button
            onClick={() => setMobileTab('pesanan')}
            className={[
              'flex-1 py-2.5 text-sm font-semibold transition-colors relative',
              mobileTab === 'pesanan'
                ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            🧾 Pesanan
            {cartItems.length > 0 && (
              <span className="absolute top-1.5 right-6 text-[10px] font-bold bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab: Produk */}
        {mobileTab === 'produk' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-2 border-b border-gray-200 bg-white flex-shrink-0">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Cari produk..." />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <ProductGrid
                products={availableProducts()}
                onAddToCart={(product) => {
                  addToCart(product);
                }}
              />
            </div>
          </div>
        )}

        {/* Tab: Pesanan */}
        {mobileTab === 'pesanan' && (
          <div className="flex-1 overflow-hidden bg-white">
            {orderPanel}
          </div>
        )}
      </div>

      {showReceipt && transactionForReceipt && (
        <ReceiptModal
          transaction={transactionForReceipt}
          cashierName={user?.fullName ?? ''}
          onClose={handleReceiptClose}
        />
      )}
    </>
  );
};

export default POSPage;
