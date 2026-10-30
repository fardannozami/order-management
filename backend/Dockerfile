FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN npm install --global pnpm@10.12.1

COPY package.json ./
RUN pnpm install

COPY . .
RUN pnpm build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN npm install --global pnpm@10.12.1

COPY package.json ./
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --prod --frozen-lockfile && pnpm store prune
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle

EXPOSE 3000
CMD ["node", "dist/main.js"]
