# Order Management

Aplikasi online shop sederhana untuk mengelola katalog, pelanggan, transaksi penjualan, dan ringkasan bisnis. Repository ini berisi dua service terpisah: REST API di `backend/` dan SPA Vue di `frontend/`.

## Tech stack

- **Backend:** NestJS, TypeScript strict, Drizzle ORM, PostgreSQL, class-validator, JWT access dan refresh token, Vitest/Supertest.
- **Frontend:** Vue 3, TypeScript, Vite, Vue Router, Pinia, TanStack Vue Query, PrimeVue.
- **Database:** PostgreSQL 17. Migration SQL dikelola Drizzle.

NestJS memberi struktur module, controller, dan service yang jelas untuk memisahkan HTTP dari logika transaksi. Drizzle dipilih karena skema dan query tetap dekat dengan SQL PostgreSQL, sementara migration tersimpan sebagai SQL yang bisa ditinjau. Vue 3 + Vite menghasilkan frontend TypeScript yang ringan dan dapat dijalankan sebagai service terpisah. TanStack Vue Query menangani cache dan sinkronisasi data API.

Backend menggunakan Node.js 24 LTS atau lebih baru. Frontend menggunakan pnpm sebagai package manager dan Vite berjalan di atas Node.js.

## Menjalankan aplikasi lokal

Prasyarat: Docker Compose dan port `5432`, `3000`, serta `5173` tersedia. Clone repository, salin konfigurasi contoh, lalu jalankan seluruh stack:

```bash
git clone https://github.com/fardannozami/order-management.git && cd order-management && cp backend/.env.example backend/.env && cp frontend/.env.example frontend/.env
docker compose up -d
```

Buka frontend di `http://localhost:5173`. Compose membangun service Node.js 24, menunggu PostgreSQL sehat, lalu otomatis menjalankan migration dan seeder sebelum memulai API. API tersedia di `http://localhost:3000/api`, sedangkan dokumentasi interaktif Scalar tersedia di `http://localhost:3000/` dan OpenAPI JSON di `http://localhost:3000/openapi.json`. Untuk melihat proses: `docker compose logs -f backend`.

Compose memakai `backend/.env.example` sebagai nilai fallback dan `backend/.env` sebagai override. Untuk development lokal tanpa Compose, backend dan frontend memerlukan Node.js 24+ dan pnpm 10; gunakan panduan pada [backend](backend/README.md) dan [frontend](frontend/README.md). File `.env` tidak di-commit; file contoh `.env.example` berisi nilai development.

### Akun demo

Seeder membuat akun berikut dengan password yang sama:

| Email | Password |
| --- | --- |
| `admin@azatech.id` | `ChangeMe123!` |
| `supervisor@azatech.id` | `ChangeMe123!` |
| `kasir@azatech.id` | `ChangeMe123!` |

Seeder juga membuat 20 produk, 15 pelanggan, dan 30 order demo dengan tanggal tersebar selama 30 hari terakhir. Data seed tidak menimpa record yang sudah ada; stok dikurangi sekali untuk order demo yang baru dibuat. Seeder hanya untuk development/demo dan menolak berjalan dengan `NODE_ENV=production`.

### Migrasi dan seeder

Jalankan dari folder `backend/` setelah database tersedia:

```bash
pnpm db:migrate
pnpm db:seed
```

Setelah mengubah `src/database/schema.ts`, buat migration lalu terapkan:

```bash
pnpm db:generate
pnpm db:migrate
```

## Fitur

- Autentikasi login dengan access token 15 menit dan refresh token 7 hari pada konfigurasi contoh. Refresh token dirotasi dan disimpan dalam bentuk hash; logout mencabut sesi.
- CRUD produk dan pelanggan dengan validasi, pagination, pencarian, serta soft delete.
- Pembuatan order multi-produk. Harga diambil dari database; validasi stok, pencatatan item, total transaksi, dan pengurangan stok berada dalam satu database transaction.
- Nomor order format `INV-YYYYMMDD-XXXX`, dialokasikan dengan PostgreSQL advisory lock agar aman saat request bersamaan.
- Riwayat order dengan filter tanggal dan pelanggan, serta halaman detail `/orders/:id`.
- Dashboard berisi total transaksi, penjualan, produk terlaris, stok kritis, dan tren penjualan tujuh hari.
- Response API konsisten dalam envelope `success`, `message`, `data`, dan `meta`; error validasi menyertakan detail per field.
- Tema frontend terang, gelap, dan mengikuti pengaturan sistem.

Endpoint selain login dan refresh memerlukan Bearer access token. Refresh memakai refresh token di body request karena access token yang kedaluwarsa tidak dapat dipakai untuk memperbarui sesi.

## API ringkas

| Area | Endpoint |
| --- | --- |
| Auth | `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Produk | `GET/POST /api/products`, `GET/PUT/DELETE /api/products/:id` |
| Pelanggan | `GET/POST /api/customers`, `GET/PUT/DELETE /api/customers/:id` |
| Order | `GET/POST /api/orders`, `GET /api/orders/:id` |
| Dashboard | `GET /api/dashboard/summary` |

Daftar parameter dan skema request/response lengkap tersedia di Scalar/OpenAPI.

## Build dan test

Backend lokal, dari folder `backend/`:

```bash
pnpm build
pnpm test
pnpm test:e2e
```

Frontend, dari folder `frontend/`:

```bash
pnpm build
```

Test backend mencakup unit test service/validasi serta HTTP feature test untuk alur order, response API, dan autentikasi. E2E menggunakan listener HTTP lokal sehingga lingkungan test harus mengizinkan bind ke loopback.

## Asumsi dan keterbatasan

- Aplikasi mencatat penjualan; payment gateway, pembatalan, refund, dan role/permission granular belum termasuk lingkup.
- Test frontend otomatis dan browser E2E belum tersedia.
- Compose menjalankan seluruh stack. Build container memerlukan akses registry package saat pertama kali dijalankan.
- Perbandingan tren dashboard memakai tujuh hari terakhir dibanding tujuh hari sebelumnya, dengan zona waktu Asia/Jakarta.
- Sesuai instruksi soal, akun dan password demo bersifat lokal. Ganti secret JWT, password database, dan konfigurasi kredensial sebelum deployment.

## AI Usage

OpenAI Codex digunakan sebagai asisten untuk membantu implementasi dan review kode, termasuk API, query/migration Drizzle, seeder, UI Vue, dokumentasi, dan diagnosis build/test. Pemilik repository bertanggung jawab meninjau, memahami, menguji, dan memelihara seluruh kode.
