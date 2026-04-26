import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import type { Product } from '../../types';

interface ProductFormProps {
  editingProduct: Product | null;
  existingNames: string[];
  onSaved: (product: Product) => void;
  onCancel: () => void;
}

interface FormState {
  name: string;
  price: string;
  stockQuantity: string;
  maxCapacity: string;
  category: string;
}

const CATEGORIES = ['Makanan', 'Minuman', 'Snack', 'Dessert', 'Paket', 'Lainnya'];

const INITIAL_FORM: FormState = {
  name: '',
  price: '',
  stockQuantity: '',
  maxCapacity: '',
  category: 'Makanan',
};

/**
 * Form tambah / edit produk.
 * Fields: Nama Produk, Kategori, Harga, Stok Awal, Kapasitas Maks
 * Requirements: 1.2, 1.3, 1.5, 1.6
 */
const ProductForm: React.FC<ProductFormProps> = ({
  editingProduct,
  existingNames,
  onSaved,
  onCancel,
}) => {
  const isEditing = editingProduct !== null;

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateConfirmName, setDuplicateConfirmName] = useState<string | null>(null);

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        price: String(editingProduct.price),
        stockQuantity: String(editingProduct.stockQuantity),
        maxCapacity: editingProduct.maxCapacity > 0 ? String(editingProduct.maxCapacity) : '',
        category: editingProduct.category || 'Makanan',
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setFieldErrors({});
    setServerError(null);
    setDuplicateConfirmName(null);
  }, [editingProduct]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FormState]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setServerError(null);
  };

  const validate = (): Partial<Record<keyof FormState, string>> => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = 'Nama produk tidak boleh kosong.';
    const price = Number(form.price);
    if (!form.price.trim()) errs.price = 'Harga tidak boleh kosong.';
    else if (isNaN(price) || price <= 0) errs.price = 'Harga harus berupa angka lebih dari 0.';
    const stock = Number(form.stockQuantity);
    if (form.stockQuantity.trim() !== '' && (isNaN(stock) || stock < 0))
      errs.stockQuantity = 'Stok harus berupa angka tidak negatif.';
    const cap = Number(form.maxCapacity);
    if (form.maxCapacity.trim() !== '' && (isNaN(cap) || cap < 0))
      errs.maxCapacity = 'Kapasitas maks harus berupa angka tidak negatif.';
    return errs;
  };

  const isDuplicateName = (name: string): boolean => {
    const trimmed = name.trim().toLowerCase();
    return existingNames.some((n) => {
      if (isEditing && n.toLowerCase() === editingProduct!.name.toLowerCase()) return false;
      return n.toLowerCase() === trimmed;
    });
  };

  const submitToApi = async (confirmed = false) => {
    setIsSubmitting(true);
    setServerError(null);
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category,
      ...(form.stockQuantity.trim() !== '' && { stockQuantity: Number(form.stockQuantity) }),
      ...(form.maxCapacity.trim() !== '' && { maxCapacity: Number(form.maxCapacity) }),
    };
    try {
      let response;
      if (isEditing) {
        response = await apiClient.put<Product>(`/products/${editingProduct!.id}`, payload);
      } else {
        response = await apiClient.post<Product>('/products', payload);
      }
      onSaved(response.data);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { status?: number; data?: { error?: string; message?: string } };
      };
      if (axiosError.response?.status === 409) {
        setFieldErrors((prev) => ({ ...prev, name: 'Nama produk sudah digunakan.' }));
      } else {
        const msg =
          axiosError.response?.data?.error ??
          axiosError.response?.data?.message ??
          'Gagal menyimpan produk. Coba lagi.';
        setServerError(msg);
      }
    } finally {
      setIsSubmitting(false);
      if (confirmed) setDuplicateConfirmName(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setDuplicateConfirmName(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    if (isDuplicateName(form.name)) { setDuplicateConfirmName(form.name.trim()); return; }
    await submitToApi();
  };

  const inputClass = (field: keyof FormState) =>
    [
      'w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      'disabled:bg-gray-50 disabled:text-gray-400',
      fieldErrors[field] ? 'border-red-400' : 'border-gray-300',
    ].join(' ');

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-800 mb-4">
        {isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}
      </h2>

      {serverError && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {duplicateConfirmName && (
        <div role="alertdialog" aria-modal="true" className="mb-4 rounded-xl bg-yellow-50 border border-yellow-300 px-4 py-4">
          <p className="text-sm font-semibold text-yellow-800 mb-1">⚠️ Nama produk sudah ada</p>
          <p className="text-sm text-yellow-700 mb-3">
            Nama produk <strong>"{duplicateConfirmName}"</strong> sudah ada. Yakin ingin menyimpan?
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => submitToApi(true)} disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold transition-colors disabled:opacity-50">
              {isSubmitting ? 'Menyimpan…' : 'Ya, Simpan'}
            </button>
            <button type="button" onClick={() => setDuplicateConfirmName(null)} disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg border border-yellow-400 bg-white hover:bg-yellow-50 text-yellow-700 text-xs font-medium transition-colors disabled:opacity-50">
              Batal
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Nama Produk */}
          <div className="sm:col-span-2">
            <label htmlFor="prod-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input id="prod-name" name="name" type="text"
              value={form.name} onChange={handleChange} disabled={isSubmitting}
              placeholder="Contoh: Nasi Goreng" className={inputClass('name')} />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
          </div>

          {/* Kategori */}
          <div className="sm:col-span-2">
            <label htmlFor="prod-category" className="block text-sm font-medium text-gray-700 mb-1">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select id="prod-category" name="category"
              value={form.category} onChange={handleChange} disabled={isSubmitting}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         disabled:bg-gray-50 disabled:text-gray-400">
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Harga */}
          <div>
            <label htmlFor="prod-price" className="block text-sm font-medium text-gray-700 mb-1">
              Harga (Rp) <span className="text-red-500">*</span>
            </label>
            <input id="prod-price" name="price" type="number" min="1" step="1"
              value={form.price} onChange={handleChange} disabled={isSubmitting}
              placeholder="Contoh: 15000" className={inputClass('price')} />
            {fieldErrors.price && <p className="mt-1 text-xs text-red-600">{fieldErrors.price}</p>}
          </div>

          {/* Stok Awal */}
          <div>
            <label htmlFor="prod-stock" className="block text-sm font-medium text-gray-700 mb-1">
              Stok Awal
            </label>
            <input id="prod-stock" name="stockQuantity" type="number" min="0" step="1"
              value={form.stockQuantity} onChange={handleChange} disabled={isSubmitting}
              placeholder="Contoh: 50" className={inputClass('stockQuantity')} />
            {fieldErrors.stockQuantity && <p className="mt-1 text-xs text-red-600">{fieldErrors.stockQuantity}</p>}
          </div>

          {/* Kapasitas Maks */}
          <div>
            <label htmlFor="prod-capacity" className="block text-sm font-medium text-gray-700 mb-1">
              Kapasitas Maks
            </label>
            <input id="prod-capacity" name="maxCapacity" type="number" min="0" step="1"
              value={form.maxCapacity} onChange={handleChange} disabled={isSubmitting}
              placeholder="Contoh: 100" className={inputClass('maxCapacity')} />
            {fieldErrors.maxCapacity && <p className="mt-1 text-xs text-red-600">{fieldErrors.maxCapacity}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button type="submit" disabled={isSubmitting || duplicateConfirmName !== null}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                       text-white text-sm font-semibold transition-colors focus:outline-none
                       focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            {isSubmitting ? 'Menyimpan…' : isEditing ? 'Perbarui' : 'Simpan'}
          </button>
          <button type="button" onClick={onCancel} disabled={isSubmitting}
            className="px-5 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50
                       text-gray-700 text-sm font-medium transition-colors focus:outline-none
                       focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed">
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
