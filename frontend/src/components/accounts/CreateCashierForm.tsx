import React, { useState } from 'react';
import { apiClient } from '../../lib/api';
import type { User } from '../../types';

interface CreateCashierFormProps {
  onCreated: (newAccount: User) => void;
}

interface FormState {
  username: string;
  password: string;
  fullName: string;
}

const INITIAL_FORM: FormState = { username: '', password: '', fullName: '' };

/**
 * Form untuk membuat akun kasir baru.
 * Fields: username, password (min 6 karakter), nama lengkap.
 * Requirements: 8.1, 8.8
 */
const CreateCashierForm: React.FC<CreateCashierFormProps> = ({ onCreated }) => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const validate = (): Partial<FormState> => {
    const errs: Partial<FormState> = {};
    if (!form.fullName.trim()) errs.fullName = 'Nama lengkap tidak boleh kosong.';
    if (!form.username.trim()) errs.username = 'Username tidak boleh kosong.';
    if (!form.password) {
      errs.password = 'Password tidak boleh kosong.';
    } else if (form.password.length < 6) {
      errs.password = 'Password minimal 6 karakter.';
    }
    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post<User>('/accounts', {
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
      });

      onCreated(response.data);
      setForm(INITIAL_FORM);
      setErrors({});
      setIsOpen(false);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { status?: number; data?: { error?: string; message?: string } };
      };
      if (axiosError.response?.status === 409) {
        setErrors((prev) => ({
          ...prev,
          username: 'Username sudah digunakan. Pilih username lain.',
        }));
      } else {
        const msg =
          axiosError.response?.data?.error ??
          axiosError.response?.data?.message ??
          'Gagal membuat akun. Coba lagi.';
        setServerError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setServerError(null);
    setIsOpen(false);
  };

  return (
    <div>
      {/* Tombol buka form */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                     bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold
                     transition-colors focus:outline-none focus:ring-2
                     focus:ring-blue-500 focus:ring-offset-2"
        >
          <span aria-hidden="true">+</span>
          Tambah Kasir
        </button>
      )}

      {/* Form inline */}
      {isOpen && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Buat Akun Kasir Baru
          </h2>

          {serverError && (
            <div
              role="alert"
              className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Nama Lengkap */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Nama lengkap kasir"
                  className={[
                    'w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    'disabled:bg-gray-50 disabled:text-gray-400',
                    errors.fullName ? 'border-red-400' : 'border-gray-300',
                  ].join(' ')}
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                )}
              </div>

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="off"
                  value={form.username}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Username unik"
                  className={[
                    'w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    'disabled:bg-gray-50 disabled:text-gray-400',
                    errors.username ? 'border-red-400' : 'border-gray-300',
                  ].join(' ')}
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-red-600">{errors.username}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Min. 6 karakter"
                  className={[
                    'w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    'disabled:bg-gray-50 disabled:text-gray-400',
                    errors.password ? 'border-red-400' : 'border-gray-300',
                  ].join(' ')}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            {/* Tombol aksi */}
            <div className="flex items-center gap-3 mt-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700
                           disabled:bg-blue-300 text-white text-sm font-semibold
                           transition-colors focus:outline-none focus:ring-2
                           focus:ring-blue-500 focus:ring-offset-2"
              >
                {isSubmitting ? 'Menyimpan…' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl border border-gray-300 bg-white
                           hover:bg-gray-50 text-gray-700 text-sm font-medium
                           transition-colors focus:outline-none focus:ring-2
                           focus:ring-gray-400 focus:ring-offset-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CreateCashierForm;
