import React, { useEffect, useRef } from 'react';
import type { Transaction, TransactionItem } from '../../types';
import { formatRupiah } from '../../lib/calculations';

interface ReceiptModalProps {
  transaction: Transaction & { items: TransactionItem[] };
  cashierName: string;
  onClose: () => void; // called after print or skip
}

/**
 * ReceiptModal — Menampilkan preview struk dan opsi cetak.
 * Requirements: 7.1, 7.2, 7.4, 7.5, 7.6
 */
const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  cashierName,
  onClose,
}) => {
  const storeName = import.meta.env.VITE_STORE_NAME ?? 'Kasir POS';
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Format tanggal dan waktu transaksi
  const formattedDateTime = new Date(transaction.createdAt).toLocaleString(
    'id-ID',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }
  );

  // Inject receipt content into the print area div in <body> so @media print works
  useEffect(() => {
    const printArea = document.getElementById('receipt-print-area');
    if (printArea && printAreaRef.current) {
      printArea.innerHTML = printAreaRef.current.innerHTML;
    }
    return () => {
      const area = document.getElementById('receipt-print-area');
      if (area) area.innerHTML = '';
    };
  }, [transaction]);

  const handlePrint = () => {
    // Ensure print area is up to date
    const printArea = document.getElementById('receipt-print-area');
    if (printArea && printAreaRef.current) {
      printArea.innerHTML = printAreaRef.current.innerHTML;
    }
    window.print();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    /* Fixed overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      {/* Modal card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 flex flex-col max-h-[90vh]">
        {/* Modal header */}
        <div className="px-6 pt-5 pb-3 border-b border-gray-100">
          <h2
            id="receipt-modal-title"
            className="text-lg font-bold text-gray-800 text-center"
          >
            Struk Pembelian
          </h2>
        </div>

        {/* Receipt preview — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Hidden ref element used to copy content to print area */}
          <div ref={printAreaRef}>
            <ReceiptContent
              storeName={storeName}
              cashierName={cashierName}
              transaction={transaction}
              formattedDateTime={formattedDateTime}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-5 pt-3 border-t border-gray-100 flex gap-3">
          {/* Lewati */}
          <button
            onClick={handleSkip}
            className="flex-1 border border-gray-300 text-gray-700 font-semibold
                       py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Lewati
          </button>

          {/* Cetak */}
          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold
                       py-2.5 rounded-xl transition-colors"
          >
            Cetak
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Inner receipt content (reused for both preview and print) ────────────────

interface ReceiptContentProps {
  storeName: string;
  cashierName: string;
  transaction: Transaction & { items: TransactionItem[] };
  formattedDateTime: string;
}

const ReceiptContent: React.FC<ReceiptContentProps> = ({
  storeName,
  cashierName,
  transaction,
  formattedDateTime,
}) => (
  <div className="font-mono text-xs text-gray-800 space-y-2">
    {/* Store name */}
    <div className="text-center font-bold text-sm">{storeName}</div>

    {/* Divider */}
    <div className="border-t border-dashed border-gray-400" />

    {/* Transaction meta */}
    <div className="space-y-0.5">
      <div className="flex justify-between">
        <span className="text-gray-500">Kasir</span>
        <span className="font-medium">{cashierName}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Customer</span>
        <span className="font-medium">{transaction.customerName}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Tanggal</span>
        <span className="font-medium">{formattedDateTime}</span>
      </div>
    </div>

    {/* Divider */}
    <div className="border-t border-dashed border-gray-400" />

    {/* Item list */}
    <div className="space-y-1">
      {transaction.items.map((item) => (
        <div key={item.id} className="space-y-0.5">
          <div className="font-medium truncate">{item.productNameSnapshot}</div>
          <div className="flex justify-between text-gray-600">
            <span>
              {item.quantity} x {formatRupiah(item.unitPriceSnapshot)}
            </span>
            <span className="font-medium text-gray-800">
              {formatRupiah(item.subtotal)}
            </span>
          </div>
        </div>
      ))}
    </div>

    {/* Divider */}
    <div className="border-t border-dashed border-gray-400" />

    {/* Totals */}
    <div className="space-y-0.5">
      <div className="flex justify-between font-bold">
        <span>Total</span>
        <span>{formatRupiah(transaction.totalAmount)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Uang Diterima</span>
        <span>{formatRupiah(transaction.amountPaid)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Kembalian</span>
        <span className="font-bold text-green-700">
          {formatRupiah(transaction.changeAmount)}
        </span>
      </div>
    </div>

    {/* Footer */}
    <div className="border-t border-dashed border-gray-400" />
    <div className="text-center text-gray-500">Terima kasih!</div>
  </div>
);

export default ReceiptModal;
