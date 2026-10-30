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

The dashboard and login currently show UI previews. Product, customer, and order screens and API calls are still to be implemented. Dashboard numbers are sample data, not live API results.
