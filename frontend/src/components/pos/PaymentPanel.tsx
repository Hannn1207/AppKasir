import React, { useState } from 'react';
import { formatRupiah } from '../../lib/calculations';

interface PaymentPanelProps {
  total: number;
  amountPaid: number | '';
  change: number;
  onAmountPaidChange: (value: number | '') => void;
}

/** Format angka dengan pemisah ribuan titik, tanpa prefix Rp */
function formatThousands(value: number): string {
  return value.toLocaleString('id-ID');
}

/** Strip semua karakter non-digit dari string */
function stripNonDigit(str: string): string {
  return str.replace(/\D/g, '');
}

const PaymentPanel: React.FC<PaymentPanelProps> = ({
  total,
  amountPaid,
  change,
  onAmountPaidChange,
}) => {
  // displayValue adalah string yang ditampilkan di input (sudah diformat dengan titik)
  const [displayValue, setDisplayValue] = useState<string>(
    amountPaid !== '' ? formatThousands(amountPaid as number) : ''
  );
  const [inputError, setInputError] = useState<string>('');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Kosongkan
    if (raw === '') {
      setDisplayValue('');
      setInputError('');
      onAmountPaidChange('');
      return;
    }

    // Strip semua non-digit (hapus titik yang diketik user)
    const digitsOnly = stripNonDigit(raw);

    if (digitsOnly === '') {
      setDisplayValue('');
      setInputError('');
      onAmountPaidChange('');
      return;
    }

    const parsed = parseInt(digitsOnly, 10);

    if (isNaN(parsed) || parsed <= 0) {
      setInputError('Jumlah uang harus berupa angka positif');
      setDisplayValue(digitsOnly);
      onAmountPaidChange('');
      return;
    }

    setInputError('');
    setDisplayValue(formatThousands(parsed));
    onAmountPaidChange(parsed);
  };

  const hasPaid = amountPaid !== '' && amountPaid > 0;
  const isSufficient = hasPaid && (amountPaid as number) >= total;
  const isInsufficient = hasPaid && (amountPaid as number) < total;

  return (
    <div className="space-y-4">
      {/* Total */}
      <div className="flex items-center justify-between py-2 border-t border-gray-200">
        <span className="text-base text-gray-700">Total</span>
        <span className="text-lg font-bold text-gray-900">{formatRupiah(total)}</span>
      </div>

      {/* Uang Diterima input */}
      <div className="space-y-1">
        <label htmlFor="amount-paid" className="block text-sm font-medium text-gray-700">
          Uang Diterima
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none select-none">
            Rp
          </span>
          <input
            id="amount-paid"
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleAmountChange}
            placeholder="0"
            aria-describedby={inputError ? 'amount-paid-error' : undefined}
            className={[
              'w-full border rounded-lg pl-9 pr-3 py-2 text-sm text-right',
              'focus:outline-none focus:ring-2 focus:ring-blue-400',
              inputError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
            ].join(' ')}
          />
        </div>
        {inputError && (
          <p id="amount-paid-error" role="alert" className="text-xs text-red-600">
            {inputError}
          </p>
        )}
      </div>

      {/* Kembalian */}
      {isSufficient && (
        <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-3 py-2">
          <span className="text-sm font-medium text-green-700">Kembalian</span>
          <span className="text-sm font-bold text-green-700">{formatRupiah(change)}</span>
        </div>
      )}

      {/* Kurang bayar */}
      {isInsufficient && (
        <div className="flex items-center justify-between rounded-lg bg-red-50 border border-red-200 px-3 py-2">
          <span className="text-sm font-medium text-red-600">Pembayaran tidak mencukupi</span>
          <span className="text-sm font-bold text-red-600">
            Kurang: {formatRupiah(total - (amountPaid as number))}
          </span>
        </div>
      )}
    </div>
  );
};

export default PaymentPanel;
