import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProductStore } from './productStore';
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
  useProductStore.setState({
    products: [],
    searchQuery: '',
    isLoading: false,
    error: null,
  });
});

// ─── setProducts ──────────────────────────────────────────────────────────────

describe('setProducts', () => {
  it('stores the provided product list', () => {
    const products = [makeProduct({ id: 1 }), makeProduct({ id: 2, name: 'Mie Goreng' })];
    useProductStore.getState().setProducts(products);
    expect(useProductStore.getState().products).toEqual(products);
  });

  it('replaces the existing product list', () => {
    useProductStore.getState().setProducts([makeProduct({ id: 1 })]);
    useProductStore.getState().setProducts([makeProduct({ id: 2, name: 'Mie Goreng' })]);
    expect(useProductStore.getState().products).toHaveLength(1);
    expect(useProductStore.getState().products[0].id).toBe(2);
  });
});

// ─── setSearchQuery ───────────────────────────────────────────────────────────

describe('setSearchQuery', () => {
  it('updates the searchQuery', () => {
    useProductStore.getState().setSearchQuery('nasi');
    expect(useProductStore.getState().searchQuery).toBe('nasi');
  });

  it('can be cleared back to empty string', () => {
    useProductStore.getState().setSearchQuery('nasi');
    useProductStore.getState().setSearchQuery('');
    expect(useProductStore.getState().searchQuery).toBe('');
  });
});

// ─── availableProducts ────────────────────────────────────────────────────────

describe('availableProducts', () => {
  it('returns only products with stockQuantity > 0', () => {
    const products = [
      makeProduct({ id: 1, stockQuantity: 5 }),
      makeProduct({ id: 2, name: 'Mie Goreng', stockQuantity: 0 }),
      makeProduct({ id: 3, name: 'Soto Ayam', stockQuantity: 3 }),
    ];
    useProductStore.getState().setProducts(products);

    const available = useProductStore.getState().availableProducts();
    expect(available).toHaveLength(2);
    expect(available.map((p) => p.id)).toEqual([1, 3]);
  });

  it('returns empty array when all products are out of stock', () => {
    const products = [
      makeProduct({ id: 1, stockQuantity: 0 }),
      makeProduct({ id: 2, name: 'Mie Goreng', stockQuantity: 0 }),
    ];
    useProductStore.getState().setProducts(products);
    expect(useProductStore.getState().availableProducts()).toHaveLength(0);
  });

  it('filters by searchQuery (case-insensitive)', () => {
    const products = [
      makeProduct({ id: 1, name: 'Nasi Goreng', stockQuantity: 5 }),
      makeProduct({ id: 2, name: 'Mie Goreng', stockQuantity: 5 }),
      makeProduct({ id: 3, name: 'Soto Ayam', stockQuantity: 5 }),
    ];
    useProductStore.getState().setProducts(products);
    useProductStore.getState().setSearchQuery('goreng');

    const available = useProductStore.getState().availableProducts();
    expect(available).toHaveLength(2);
    expect(available.map((p) => p.name)).toEqual(['Nasi Goreng', 'Mie Goreng']);
  });

  it('search is case-insensitive', () => {
    const products = [makeProduct({ id: 1, name: 'Nasi Goreng', stockQuantity: 5 })];
    useProductStore.getState().setProducts(products);
    useProductStore.getState().setSearchQuery('NASI');

    expect(useProductStore.getState().availableProducts()).toHaveLength(1);
  });

  it('returns all in-stock products when searchQuery is empty', () => {
    const products = [
      makeProduct({ id: 1, stockQuantity: 5 }),
      makeProduct({ id: 2, name: 'Mie Goreng', stockQuantity: 5 }),
    ];
    useProductStore.getState().setProducts(products);
    useProductStore.getState().setSearchQuery('');

    expect(useProductStore.getState().availableProducts()).toHaveLength(2);
  });

  it('excludes out-of-stock products even when they match the search query', () => {
    const products = [
      makeProduct({ id: 1, name: 'Nasi Goreng', stockQuantity: 0 }),
      makeProduct({ id: 2, name: 'Nasi Uduk', stockQuantity: 5 }),
    ];
    useProductStore.getState().setProducts(products);
    useProductStore.getState().setSearchQuery('nasi');

    const available = useProductStore.getState().availableProducts();
    expect(available).toHaveLength(1);
    expect(available[0].id).toBe(2);
  });

  it('returns empty array when no products match the search query', () => {
    const products = [makeProduct({ id: 1, name: 'Nasi Goreng', stockQuantity: 5 })];
    useProductStore.getState().setProducts(products);
    useProductStore.getState().setSearchQuery('pizza');

    expect(useProductStore.getState().availableProducts()).toHaveLength(0);
  });
});

// ─── setLoading / setError ────────────────────────────────────────────────────

describe('setLoading and setError', () => {
  it('setLoading updates isLoading flag', () => {
    useProductStore.getState().setLoading(true);
    expect(useProductStore.getState().isLoading).toBe(true);
    useProductStore.getState().setLoading(false);
    expect(useProductStore.getState().isLoading).toBe(false);
  });

  it('setError updates error message', () => {
    useProductStore.getState().setError('Gagal memuat produk');
    expect(useProductStore.getState().error).toBe('Gagal memuat produk');
    useProductStore.getState().setError(null);
    expect(useProductStore.getState().error).toBeNull();
  });
});

// ─── fetchProducts ────────────────────────────────────────────────────────────

// vi.mock is hoisted, so the factory must not reference variables defined later.
vi.mock('../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('fetchProducts', () => {
  it('sets products from API response and clears loading/error', async () => {
    const { apiClient } = await import('../lib/api');
    const mockProducts = [makeProduct({ id: 1 }), makeProduct({ id: 2, name: 'Mie Goreng' })];
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { data: mockProducts } } as never);

    await useProductStore.getState().fetchProducts();

    const state = useProductStore.getState();
    expect(state.products).toEqual(mockProducts);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('sets error and clears loading when API call fails', async () => {
    const { apiClient } = await import('../lib/api');
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error') as never);

    await useProductStore.getState().fetchProducts();

    const state = useProductStore.getState();
    expect(state.error).toBe('Network error');
    expect(state.isLoading).toBe(false);
  });
});
