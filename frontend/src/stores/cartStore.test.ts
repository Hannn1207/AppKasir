import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cartStore';
import type { Product } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: 'Nasi Goreng',
    price: 15000,
    stockQuantity: 10,
    maxCapacity: 50,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// Reset store state before each test
beforeEach(() => {
  useCartStore.setState({ cartItems: [], total: 0 });
});

// ─── addToCart ────────────────────────────────────────────────────────────────

describe('addToCart', () => {
  it('adds a new product with quantity 1 and correct subtotal', () => {
    const product = makeProduct({ price: 15000 });
    useCartStore.getState().addToCart(product);

    const { cartItems, total } = useCartStore.getState();
    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].quantity).toBe(1);
    expect(cartItems[0].subtotal).toBe(15000);
    expect(total).toBe(15000);
  });

  it('increments quantity when the same product is added again', () => {
    const product = makeProduct({ price: 15000 });
    useCartStore.getState().addToCart(product);
    useCartStore.getState().addToCart(product);

    const { cartItems, total } = useCartStore.getState();
    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].quantity).toBe(2);
    expect(cartItems[0].subtotal).toBe(30000);
    expect(total).toBe(30000);
  });

  it('does not exceed stockQuantity when adding repeatedly', () => {
    const product = makeProduct({ price: 10000, stockQuantity: 2 });
    // Add 3 times — should cap at 2
    useCartStore.getState().addToCart(product);
    useCartStore.getState().addToCart(product);
    useCartStore.getState().addToCart(product);

    const { cartItems } = useCartStore.getState();
    expect(cartItems[0].quantity).toBe(2);
    expect(cartItems[0].subtotal).toBe(20000);
  });

  it('adds multiple different products independently', () => {
    const p1 = makeProduct({ id: 1, price: 10000 });
    const p2 = makeProduct({ id: 2, name: 'Mie Goreng', price: 12000 });
    useCartStore.getState().addToCart(p1);
    useCartStore.getState().addToCart(p2);

    const { cartItems, total } = useCartStore.getState();
    expect(cartItems).toHaveLength(2);
    expect(total).toBe(22000);
  });
});

// ─── updateQuantity ───────────────────────────────────────────────────────────

describe('updateQuantity', () => {
  it('updates quantity and recalculates subtotal and total', () => {
    const product = makeProduct({ price: 10000 });
    useCartStore.getState().addToCart(product);
    useCartStore.getState().updateQuantity(product.id, 3);

    const { cartItems, total } = useCartStore.getState();
    expect(cartItems[0].quantity).toBe(3);
    expect(cartItems[0].subtotal).toBe(30000);
    expect(total).toBe(30000);
  });

  it('removes item when quantity is set to 0', () => {
    const product = makeProduct();
    useCartStore.getState().addToCart(product);
    useCartStore.getState().updateQuantity(product.id, 0);

    const { cartItems, total } = useCartStore.getState();
    expect(cartItems).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('removes item when quantity is negative', () => {
    const product = makeProduct();
    useCartStore.getState().addToCart(product);
    useCartStore.getState().updateQuantity(product.id, -5);

    expect(useCartStore.getState().cartItems).toHaveLength(0);
  });

  it('caps quantity at stockQuantity', () => {
    const product = makeProduct({ price: 10000, stockQuantity: 5 });
    useCartStore.getState().addToCart(product);
    useCartStore.getState().updateQuantity(product.id, 99);

    const { cartItems } = useCartStore.getState();
    expect(cartItems[0].quantity).toBe(5);
    expect(cartItems[0].subtotal).toBe(50000);
  });

  it('does not affect other items in the cart', () => {
    const p1 = makeProduct({ id: 1, price: 10000 });
    const p2 = makeProduct({ id: 2, name: 'Mie Goreng', price: 12000 });
    useCartStore.getState().addToCart(p1);
    useCartStore.getState().addToCart(p2);
    useCartStore.getState().updateQuantity(p1.id, 3);

    const { cartItems, total } = useCartStore.getState();
    const item2 = cartItems.find((i) => i.product.id === p2.id)!;
    expect(item2.quantity).toBe(1);
    expect(total).toBe(30000 + 12000);
  });
});

// ─── removeFromCart ───────────────────────────────────────────────────────────

describe('removeFromCart', () => {
  it('removes the specified product from the cart', () => {
    const product = makeProduct();
    useCartStore.getState().addToCart(product);
    useCartStore.getState().removeFromCart(product.id);

    const { cartItems, total } = useCartStore.getState();
    expect(cartItems).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('only removes the targeted product, leaving others intact', () => {
    const p1 = makeProduct({ id: 1, price: 10000 });
    const p2 = makeProduct({ id: 2, name: 'Mie Goreng', price: 12000 });
    useCartStore.getState().addToCart(p1);
    useCartStore.getState().addToCart(p2);
    useCartStore.getState().removeFromCart(p1.id);

    const { cartItems, total } = useCartStore.getState();
    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].product.id).toBe(p2.id);
    expect(total).toBe(12000);
  });

  it('does nothing when removing a product not in the cart', () => {
    const product = makeProduct({ id: 1 });
    useCartStore.getState().addToCart(product);
    useCartStore.getState().removeFromCart(999);

    expect(useCartStore.getState().cartItems).toHaveLength(1);
  });
});

// ─── clearCart ────────────────────────────────────────────────────────────────

describe('clearCart', () => {
  it('empties the cart and resets total to 0', () => {
    const p1 = makeProduct({ id: 1, price: 10000 });
    const p2 = makeProduct({ id: 2, name: 'Mie Goreng', price: 12000 });
    useCartStore.getState().addToCart(p1);
    useCartStore.getState().addToCart(p2);
    useCartStore.getState().clearCart();

    const { cartItems, total } = useCartStore.getState();
    expect(cartItems).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('is idempotent — clearing an already-empty cart is safe', () => {
    useCartStore.getState().clearCart();
    const { cartItems, total } = useCartStore.getState();
    expect(cartItems).toHaveLength(0);
    expect(total).toBe(0);
  });
});

// ─── total calculation ────────────────────────────────────────────────────────

describe('total calculation', () => {
  it('total equals sum of all item subtotals', () => {
    const p1 = makeProduct({ id: 1, price: 10000 });
    const p2 = makeProduct({ id: 2, name: 'Mie Goreng', price: 12000 });
    useCartStore.getState().addToCart(p1);
    useCartStore.getState().addToCart(p1); // qty 2
    useCartStore.getState().addToCart(p2); // qty 1

    const { cartItems, total } = useCartStore.getState();
    const expectedTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    expect(total).toBe(expectedTotal);
    expect(total).toBe(32000); // 2*10000 + 1*12000
  });

  it('total is 0 for an empty cart', () => {
    expect(useCartStore.getState().total).toBe(0);
  });

  it('total updates correctly after removing an item', () => {
    const p1 = makeProduct({ id: 1, price: 10000 });
    const p2 = makeProduct({ id: 2, name: 'Mie Goreng', price: 12000 });
    useCartStore.getState().addToCart(p1);
    useCartStore.getState().addToCart(p2);
    useCartStore.getState().removeFromCart(p1.id);

    expect(useCartStore.getState().total).toBe(12000);
  });
});
