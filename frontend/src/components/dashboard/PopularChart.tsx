import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { PopularProduct } from '../../types';

interface PopularChartProps {
  data: PopularProduct[];
  isLoading: boolean;
}

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'];

/**
 * PopularChart — Bar chart menu terpopuler hari ini menggunakan Recharts.
 * Requirements: 5.5, 5.6
 */
const PopularChart: React.FC<PopularChartProps> = ({ data, isLoading }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4">
        📊 Menu Terpopuler Hari Ini
      </h2>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          Belum ada data penjualan hari ini.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="productName"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              interval={0}
              width={80}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value: number) => [`${value} item`, 'Terjual']}
              labelStyle={{ fontWeight: 600, color: '#1f2937' }}
              contentStyle={{
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                fontSize: 12,
              }}
            />
            <Bar dataKey="totalQuantity" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default PopularChart;
