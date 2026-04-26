# Kasir POS — Sistem Kasir Penjualan

Aplikasi web Point of Sale (POS) berbasis React + TypeScript (frontend) dan Node.js + Express (backend) dengan PostgreSQL + Prisma.

## Struktur Proyek

```
kasir/
├── backend/          # Node.js + Express + TypeScript + Prisma
│   ├── prisma/       # Skema dan migrasi database
│   ├── src/          # Source code backend
│   └── ...
├── frontend/         # React + TypeScript + Vite + Tailwind CSS
│   ├── src/          # Source code frontend
│   └── ...
└── README.md
```

## Prasyarat

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

## Setup Backend

```bash
cd backend
npm install

# Salin file environment
cp .env.example .env
# Edit .env dan sesuaikan DATABASE_URL dengan koneksi PostgreSQL Anda

# Generate Prisma client
npm run db:generate

# Jalankan migrasi database
npm run db:migrate

# (Opsional) Seed data awal
npm run db:seed

# Jalankan server development
npm run dev
```

## Setup Frontend

```bash
cd frontend
npm install

# Salin file environment
cp .env.example .env
# Edit .env jika perlu

# Jalankan development server
npm run dev
```

## Menjalankan Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Migrasi Database

Untuk menjalankan migrasi ke database PostgreSQL yang sudah berjalan:

```bash
cd backend
npx prisma migrate dev
```

Jika hanya ingin membuat file migrasi tanpa menjalankannya:

```bash
cd backend
npx prisma migrate dev --create-only
```

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Charting | Recharts |
| Excel Export | SheetJS (xlsx) |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Testing | Vitest + fast-check |
