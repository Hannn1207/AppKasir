import { create } from 'zustand';
import type { Product } from '../types';
import { apiClient } from '../lib/api';

interface ProductState {
  products: Product[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // Computed: products with stockQuantity > 0, filtered by searchQuery
  availableProducts: () => Product[];

  // Actions
  setProducts: (products: Product[]) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchProducts: () => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  searchQuery: '',
  isLoading: false,
  error: null,

  /**
   * Returns ALL products filtered by searchQuery (case-insensitive name match).
   * Products with stockQuantity === 0 are included but shown as disabled in the UI.
   * Requirement 1.7: real-time search filtering
   */
  availableProducts: () => {
    const { products, searchQuery } = get();
    const query = searchQuery.trim().toLowerCase();
    return query === ''
      ? products
      : products.filter((p) => p.name.toLowerCase().includes(query));
  },

  setProducts: (products) => set({ products }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  /**
   * Fetches all products from the API.
   * Requirement 2.1: display available products with stock > 0
   */
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<Product[]>('/products');
      // Backend returns array directly: res.json(result)
      const products = Array.isArray(response.data) ? response.data : [];
      set({ products, isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal memuat produk';
      set({ error: message, isLoading: false });
    }
  },
}));
