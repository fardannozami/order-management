# Frontend

Vue 3 + TypeScript + Vite application for the Order Management API, managed with pnpm. Panduan utama menjalankan seluruh project tersedia di [README repository](../README.md).

## Development

Copy `.env.example` to `.env`, then run from this directory:

```bash
cp .env.example .env
pnpm install
pnpm dev
```

The API base URL is configured with `VITE_API_BASE_URL` (default: `http://localhost:3000/api`). Build with `pnpm build`.

Untuk menjalankan seluruh stack dalam container, ikuti quick start di [README repository](../README.md). Compose otomatis membangun frontend dan menyediakannya di port 5173.

## Pages

- `/login`: login terhubung ke backend, tombol demo mengisi `admin@azatech.id` / `ChangeMe123!`, refresh session, dan route protection.
- `/dashboard`: ringkasan live dari API, tren penjualan, produk terlaris, dan stok kritis.
- `/products` dan `/customers`: list, pencarian, pagination, detail, form CRUD, validasi, serta konfirmasi soft delete.
- `/orders`: buat order multi-produk, riwayat, filter tanggal/pelanggan, dan validasi stok.
- `/orders/:id`: halaman detail transaksi.

Vue Router menangani navigasi, Pinia menyimpan sesi dan preferensi tema, TanStack Vue Query mengelola data API, dan PrimeVue/Aura menyediakan komponen UI. Mode terang, gelap, dan sistem tersedia; preferensi tema disimpan di local storage. Token autentikasi disimpan di session storage untuk tab browser aktif.
