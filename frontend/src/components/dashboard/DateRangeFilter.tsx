import React from 'react';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

/**
 * DateRangeFilter — Filter rentang tanggal untuk dashboard.
 * Requirements: 5.9
 */
const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="start-date" className="text-sm font-medium text-gray-600 whitespace-nowrap">
          Dari
        </label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          max={endDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white"
        />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="end-date" className="text-sm font-medium text-gray-600 whitespace-nowrap">
          Sampai
        </label>
        <input
          id="end-date"
          type="date"
          value={endDate}
          min={startDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white"
        />
      </div>
    </div>
  );
};

export default DateRangeFilter;
