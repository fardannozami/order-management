# Backend

REST API untuk aplikasi Order Management, dibangun dengan NestJS, TypeScript, Drizzle ORM, dan PostgreSQL. Panduan utama setup, akun demo, migration, API, dan test tersedia di [README repository](../README.md).

## Menjalankan dengan Docker Compose

Salin file env contoh dari root README lalu jalankan `docker compose up -d`. Compose menjalankan PostgreSQL, migration, seeder, API, dan frontend.

Untuk menjalankan backend secara lokal, gunakan Node.js 24 LTS atau lebih baru dan PostgreSQL yang sudah aktif. Dari folder ini:

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm start:dev
```

API memakai prefix `/api`. Scalar: `http://localhost:3000/`; OpenAPI JSON: `http://localhost:3000/openapi.json`.

## Script

| Perintah | Fungsi |
| --- | --- |
| `pnpm start:dev` | Menjalankan server development dengan watch mode |
| `pnpm build` | Build NestJS |
| `pnpm db:generate` | Membuat SQL migration dari perubahan schema Drizzle |
| `pnpm db:migrate` | Menerapkan migration yang belum dijalankan |
| `pnpm db:seed` | Membuat data user, produk, pelanggan, dan order demo |
| `pnpm test` | Menjalankan unit test |
| `pnpm test:e2e` | Menjalankan HTTP feature test |

Jangan commit `.env`; gunakan `.env.example` sebagai template. Jangan gunakan demo secrets atau akun seed untuk deployment.
