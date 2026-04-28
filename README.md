# 🏪 Kedai Kita — Sistem Kasir POS

Aplikasi web Point of Sale (POS) untuk mengelola transaksi penjualan, stok barang, dan laporan harian. Dibangun dengan React + TypeScript (frontend) dan Node.js + Express + PostgreSQL (backend).

---

## ✨ Fitur

- **Kasir / POS** — Pilih produk, hitung total & kembalian otomatis, cetak struk
- **Manajemen Menu** — Tambah, edit, hapus produk dengan kategori (Makanan, Minuman, dll.)
- **Manajemen Stok** — Tambah stok, pantau stok rendah & kapasitas gudang
- **Dashboard Penjualan** — Grafik produk terpopuler, ringkasan harian, ekspor Excel
- **Manajemen Akun** — Buat & kelola akun kasir (khusus admin)
- **Autentikasi** — Login dengan JWT, dua peran: Admin & Kasir
- **Responsif** — Mendukung tampilan desktop dan mobile

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| State | Zustand |
| Chart | Recharts |
| Excel | SheetJS (xlsx) |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcrypt |

---

## 🚀 Cara Menjalankan

### Prasyarat

- [Node.js](https://nodejs.org) v18+
- [PostgreSQL](https://www.postgresql.org/download/) (sudah terinstall dan berjalan)

---

### 1. Clone repository

```bash
git clone https://github.com/USERNAME/kasir-pos.git
cd kasir-pos
```

---

### 2. Setup Backend

```bash
cd backend
npm install
```

Buat file `.env` dari contoh:

```bash
cp .env.example .env
```

Edit `backend/.env` dan sesuaikan dengan konfigurasi PostgreSQL kamu:

```env
DATABASE_URL="postgresql://postgres:PASSWORD_KAMU@localhost:5432/kasir_pos"
JWT_SECRET="ganti-dengan-secret-yang-aman"
JWT_EXPIRES_IN="8h"
PORT=3000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

Buat database dan jalankan migrasi:

```bash
# Buat database (jika belum ada)
psql -U postgres -c "CREATE DATABASE kasir_pos;"

# Jalankan migrasi
npm run db:migrate

# Isi data awal (akun admin, kasir, dan produk contoh)
npm run db:seed
```

---

### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

Buat file `.env` dari contoh:

```bash
cp .env.example .env
```

Isi `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_STORE_NAME=Kedai Kita
```

---

### 4. Jalankan Aplikasi

Buka **dua terminal terpisah**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
> Backend berjalan di `http://localhost:3000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
> Frontend berjalan di `http://localhost:5173`

---

### 5. Login

Buka browser ke `http://localhost:5173`

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Kasir | `kasir1` | `kasir123` |

- **Admin** → hanya bisa akses halaman manajemen akun kasir
- **Kasir** → akses penuh ke semua fitur (POS, Menu, Stok, Dashboard)

---

## 📁 Struktur Project

```
kasir-pos/
├── backend/          # Node.js + Express API
│   ├── prisma/       # Schema & migrasi database
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       └── routes/
└── frontend/         # React + Vite SPA
    └── src/
        ├── components/
        ├── pages/
        ├── stores/
        └── lib/
```

---

## 🧪 Menjalankan Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```
