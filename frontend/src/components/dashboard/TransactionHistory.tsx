import React from 'react';
import { formatRupiah } from '../../lib/calculations';
import type { Transaction } from '../../types';

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading: boolean;
  onPrintReceipt?: (transaction: Transaction) => void;
}

/**
 * TransactionHistory — Riwayat transaksi dengan opsi cetak ulang struk.
 * Klik pada transaksi akan membuka modal struk.
 * Requirements: 5.8
 */
const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  isLoading,
  onPrintReceipt,
}) => {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">
          📜 Riwayat Transaksi Hari Ini
        </h2>
        {onPrintReceipt && transactions.length > 0 && (
          <span className="text-xs text-gray-400">Klik transaksi untuk cetak struk</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          Belum ada transaksi hari ini.
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              onClick={() => onPrintReceipt?.(transaction)}
              role={onPrintReceipt ? 'button' : undefined}
              tabIndex={onPrintReceipt ? 0 : undefined}
              onKeyDown={(e) => {
                if (onPrintReceipt && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onPrintReceipt(transaction);
                }
              }}
              className={[
                'border border-gray-100 rounded-xl p-3 transition-colors',
                onPrintReceipt
                  ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200 active:bg-blue-100'
                  : '',
              ].join(' ')}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-500">
                    {formatTime(transaction.createdAt)}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-600 font-medium">
                    {transaction.customerName}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600">
                    {formatRupiah(transaction.totalAmount)}
                  </span>
                  {onPrintReceipt && (
                    <span className="text-gray-400 text-xs" aria-hidden="true">🖨️</span>
                  )}
                </div>
              </div>

              {transaction.items && transaction.items.length > 0 && (
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {transaction.items.map((item, idx) => (
                    <li key={item.id ?? idx} className="flex items-center gap-1">
                      <span className="text-gray-400">•</span>
                      <span>{item.productNameSnapshot} × {item.quantity}</span>
                    </li>
                  ))}
                </ul>
              )}

              {transaction.cashier && (
                <p className="text-xs text-gray-400 mt-1.5">
                  Kasir: {transaction.cashier.fullName}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
