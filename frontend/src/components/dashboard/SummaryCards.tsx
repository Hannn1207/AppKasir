import React from 'react';
import { formatRupiah } from '../../lib/calculations';
import type { DashboardSummary } from '../../types';

interface SummaryCardsProps {
  summary: DashboardSummary | null;
  isLoading: boolean;
}

interface CardProps {
  icon: string;
  label: string;
  value: string;
  color: string;
  isLoading: boolean;
}

const Card: React.FC<CardProps> = ({ icon, label, value, color, isLoading }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      {isLoading ? (
        <div className="mt-1 h-6 w-28 bg-gray-200 rounded animate-pulse" />
      ) : (
        <p className="mt-0.5 text-xl font-bold text-gray-800 truncate">{value}</p>
      )}
    </div>
  </div>
);

/**
 * SummaryCards — Kartu ringkasan dashboard: total pemasukan, total transaksi, total item terjual.
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, isLoading }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card
        icon="💰"
        label="Total Pemasukan"
        value={summary ? formatRupiah(summary.totalIncome) : 'Rp 0'}
        color="bg-green-50"
        isLoading={isLoading}
      />
      <Card
        icon="🧾"
        label="Total Transaksi"
        value={summary ? `${summary.totalTransactions} transaksi` : '0 transaksi'}
        color="bg-blue-50"
        isLoading={isLoading}
      />
      <Card
        icon="📦"
        label="Total Item Terjual"
        value={summary ? `${summary.totalItemsSold} item` : '0 item'}
        color="bg-purple-50"
        isLoading={isLoading}
      />
    </div>
  );
};

export default SummaryCards;
