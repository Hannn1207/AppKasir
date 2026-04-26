/**
 * Calculation utilities for the POS system.
 * Handles subtotal, total, change, and IDR currency formatting.
 */

/**
 * Calculates the subtotal for a single item.
 * @param price - Unit price in Rupiah (must be positive)
 * @param quantity - Quantity (must be positive)
 * @returns price * quantity, or 0 if either argument is invalid
 */
export function calculateSubtotal(price: number, quantity: number): number {
  if (!Number.isFinite(price) || !Number.isFinite(quantity)) return 0;
  if (price <= 0 || quantity <= 0) return 0;
  return price * quantity;
}

/**
 * Calculates the total for a list of items.
 * @param items - Array of objects with price and quantity
 * @returns Sum of (price * quantity) for all items, or 0 for an empty array
 */
export function calculateTotal(
  items: Array<{ price: number; quantity: number }>
): number {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, item) => sum + calculateSubtotal(item.price, item.quantity), 0);
}

/**
 * Calculates the change to return to the customer.
 * @param amountPaid - Amount paid by the customer
 * @param total - Total amount due
 * @returns amountPaid - total (negative means insufficient payment)
 * @throws Error if amountPaid is not a positive number
 */
export function calculateChange(amountPaid: number, total: number): number {
  if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
    throw new Error('Jumlah uang yang diterima harus berupa angka positif');
  }
  return amountPaid - total;
}

/**
 * Formats a number as Indonesian Rupiah currency string.
 * Uses Intl.NumberFormat with 'id-ID' locale.
 * @param amount - Amount in Rupiah
 * @returns Formatted string, e.g. "Rp 15.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}
