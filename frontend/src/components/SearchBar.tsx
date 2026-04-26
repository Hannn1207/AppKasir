import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Komponen SearchBar yang dapat digunakan ulang.
 * Requirements: 1.7
 */
const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Cari produk...',
  disabled = false,
}) => {
  return (
    <div className="relative">
      <span
        className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none"
        aria-hidden="true"
      >
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={placeholder}
        className={[
          'w-full rounded-xl border border-gray-300 pl-9 pr-4 py-2 text-sm',
          'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500',
          'focus:border-transparent transition-colors',
          disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white',
        ].join(' ')}
      />
    </div>
  );
};

export default SearchBar;
