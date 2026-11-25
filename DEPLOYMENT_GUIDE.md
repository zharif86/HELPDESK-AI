# Deployment guide

## Local development without Docker

This is the workflow used on this workstation. Docker is optional.

1. Install Node.js 22 or newer and npm.
2. Copy `.env.example` to `.env`.
3. Set `ADMIN_NAME`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` that meets the password policy.
4. Leave `SEED_DEMO_DATA=false` unless you want the local sample departments.
5. Run `npm install` and `npm run dev`.

`npm run dev` starts embedded PostgreSQL on `127.0.0.1:5433` (data under `.data/`), applies migrations, seeds when the administrator is missing, and starts Next.js on port 3000. The database port is bound to localhost only.

Useful scripts:

- `npm run db:up` — database only
- `npm run db:migrate` — `prisma migrate deploy`
- `npm run db:seed` — seed using `.env`

Do not commit `.env`.

## Docker Compose

`docker-compose.yml` builds the app and runs PostgreSQL 16. The database has a named volume `helpdesk-pg` and a health check. Its port is not published to the host. The app publishes port 3000 and overrides `DATABASE_URL` to `db:5432`. The container still reads `.env` for the administrator seed values, so those values must be production-safe before you use Compose as a deployment.

On startup the image runs `prisma migrate deploy` and then `next start`. The image uses Next.js `output: "standalone"` only as a build setting; the container command runs `next start` from the full install so Prisma's CLI remains available for migrations.

```bash
docker compose up --build
```

Docker is not required for the local `npm run dev` workflow. This workstation does not need Docker installed to develop.

## Production notes

- Set `NODE_ENV=production` so the session cookie is `Secure` and the seed refuses demonstration passwords.
- Use a long unique `ADMIN_PASSWORD`. Do not reuse the password from a development `.env`.
- Keep `SEED_DEMO_DATA` unset or `false`.
- Leave `SEED_ADMIN_MUST_CHANGE` at its default (`true`) so the first administrator replaces the seed password.
- Put PostgreSQL on a private network. Do not publish port 5432 to the internet.
- Terminate HTTPS in front of the app. The app does not terminate TLS itself.
- One Node process holds the in-memory sign-in limiter. Account lockout in the database still applies on every instance.
