# Frontend

Vue 3 + TypeScript + Vite client for the Order Management API.

## Development

Copy `.env.example` to `.env`, then install and start the app:

```bash
cp .env.example .env
bun install
bun run dev
```

The API base URL is configured with `VITE_API_BASE_URL` (default: `http://localhost:3000/api`).

## Configured libraries

- Vue Router: `/login`, `/dashboard`, `/products`, `/customers`, and `/orders`
- Pinia: application state store
- TanStack Query: API query cache
- PrimeVue with the Aura theme: UI components and styling
- Light, dark, and system appearance modes (saved in local storage)

The login page calls `/auth/login`, stores the access/refresh tokens for the current browser tab, refreshes expired access tokens, and protects the internal routes. The demo button fills `admin@azatech.id` / `ChangeMe123!`; run the backend seeder to create this account. The product page is connected to the list, detail, create, update, and soft-delete API endpoints, with search, sorting, pagination, and validation. Dashboard numbers are sample data, not live API results. Customer and order screens are still to be implemented.
