# Architecture

This document describes the application as it exists at the end of Phase 1.

## Stack

- Next.js 16.4.5 App Router, React 19, TypeScript
- Tailwind CSS 4
- Prisma 7 with the `prisma-client` generator, output at `src/generated/prisma`
- PostgreSQL through `@prisma/adapter-pg`
- Zod for input validation
- bcryptjs (cost 12) for passwords
- Vitest for automated tests

The database URL is read from `prisma.config.ts`, not from the Prisma schema. `server-only` marks server modules so they are not imported by client components.

## Request path

Browser forms post to Server Actions in `src/server/actions`. Each action loads the current session, checks a permission, calls a service, and redirects or returns an error state. Pages in `src/app/(app)` do the same permission check before reading data. There is no separate REST API in Phase 1.

```
Browser form
  -> Server Action (auth + permission)
    -> Service (rules, Prisma, audit)
      -> PostgreSQL
```

Pages are dynamic. The root layout sets `dynamic = "force-dynamic"` so a production build does not try to prerender screens that need the database.

## Layout

| Path | Responsibility |
| --- | --- |
| `src/app/(app)` | Signed-in shell: dashboard and `/admin/*` |
| `src/app/login` | Sign-in and required password change |
| `src/components` | Shell, navigation, and administration forms |
| `src/server/services` | Business rules and database access |
| `src/server/access` | Permission catalogue, guards, and department scope |
| `src/server/auth` | Cookies, password hashing, current user |
| `src/server/actions` | Mutations invoked by forms |
| `prisma` | Schema, migrations, seed |

## Authentication

A successful sign-in stores a random session token in the `helpdesk_session` cookie and stores only the SHA-256 hash of that token in `sessions`. The cookie is `HttpOnly` and `SameSite=Lax`. `Secure` is set when `NODE_ENV` is `production`. Logout and password reset set `revokedAt`. Expired or revoked rows are rejected.

## Authorisation

Permissions live in `src/server/access/catalog.ts` and are copied into the database by `syncAccessCatalog`. Services call `assertPermission` before they read or write. Navigation hides links the user cannot open, but hiding a link is not the control: the page and the action both check again.

Department heads who do not also hold System Administrator, IT Manager, or IT Technician are limited to their department and its descendants. Those three roles see the whole organisation for the permissions they hold. IT Manager and IT Technician can read departments and locations. They cannot manage users, roles, audit, or settings.

## Audit

Services call `writeAudit` after a successful change. Metadata is passed through `redact` so passwords, hashes, tokens, and secrets are not stored. There is no update or delete function for audit rows. Ordinary users have no audit permission. The database itself does not have an immutability trigger; integrity is enforced in the application.

## What is not in this phase

AI assistant, tickets, knowledge base, assets, technician assignment, SLA, and reports appear in the sidebar as labels only. They have no routes, tables, or services.
