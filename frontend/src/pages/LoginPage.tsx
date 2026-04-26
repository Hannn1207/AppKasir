import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../lib/api';
import type { AuthResponse } from '../types';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Client-side validation
  const validate = (): string | null => {
    if (!username.trim()) return 'Username tidak boleh kosong.';
    if (!password) return 'Password tidak boleh kosong.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        username: username.trim(),
        password,
      });

      const { token, user } = response.data;
      setAuth(token, user);

      // Redirect based on role (Requirements 8.8, 8.9)
      if (user.role === 'admin') {
        navigate('/admin/accounts', { replace: true });
      } else {
        navigate('/kasir/pos', { replace: true });
      }
    } catch (err: unknown) {
      // Show error message for failed login (Requirements 8.7)
      const axiosError = err as { response?: { data?: { error?: string; message?: string } } };
      const serverMessage =
        axiosError.response?.data?.error ??
        axiosError.response?.data?.message;

      setError(serverMessage ?? 'Username atau password salah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        {/* Logo / branding */}
        <div className="text-center mb-8">
          <span className="text-5xl" aria-hidden="true">🏪</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-800">Kasir POS</h1>
          <p className="mt-1 text-sm text-gray-500">Masuk ke akun Anda</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Error message (Requirements 8.7) */}
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Username field */}
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              placeholder="Masukkan username"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                         placeholder-gray-400 focus:outline-none focus:ring-2
                         focus:ring-blue-500 focus:border-transparent
                         disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {/* Password field */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Masukkan password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                         placeholder-gray-400 focus:outline-none focus:ring-2
                         focus:ring-blue-500 focus:border-transparent
                         disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                       disabled:bg-blue-300 text-white font-semibold py-2.5 text-sm
                       transition-colors focus:outline-none focus:ring-2
                       focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Memproses…
              </span>
            ) : (
              'Masuk'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
