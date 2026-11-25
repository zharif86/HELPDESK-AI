# Testing guide

Tests use Vitest and the application services. They do not drive a browser.

## Database

`npm test` creates `helpdesk_test` on the local PostgreSQL instance if it is missing, applies migrations, then runs Vitest. `vitest.config.ts` points `DATABASE_URL` at `postgresql://helpdesk:helpdesk@127.0.0.1:5433/helpdesk_test`. `tests/setup.ts` stops the run if the URL does not end in `/helpdesk_test`.

Each database-backed file truncates application tables and reloads the permission catalogue. Do not point the test script at the `helpdesk` database.

Start PostgreSQL first (`npm run dev` or `npm run db:up`) so port 5433 is listening.

## Commands

```bash
npm test
npm run lint
npm run typecheck
npx prisma validate
```

## What is covered

`tests/auth.test.ts` — valid login, invalid login, lockout, expired session, revoked session, inactive account.

`tests/authorization.test.ts` — System Administrator can list users; IT Manager cannot; IT Technician cannot create users; Employee cannot manage settings or departments; Department Head sees only their department and cannot list users.

`tests/administration.test.ts` — create and update a user (with audit), create a department and location, reject an unknown permission, refuse to deactivate the last administrator, reject a duplicate email, reject a department cycle, and block sign-in after deactivation.

`tests/rules.test.ts` — cycle detection, password policy, redaction, and the fixed-window limiter. These do not need rows beyond the setup check.

The latest local run is recorded in `PHASE1_COMPLETION_REPORT.md`. Re-run `npm test` after changes; do not copy an old pass into a new claim.
