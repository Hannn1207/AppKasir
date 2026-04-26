import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '../lib/api';
import type { DashboardSummary, PopularProduct, Transaction, TransactionItem } from '../types';
import SummaryCards from '../components/dashboard/SummaryCards';
import PopularChart from '../components/dashboard/PopularChart';
import TopProductsList from '../components/dashboard/TopProductsList';
import TransactionHistory from '../components/dashboard/TransactionHistory';
import DateRangeFilter from '../components/dashboard/DateRangeFilter';
import ExportButton from '../components/dashboard/ExportButton';
import ReceiptModal from '../components/pos/ReceiptModal';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';

function todayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

interface PopularResponse {
  chart: PopularProduct[];
  topProducts: PopularProduct[];
}

type ReceiptTx = Transaction & { items: TransactionItem[] };

const DashboardPage: React.FC = () => {
  const today = todayString();
  const { user } = useAuthStore();
  const lastTransactionAt = useCartStore((s) => s.lastTransactionAt);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [exportDate, setExportDate] = useState(today);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<PopularProduct[]>([]);
  const [topProducts, setTopProducts] = useState<PopularProduct[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);
  const [receiptTx, setReceiptTx] = useState<ReceiptTx | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSummary = useCallback(async (start: string, end: string) => {
    setIsSummaryLoading(true);
    try {
      const res = await apiClient.get<DashboardSummary>('/dashboard/summary', {
        params: { startDate: start, endDate: end },
      });
      setSummary(res.data);
    } catch { /* keep previous */ } finally { setIsSummaryLoading(false); }
  }, []);

  const fetchPopular = useCallback(async (date: string) => {
    setIsChartLoading(true);
    try {
      const res = await apiClient.get<PopularResponse>('/dashboard/popular', { params: { date } });
      setChartData(res.data.chart);
      setTopProducts(res.data.topProducts);
    } catch { /* keep previous */ } finally { setIsChartLoading(false); }
  }, []);

  const fetchTransactions = useCallback(async (date: string) => {
    setIsTransactionsLoading(true);
    try {
      const res = await apiClient.get<Transaction[]>('/dashboard/transactions', { params: { date } });
      setTransactions(res.data);
    } catch { /* keep previous */ } finally { setIsTransactionsLoading(false); }
  }, []);

  const refreshAll = useCallback((start: string, end: string) => {
    fetchSummary(start, end);
    fetchPopular(start);
    fetchTransactions(start);
  }, [fetchSummary, fetchPopular, fetchTransactions]);

  useEffect(() => { refreshAll(startDate, endDate); }, [startDate, endDate, refreshAll]);

  useEffect(() => {
    pollingRef.current = setInterval(() => refreshAll(startDate, endDate), 30_000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [startDate, endDate, refreshAll]);

  useEffect(() => {
    if (lastTransactionAt === null) return;
    refreshAll(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTransactionAt]);

  const handlePrintReceipt = (transaction: Transaction) => {
    if (transaction.items && transaction.items.length > 0) {
      setReceiptTx(transaction as ReceiptTx);
    }
  };

  const cashierName = receiptTx?.cashier?.fullName ?? user?.fullName ?? '';

  return (
    <>
      <div className="max-w-7xl w-full mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Penjualan</h1>
            <p className="mt-1 text-sm text-gray-500">Pantau performa penjualan harian.</p>
          </div>
          <button
            onClick={() => refreshAll(startDate, endDate)}
            className="self-start flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                       text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            aria-label="Refresh data dashboard"
          >
            <span aria-hidden="true">🔄</span> Refresh
          </button>
        </div>

        {/* Filter + Ekspor */}
        <div className="mb-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={(date) => { setStartDate(date); if (date > endDate) setEndDate(date); }}
              onEndDateChange={(date) => { setEndDate(date); if (date < startDate) setStartDate(date); }}
            />
            <ExportButton exportDate={exportDate} onExportDateChange={setExportDate} />
          </div>
        </div>

        {/* Summary cards */}
        <div className="mb-6">
          <SummaryCards summary={summary} isLoading={isSummaryLoading} />
        </div>

        {/* Chart + Top products */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PopularChart data={chartData} isLoading={isChartLoading} />
          <TopProductsList products={topProducts} isLoading={isChartLoading} />
        </div>

        {/* Transaction history */}
        <TransactionHistory
          transactions={transactions}
          isLoading={isTransactionsLoading}
          onPrintReceipt={handlePrintReceipt}
        />
      </div>

      {/* Receipt modal */}
      {receiptTx !== null && (
        <ReceiptModal
          transaction={receiptTx}
          cashierName={cashierName}
          onClose={() => setReceiptTx(null)}
        />
      )}
    </>
  );
};

export default DashboardPage;
