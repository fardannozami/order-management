FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN npm install --global pnpm@10.12.1

COPY package.json ./
RUN pnpm install

COPY . .
ARG VITE_API_BASE_URL=http://localhost:3000/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN pnpm build

FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
