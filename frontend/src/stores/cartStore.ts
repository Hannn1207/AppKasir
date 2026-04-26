import { create } from 'zustand';
import type { CartItem, Product } from '../types';
import { calculateSubtotal, calculateTotal } from '../lib/calculations';

interface CartState {
  cartItems: CartItem[];

  // Computed: sum of all item subtotals (Requirement 3.1, 3.2, 3.3, 3.4)
  total: number;

  /**
   * Timestamp (ms since epoch) of the last successfully confirmed transaction.
   * Used by DashboardPage to trigger an immediate refresh after a new transaction.
   * Requirements 5.6, 5.10
   */
  lastTransactionAt: number | null;

  // Actions
  addToCart: (product: Product) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  setLastTransactionAt: (timestamp: number) => void;
}

/**
 * Recalculates the total from a list of cart items.
 * Uses calculateTotal from calculations.ts for consistency.
 */
function computeTotal(items: CartItem[]): number {
  return calculateTotal(
    items.map((item) => ({ price: item.product.price, quantity: item.quantity }))
  );
}

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: [],
  total: 0,
  lastTransactionAt: null,

  /**
   * Adds a product to the cart.
   * - If already present, increments quantity by 1 (capped at stockQuantity).
   * - If not present, adds with quantity 1.
   * - Recalculates subtotal and total.
   * Requirements 2.2, 2.5, 3.1, 3.3
   */
  addToCart: (product: Product) => {
    const { cartItems } = get();
    const existing = cartItems.find((item) => item.product.id === product.id);

    let updatedItems: CartItem[];

    if (existing) {
      const newQty = Math.min(existing.quantity + 1, product.stockQuantity);
      updatedItems = cartItems.map((item) =>
        item.product.id === product.id
          ? {
              ...item,
              quantity: newQty,
              subtotal: calculateSubtotal(product.price, newQty),
            }
          : item
      );
    } else {
      const newItem: CartItem = {
        product,
        quantity: 1,
        subtotal: calculateSubtotal(product.price, 1),
      };
      updatedItems = [...cartItems, newItem];
    }

    set({ cartItems: updatedItems, total: computeTotal(updatedItems) });
  },

  /**
   * Updates the quantity of a cart item.
   * - If quantity <= 0, removes the item.
   * - If quantity > stockQuantity, caps at stockQuantity.
   * - Recalculates subtotal and total.
   * Requirements 2.3, 2.5, 3.1, 3.3
   */
  updateQuantity: (productId: number, quantity: number) => {
    const { cartItems } = get();
    let updatedItems: CartItem[];

    if (quantity <= 0) {
      updatedItems = cartItems.filter((item) => item.product.id !== productId);
    } else {
      updatedItems = cartItems.map((item) => {
        if (item.product.id !== productId) return item;
        const cappedQty = Math.min(quantity, item.product.stockQuantity);
        return {
          ...item,
          quantity: cappedQty,
          subtotal: calculateSubtotal(item.product.price, cappedQty),
        };
      });
    }

    set({ cartItems: updatedItems, total: computeTotal(updatedItems) });
  },

  /**
   * Removes a product from the cart entirely.
   * Recalculates total.
   * Requirement 2.4, 3.4
   */
  removeFromCart: (productId: number) => {
    const { cartItems } = get();
    const updatedItems = cartItems.filter(
      (item) => item.product.id !== productId
    );
    set({ cartItems: updatedItems, total: computeTotal(updatedItems) });
  },

  /**
   * Clears all items from the cart.
   * Requirement 2.6
   */
  clearCart: () => {
    set({ cartItems: [], total: 0 });
  },

  /**
   * Records the timestamp of the last confirmed transaction.
   * DashboardPage watches this to trigger an immediate data refresh.
   * Requirements 5.6, 5.10
   */
  setLastTransactionAt: (timestamp: number) => {
    set({ lastTransactionAt: timestamp });
  },
}));
