# Implementation Plan: Kasir POS (Sistem Kasir Penjualan)

## Overview

Implementasi sistem kasir Point of Sale (POS) berbasis web dengan React + TypeScript (frontend), Node.js + Express (backend), dan PostgreSQL + Prisma (database). Rencana ini membangun sistem secara inkremental: mulai dari fondasi autentikasi, lalu fitur inti POS, kemudian fitur pendukung (stok, dashboard, ekspor), dan diakhiri dengan integrasi penuh.

## Tasks

- [x] 1. Setup proyek dan fondasi database
  - Inisialisasi proyek backend Node.js + Express + TypeScript
  - Inisialisasi proyek frontend React + TypeScript + Vite + Tailwind CSS
  - Setup Prisma dengan koneksi PostgreSQL
  - Buat skema Prisma: model `User`, `Product`, `StockHistory`, `Transaction`, `TransactionItem` sesuai ERD di design
  - Jalankan migrasi database awal
  - Setup Vitest dan fast-check di kedua proyek
  - _Requirements: 8.1, 6.1, 3.1_

- [ ] 2. Autentikasi dan Manajemen Akun
  - [x] 2.1 Implementasi backend autentikasi (login, JWT, bcrypt)
    - Buat `POST /api/auth/login` dengan bcrypt.compare dan JWT signing (expiry 8 jam)
    - Buat `POST /api/auth/logout`
    - Buat middleware `authenticateJWT` dan `requireRole(role)` untuk RBAC
    - Tambahkan rate limiting 10 req/menit pada endpoint login
    - _Requirements: 8.2, 8.7, 8.8_

  - [ ]* 2.2 Tulis property test untuk autentikasi
    - **Property 31: Valid Login Succeeds** — untuk semua akun aktif dengan kredensial benar, login harus berhasil dan mengembalikan token valid
    - **Property 32: Deactivated Account Cannot Login** — akun nonaktif/dihapus harus ditolak
    - **Property 35: Invalid Credentials Rejected** — username/password salah harus ditolak tanpa token
    - **Validates: Requirements 8.2, 8.4, 8.7**

  - [x] 2.3 Implementasi backend manajemen akun kasir (admin only)
    - Buat `GET /api/accounts`, `POST /api/accounts`, `PUT /api/accounts/:id/deactivate`, `DELETE /api/accounts/:id`
    - Buat `PUT /api/accounts/me/password` untuk ganti password kasir
    - Semua endpoint dilindungi middleware `requireRole('admin')` kecuali ganti password
    - _Requirements: 8.1, 8.4, 8.6, 8.8, 8.9_

  - [ ]* 2.4 Tulis property test untuk manajemen akun
    - **Property 30: Account Creation Round-Trip** — setelah membuat akun, query daftar akun harus mengembalikan akun dengan username dan fullName yang sesuai
    - **Property 34: Password Change Invalidates Old Password** — setelah ganti password, login dengan password baru berhasil dan password lama gagal
    - **Property 36: Role-Based Access Control** — admin diblokir dari endpoint operasional (403), kasir diizinkan
    - **Validates: Requirements 8.1, 8.6, 8.8, 8.9, 8.10**

  - [x] 2.5 Implementasi frontend halaman Login dan auth store
    - Buat `LoginPage` dengan form username + password, validasi client-side
    - Buat Zustand `authStore` (simpan token, user, clearAuth)
    - Redirect ke `/admin/accounts` jika role admin, ke `/kasir/pos` jika role kasir
    - Tampilkan pesan error jika login gagal (Requirements 8.7)
    - _Requirements: 8.2, 8.3, 8.7_

  - [x] 2.6 Implementasi frontend halaman Manajemen Akun (admin)
    - Buat `AccountsPage` dengan `CashierTable`, `CreateCashierForm`, `AccountActions`
    - Tombol nonaktifkan dan hapus akun kasir
    - Admin hanya bisa akses halaman ini, semua route lain redirect ke `/admin/accounts`
    - _Requirements: 8.1, 8.4, 8.8, 8.9_

- [x] 3. Checkpoint — Pastikan semua test autentikasi lulus
  - Pastikan semua test lulus, tanyakan kepada user jika ada pertanyaan.

- [ ] 4. Manajemen Menu/Produk
  - [x] 4.1 Implementasi backend CRUD produk
    - Buat `GET /api/products`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`
    - Validasi: harga > 0 (tolak dengan 400 jika ≤ 0), nama unik (409 jika duplikat)
    - Endpoint `GET /api/products` mendukung query param `search` untuk filter nama (case-insensitive)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 4.2 Tulis property test untuk manajemen produk
    - **Property 1: Product Listing Completeness** — semua produk di sistem harus muncul di daftar dengan name, price, stockQuantity non-null
    - **Property 2: Product Creation Round-Trip** — setelah create produk valid, query list harus mengembalikan produk dengan data yang sesuai
    - **Property 3: Product Update Round-Trip** — setelah update produk, query harus mengembalikan nilai terbaru
    - **Property 4: Product Deletion Removes from System** — setelah delete, produk tidak boleh ada di list
    - **Property 5: Invalid Price Rejected** — harga ≤ 0 harus ditolak, data produk tidak berubah
    - **Property 6: Product Search Filters by Name** — semua hasil pencarian harus mengandung query string (case-insensitive)
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.7**

  - [x] 4.3 Implementasi frontend halaman Manajemen Menu
    - Buat `MenuPage` dengan `ProductTable` (kolom: nama, harga, stok, aksi), `ProductForm` (tambah/edit), `SearchBar` real-time
    - Tampilkan pesan error duplikasi nama dan harga tidak valid
    - Konfirmasi sebelum simpan jika nama duplikat (Requirements 1.6)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ] 5. Manajemen Stok Gudang
  - [x] 5.1 Implementasi backend manajemen stok
    - Buat `GET /api/stock`, `POST /api/stock/:productId/add`, `GET /api/stock/:productId/history`
    - Validasi: jumlah penambahan > 0 (tolak dengan 400 jika ≤ 0)
    - Catat `StockHistory` (changeType: 'addition', quantityChange, stockAfter, recordedAt) setiap penambahan
    - Response `GET /api/stock` sertakan flag `isLowStock` (stok ≤ 5) dan `isOverCapacity` (stok ≥ maxCapacity > 0)
    - `GET /api/stock/:productId/history` kembalikan riwayat urutan `recordedAt` descending
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.9, 6.10, 6.11_

  - [ ]* 5.2 Tulis property test untuk manajemen stok
    - **Property 22: Stock Addition Correctness** — untuk stok awal S dan tambahan A > 0, stok setelah = S + A
    - **Property 23: Stock Addition Timestamp Recorded** — setiap penambahan stok harus mencatat `recordedAt` dalam ±5 detik dari waktu operasi
    - **Property 24: Max Capacity Warning Threshold** — produk dengan stok ≥ maxCapacity (dan maxCapacity > 0) harus tampilkan warning; yang di bawah tidak
    - **Property 25: Low Stock Warning Threshold** — produk dengan stok ≤ 5 harus tampilkan indikator low stock; yang di atas 5 tidak
    - **Property 27: Invalid Stock Addition Rejected** — penambahan stok ≤ 0 harus ditolak, stok tidak berubah
    - **Property 28: Stock History Audit Trail** — setiap perubahan stok harus menghasilkan record history dengan changeType, quantityChange, timestamp; diurutkan recordedAt descending
    - **Validates: Requirements 6.2, 6.3, 6.6, 6.7, 6.9, 6.10, 6.11**

  - [x] 5.3 Implementasi frontend halaman Manajemen Stok
    - Buat `StockPage` dengan `StockTable` (kolom: nama produk, stok saat ini, waktu masuk terakhir, indikator peringatan), `StockAddForm`, `StockHistoryPanel`
    - Tampilkan badge merah untuk low stock (≤ 5 unit) dan badge oranye/kuning untuk over capacity
    - `StockHistoryPanel` tampilkan riwayat per produk urutan terbaru
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.9, 6.10, 6.11_

- [ ] 6. Kalkulasi Pembayaran (Utility Functions)
  - [x] 6.1 Implementasi fungsi kalkulasi di frontend
    - Buat `calculateSubtotal(price, quantity): number`
    - Buat `calculateTotal(items): number`
    - Buat `calculateChange(amountPaid, total): number`
    - Buat `formatRupiah(amount): string` — format IDR dengan pemisah ribuan (Intl.NumberFormat 'id-ID')
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2_

  - [ ]* 6.2 Tulis property test untuk kalkulasi pembayaran
    - **Property 8: Subtotal and Total Calculation Correctness** — subtotal item i = Pᵢ × Qᵢ; total cart = Σ Pᵢ × Qᵢ untuk semua kombinasi harga dan kuantitas valid
    - **Property 11: IDR Currency Formatting** — semua nilai moneter non-negatif harus diformat dengan pemisah ribuan IDR (contoh: "Rp 1.000.000")
    - **Property 12: Change Calculation Correctness** — untuk P ≥ T, kembalian = P − T secara tepat
    - **Property 13: Insufficient Payment Rejected** — untuk P < T, sistem menolak dan menampilkan defisit = T − P
    - **Property 14: Non-Positive Payment Rejected** — input ≤ 0 atau non-numerik harus ditolak dengan pesan error
    - **Validates: Requirements 3.1, 3.2, 3.5, 4.1, 4.2, 4.3, 4.4**

- [x] 7. Checkpoint — Pastikan semua test kalkulasi dan stok lulus
  - Pastikan semua test lulus, tanyakan kepada user jika ada pertanyaan.

- [ ] 8. Fitur Pemesanan dan Transaksi (POS Core)
  - [x] 8.1 Implementasi backend endpoint transaksi
    - Buat `POST /api/transactions`: validasi cart (1–50 jenis produk), kuantitas tidak melebihi stok, payment valid
    - Dalam satu database transaction: simpan `Transaction` + semua `TransactionItem` (dengan snapshot nama & harga) + kurangi `stockQuantity` setiap produk + catat `StockHistory` (changeType: 'reduction')
    - Response kembalikan transaction ID dan data lengkap
    - _Requirements: 2.1, 2.5, 2.7, 4.5, 6.8, 8.5_

  - [ ]* 8.2 Tulis property test untuk transaksi
    - **Property 7: Available Products Have Positive Stock** — produk yang tampil di POS hanya yang stockQuantity > 0
    - **Property 9: Quantity Exceeding Stock Is Rejected** — kuantitas > stok S harus ditolak atau dibatasi ke S
    - **Property 15: Transaction Confirmation Saves and Resets** — setelah konfirmasi transaksi valid: record tersimpan di DB dengan semua detail item, cashierId, customerName; cart kosong
    - **Property 26: Stock Reduction on Transaction** — setelah konfirmasi, stok produk Pᵢ berkurang tepat Qᵢ
    - **Property 33: Transaction Records Cashier** — setiap transaksi harus menyimpan ID dan nama kasir yang memproses
    - **Validates: Requirements 2.1, 2.5, 4.5, 6.8, 8.5**

  - [x] 8.3 Implementasi Zustand stores untuk POS
    - Buat `useProductStore` (daftar produk, searchQuery, filter produk tersedia)
    - Buat `useCartStore` (cartItems, addToCart, updateQuantity, removeFromCart, clearCart)
    - Kalkulasi subtotal dan total otomatis saat cart berubah (< 500ms, Requirements 3.3)
    - _Requirements: 2.2, 2.3, 2.4, 2.6, 3.1, 3.2, 3.3, 3.4_

  - [ ]* 8.4 Tulis property test untuk cart store
    - **Property 10: Cart Cancellation Empties Cart** — untuk sembarang state cart, setelah cancel order, cart harus kosong (0 item)
    - **Validates: Requirements 2.6**

  - [x] 8.5 Implementasi komponen `AppHeader`
    - Buat `AppHeader` sesuai spesifikasi design: sticky, bg-blue-800, nama toko (kiri) dari `VITE_STORE_NAME`, nama kasir + tombol logout (kanan)
    - Tombol logout memanggil `clearAuth()` dari authStore + redirect ke `/login`
    - _Requirements: 8.3_

  - [x] 8.6 Implementasi komponen `ProductCard` dan `ProductGrid`
    - Buat `ProductCard`: rounded-xl, emoji icon (text-4xl), nama menu (font-semibold text-sm), harga IDR (text-xs), badge stok (hijau/merah), hover:shadow-md hover:scale-105, disabled jika stok = 0
    - Buat `ProductGrid`: grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4, klik card memanggil `addToCart`
    - Implementasi `getProductIcon(name)` untuk mapping nama → emoji
    - _Requirements: 2.1, 2.2_

  - [x] 8.7 Implementasi komponen `OrderCart` dan `PaymentPanel`
    - Buat `OrderCart`: daftar item dengan input kuantitas (validasi ≤ stok), subtotal per item, tombol hapus item
    - Buat `PaymentPanel`: tampilkan total (format IDR), input uang diterima, tampilkan kembalian atau pesan "pembayaran tidak mencukupi"
    - _Requirements: 2.3, 2.4, 2.5, 3.1, 3.2, 3.5, 4.1, 4.2, 4.3, 4.4_

  - [x] 8.8 Implementasi `POSPage` dengan layout split view 70-30
    - Rakit `POSPage` dengan layout `flex flex-col md:flex-row h-[calc(100vh-64px)]`
    - Kolom kiri (70%): `SearchBar` + `ProductGrid` scrollable
    - Kolom kanan (30%): header "Pesanan" + input nama customer + `OrderCart` + `PaymentPanel` + tombol "Konfirmasi Transaksi"
    - Tombol konfirmasi disabled jika cart kosong, nama customer kosong, atau kembalian < 0
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 3.3, 4.1, 7.3_

- [ ] 9. Cetak Struk Pembelian
  - [x] 9.1 Implementasi komponen `ReceiptModal` dan logika cetak
    - Buat `ReceiptModal` yang menampilkan preview struk: nama toko, nama kasir, nama customer, tanggal/waktu transaksi, daftar produk (kuantitas + harga satuan + subtotal), total, uang diterima, kembalian
    - Tombol "Cetak" memanggil `window.print()` dengan CSS `@media print` untuk menyembunyikan elemen non-struk
    - Tombol "Lewati" menutup modal tanpa mencetak
    - Setelah cetak atau lewati: reset cart, customerName, amountPaid ke kondisi awal
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.6_

  - [ ]* 9.2 Tulis property test untuk struk
    - **Property 29: Receipt Content Completeness** — untuk sembarang transaksi yang dikonfirmasi, data struk harus mengandung semua field wajib (nama toko, kasir, customer, datetime, produk, subtotal, total, uang diterima, kembalian) — semua non-null
    - **Validates: Requirements 7.2**

- [x] 10. Dashboard Penjualan
  - [x] 10.1 Implementasi backend endpoint dashboard
    - Buat `GET /api/dashboard/summary?startDate=&endDate=` — kembalikan total pemasukan, total transaksi, total item terjual untuk rentang tanggal
    - Buat `GET /api/dashboard/popular?date=` — kembalikan data produk terpopuler (diurutkan total qty descending), top 5 produk terlaris
    - Buat `GET /api/dashboard/transactions?date=` — kembalikan riwayat transaksi hari ini dengan detail waktu, produk, total
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8, 5.9_

  - [ ]* 10.2 Tulis property test untuk dashboard
    - **Property 16: Dashboard Aggregation Correctness** — untuk sembarang set transaksi dalam rentang tanggal: total income = sum semua totalAmount, total count = jumlah transaksi, total items = sum semua quantity
    - **Property 17: Popular Products Ranking** — data chart produk populer harus diurutkan qty descending; top products list maksimal 5 item juga diurutkan qty descending
    - **Property 18: Transaction History Completeness** — setiap record di riwayat transaksi harus memiliki timestamp, daftar produk, dan totalAmount — semua non-null
    - **Property 19: Date Range Filter Correctness** — semua transaksi yang ditampilkan harus memiliki `created_at` dalam rentang [start, end] inklusif; tidak ada transaksi di luar rentang
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.5, 5.7, 5.8, 5.9**

  - [x] 10.3 Implementasi ekspor Excel
    - Buat `GET /api/dashboard/export?date=` — kembalikan data transaksi untuk tanggal tertentu
    - Implementasi fungsi frontend menggunakan SheetJS (xlsx) untuk generate file .xlsx
    - Kolom Excel: nama menu, jumlah dibeli, total harga, nama kasir, nama customer (satu baris per item produk per transaksi)
    - Nama file otomatis: `penjualan-YYYY-MM-DD.xlsx`
    - _Requirements: 5.11, 5.12, 5.13_

  - [ ]* 10.4 Tulis property test untuk ekspor Excel
    - **Property 20: Excel Export Data Completeness** — untuk sembarang set transaksi pada tanggal ekspor, file Excel harus memiliki satu baris per item transaksi dengan semua kolom wajib terisi (nama menu, qty, total harga, nama kasir, nama customer)
    - **Property 21: Excel Filename Format** — untuk sembarang tanggal D, nama file harus cocok dengan pola `penjualan-YYYY-MM-DD.xlsx`
    - **Validates: Requirements 5.11, 5.12, 5.13**

  - [x] 10.5 Implementasi frontend `DashboardPage`
    - Buat `DashboardPage` dengan `SummaryCards` (total pemasukan, total transaksi, total item terjual dalam format IDR)
    - Buat `PopularChart` menggunakan Recharts (BarChart atau PieChart) untuk menu terpopuler hari ini
    - Buat `TopProductsList` (5 produk terlaris)
    - Buat `TransactionHistory` (riwayat transaksi hari ini: waktu, produk, total)
    - Buat `DateRangeFilter` dan `ExportButton` dengan date picker
    - Update dashboard secara otomatis setelah transaksi baru dikonfirmasi (Requirements 5.6, 5.10)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11_

- [x] 11. Checkpoint — Pastikan semua test dashboard dan ekspor lulus
  - Pastikan semua test lulus, tanyakan kepada user jika ada pertanyaan.

- [x] 12. Routing, Layout, dan Integrasi Akhir
  - [x] 12.1 Setup React Router dan layout
    - Buat `KasirLayout` (AppHeader + Outlet) dan `AdminLayout`
    - Buat `ProtectedRoute` yang memeriksa token JWT dan role dari authStore
    - Definisikan semua routes: `/login`, `/admin/accounts`, `/kasir/pos`, `/kasir/menu`, `/kasir/stock`, `/kasir/dashboard`
    - Admin yang mencoba akses route kasir diredirect ke `/admin/accounts`; kasir yang mencoba akses `/admin/*` diredirect ke `/kasir/pos`
    - _Requirements: 8.8, 8.9, 8.10_

  - [x] 12.2 Integrasi real-time update dashboard setelah transaksi
    - Setelah `POST /api/transactions` berhasil, invalidate/refetch data dashboard (summary, popular chart, transaction history)
    - Pastikan `SummaryCards`, `PopularChart`, dan `TransactionHistory` terupdate tanpa refresh halaman
    - _Requirements: 5.6, 5.10_

  - [x] 12.3 Integrasi pengurangan stok otomatis dan sinkronisasi UI
    - Setelah transaksi dikonfirmasi, refetch daftar produk di `useProductStore` agar `ProductGrid` menampilkan stok terbaru
    - Produk yang stoknya menjadi 0 setelah transaksi harus langsung tampil sebagai disabled di `ProductGrid`
    - _Requirements: 6.8, 2.1_

  - [ ]* 12.4 Tulis integration test untuk alur transaksi lengkap
    - Test end-to-end: login kasir → pilih produk → input nama customer + uang diterima → konfirmasi transaksi → verifikasi stok berkurang → verifikasi data dashboard terupdate → verifikasi struk dapat digenerate
    - _Requirements: 2.1, 2.2, 4.5, 6.8, 7.1, 8.5_

- [x] 13. Final Checkpoint — Pastikan semua test lulus dan sistem terintegrasi
  - Pastikan semua test lulus, tanyakan kepada user jika ada pertanyaan.

## Notes

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk keterlacakan
- Property test menggunakan fast-check dengan minimum 100 iterasi per property
- Unit test dan property test bersifat komplementer — keduanya diperlukan untuk coverage penuh
- Checkpoint memastikan validasi inkremental sebelum melanjutkan ke fase berikutnya
- Semua kalkulasi moneter (subtotal, total, kembalian) dilakukan di sisi client untuk responsivitas < 500ms (Requirements 3.3)
- Database transaction digunakan untuk operasi konfirmasi transaksi (simpan + kurangi stok) untuk menjamin atomicity
