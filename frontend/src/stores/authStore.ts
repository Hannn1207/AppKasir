import { create } from 'zustand';
import type { User } from '../types';

// Subset of User stored in auth state (no isActive/timestamps needed client-side)
export type AuthUser = Pick<User, 'id' | 'username' | 'fullName' | 'role'>;

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

const TOKEN_KEY = 'token';

/**
 * Zustand auth store.
 * - Persists token to localStorage on setAuth, clears on clearAuth.
 * - Initialises from localStorage so the session survives page reloads.
 */
export const useAuthStore = create<AuthState>(() => ({
  // Initialise from localStorage so the session survives page reloads
  token: localStorage.getItem(TOKEN_KEY),
  user: null,

  setAuth: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    useAuthStore.setState({ token, user });
  },

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    useAuthStore.setState({ token: null, user: null });
  },
}));
