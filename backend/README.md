<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ bun install
```

## Backend and PostgreSQL with Docker

The `backend/.env` file holds the local PostgreSQL credentials and is ignored by Git. Copy `backend/.env.example` to `backend/.env` if needed, then change its values for your environment. Compose reads `.env.example` as fallback values and lets `backend/.env` override them:

```bash
docker compose up --build
```

The backend waits for PostgreSQL to become healthy and checks the database connection during startup. `DatabaseService` can be injected into other providers to run parameterized PostgreSQL queries. For local development, `backend/.env` uses `PGHOST=127.0.0.1`; run `bun run start:dev` from `backend`. Compose overrides the host to `postgres` inside its network.

For local frontend development, the API allows `http://localhost:5173` by default. Set `CORS_ORIGINS` to a comma-separated list in `.env` when the frontend uses a different origin.

## API response format

All routes use the `/api` prefix. Successful responses are wrapped as `{ "success": true, "message": "OK", "data": ... }`; return `{ data, meta }` from a paginated handler to include pagination metadata. `POST` responses use HTTP 201 and the `Created` message. `204` responses remain empty. Errors use `{ "success": false, "message": "...", "errors": ... }` when field errors are available. The global validation pipe returns HTTP 422, and the exception filter normalizes HTTP errors and hides internal 500 details.

### Login

`POST /api/auth/login` accepts `{ "email": "admin@azatech.id", "password": "..." }` and returns an access token (1 hour) and refresh token (30 days by default). Use `POST /api/auth/refresh` with `{ "refresh_token": "..." }` to rotate both JWTs; a refresh token can be used only once. Use `POST /api/auth/logout` with the bearer access token to revoke that session, and `GET /api/auth/me` to read the signed-in user's profile. All routes other than login and refresh require `Authorization: Bearer <access_token>`. Set `JWT_SECRET` to a random value of at least 32 characters in `backend/.env`; a separate `JWT_REFRESH_SECRET` is recommended and can also be at least 32 characters. Refresh token hashes are stored in PostgreSQL and revoked on rotation/logout. Login requires a seeded user whose password is stored as a bcrypt hash.

Interactive Scalar docs are available at `http://localhost:3000/`; the OpenAPI document is at `/openapi.json`. Configure the local server address in the OpenAPI document from `PORT` when needed. After copying `.env.example` to `.env` and applying migrations, create the demo login users, 20 products, 15 customers, and 30 orders across 30 days with `bun run db:seed`. Demo accounts are `admin@azatech.id`, `supervisor@azatech.id`, and `kasir@azatech.id`; all use password `ChangeMe123!`. This seeder is for local/demo use and exits when `NODE_ENV=production`. Seeding does not overwrite existing users, products, customers, or orders.

### Database migrations

The schema is defined in `src/database/schema.ts`. After changing it, generate a SQL migration and apply pending migrations:

```bash
bun run db:generate
bun run db:migrate
```

Drizzle tracks applied migration files in PostgreSQL. Run these commands from `backend`; local connection settings come from `.env`.

Product endpoints are `GET /api/products` (supports `page`, `per_page`, `search`, `sort=product_name|price|stock`, and `order=asc|desc`), `GET /api/products/:id`, `POST /api/products`, `PUT /api/products/:id`, and `DELETE /api/products/:id`. All require a Bearer access token. Deleted products are hidden from normal product reads and retained with `deleted_at` for historical references.

Customer endpoints are `GET /api/customers` (supports `page`, `per_page`, and name `search`), `POST /api/customers`, `GET /api/customers/:id`, `PUT /api/customers/:id`, and `DELETE /api/customers/:id`. Customer IDs are UUIDs; gender is `Pria` or `Wanita`; deleted customers are soft-deleted.

## Compile and run the project

```bash
# development
$ bun run start

# watch mode
$ bun run start:dev

# production mode
$ bun run start:prod
```

## Run tests

```bash
# unit tests
$ bun run test

# e2e tests
$ bun run test:e2e

# test coverage
$ bun run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ bun install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

This project is already instrumented. To connect it, run this and approve the code it prints at [observe.nestjs.com/link](https://observe.nestjs.com/link) - signing up for free if you have no account:

```bash
$ npx @nestjs/observe link
```

It writes the app key and secret into `.env` and makes every `nest start` script (`start`, `start:dev`, `start:debug`) load it. In production, set `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment instead.

Or do it by hand: create an application and an API key at [observe.nestjs.com](https://observe.nestjs.com), and set the pair as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment the app runs in.

The free plan needs no payment details and covers 300,000 events a month. You can also browse the [live demo](https://www.observe-demo.nestjs.com/dashboard) first - the whole dashboard over a busy service's data, with nothing to install.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observe](https://observe.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
