import { describe, it, expect } from 'vitest';
import {
  calculateSubtotal,
  calculateTotal,
  calculateChange,
  formatRupiah,
} from './calculations';

// ─── calculateSubtotal ────────────────────────────────────────────────────────

describe('calculateSubtotal', () => {
  it('returns price * quantity for valid inputs', () => {
    expect(calculateSubtotal(5000, 3)).toBe(15000);
    expect(calculateSubtotal(10000, 1)).toBe(10000);
    expect(calculateSubtotal(1500, 10)).toBe(15000);
  });

  it('returns 0 when price is zero', () => {
    expect(calculateSubtotal(0, 5)).toBe(0);
  });

  it('returns 0 when quantity is zero', () => {
    expect(calculateSubtotal(5000, 0)).toBe(0);
  });

  it('returns 0 when price is negative', () => {
    expect(calculateSubtotal(-1000, 3)).toBe(0);
  });

  it('returns 0 when quantity is negative', () => {
    expect(calculateSubtotal(5000, -2)).toBe(0);
  });

  it('returns 0 when both are negative', () => {
    expect(calculateSubtotal(-5000, -2)).toBe(0);
  });

  it('returns 0 for NaN inputs', () => {
    expect(calculateSubtotal(NaN, 3)).toBe(0);
    expect(calculateSubtotal(5000, NaN)).toBe(0);
  });

  it('returns 0 for Infinity inputs', () => {
    expect(calculateSubtotal(Infinity, 3)).toBe(0);
    expect(calculateSubtotal(5000, Infinity)).toBe(0);
  });

  it('handles large numbers correctly', () => {
    expect(calculateSubtotal(1_000_000, 50)).toBe(50_000_000);
  });
});

// ─── calculateTotal ───────────────────────────────────────────────────────────

describe('calculateTotal', () => {
  it('returns sum of all item subtotals', () => {
    const items = [
      { price: 5000, quantity: 2 },
      { price: 10000, quantity: 1 },
      { price: 3000, quantity: 3 },
    ];
    // 10000 + 10000 + 9000 = 29000
    expect(calculateTotal(items)).toBe(29000);
  });

  it('returns 0 for an empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('returns correct total for a single item', () => {
    expect(calculateTotal([{ price: 7500, quantity: 4 }])).toBe(30000);
  });

  it('skips items with invalid price or quantity (treats them as 0)', () => {
    const items = [
      { price: 5000, quantity: 2 },
      { price: -1000, quantity: 3 }, // invalid — contributes 0
      { price: 2000, quantity: 0 },  // zero quantity — contributes 0
    ];
    expect(calculateTotal(items)).toBe(10000);
  });

  it('handles large totals', () => {
    const items = Array.from({ length: 50 }, () => ({ price: 100_000, quantity: 10 }));
    expect(calculateTotal(items)).toBe(50_000_000);
  });
});

// ─── calculateChange ──────────────────────────────────────────────────────────

describe('calculateChange', () => {
  it('returns correct change when amountPaid > total', () => {
    expect(calculateChange(50000, 35000)).toBe(15000);
  });

  it('returns 0 when amountPaid equals total', () => {
    expect(calculateChange(35000, 35000)).toBe(0);
  });

  it('returns negative value when amountPaid < total (insufficient payment)', () => {
    expect(calculateChange(20000, 35000)).toBe(-15000);
  });

  it('throws an error when amountPaid is zero', () => {
    expect(() => calculateChange(0, 35000)).toThrow();
  });

  it('throws an error when amountPaid is negative', () => {
    expect(() => calculateChange(-10000, 35000)).toThrow();
  });

  it('throws an error when amountPaid is NaN', () => {
    expect(() => calculateChange(NaN, 35000)).toThrow();
  });

  it('throws an error when amountPaid is Infinity', () => {
    expect(() => calculateChange(Infinity, 35000)).toThrow();
  });

  it('handles large amounts correctly', () => {
    expect(calculateChange(1_000_000, 750_000)).toBe(250_000);
  });
});

// ─── formatRupiah ─────────────────────────────────────────────────────────────

describe('formatRupiah', () => {
  it('formats a typical price with thousand separator', () => {
    const result = formatRupiah(15000);
    // Should contain "15.000" (id-ID uses dot as thousand separator)
    expect(result).toMatch(/15\.000/);
    // Should contain the Rp currency symbol
    expect(result).toMatch(/Rp/);
  });

  it('formats zero correctly', () => {
    const result = formatRupiah(0);
    expect(result).toMatch(/Rp/);
    expect(result).toMatch(/0/);
  });

  it('formats a million-rupiah amount with correct separators', () => {
    const result = formatRupiah(1_000_000);
    expect(result).toMatch(/1\.000\.000/);
  });

  it('formats a small amount without thousand separator', () => {
    const result = formatRupiah(500);
    expect(result).toMatch(/500/);
    expect(result).toMatch(/Rp/);
  });

  it('does not include decimal fraction digits', () => {
    const result = formatRupiah(15000);
    // minimumFractionDigits: 0 — no comma/decimal part expected
    expect(result).not.toMatch(/,\d{2}/);
  });

  it('formats a large amount correctly', () => {
    const result = formatRupiah(50_000_000);
    expect(result).toMatch(/50\.000\.000/);
    expect(result).toMatch(/Rp/);
  });

  it('formats negative amounts', () => {
    const result = formatRupiah(-5000);
    expect(result).toMatch(/5\.000/);
  });
});
