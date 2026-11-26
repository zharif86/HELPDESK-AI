# Testing guide

Tests use Vitest and application services against `helpdesk_test` only.

## Database

`npm test` creates `helpdesk_test` if missing, applies migrations, then runs Vitest. Setup refuses any `DATABASE_URL` that does not end with `/helpdesk_test`. Truncation includes Phase 2 ticket tables, then reloads the permission catalogue, settings, categories, and priority matrix.

Start PostgreSQL first (`npm run dev` or `npm run db:up`).

## Commands

```bash
npm test
npm run lint
npm run typecheck
npx prisma validate
```

## Coverage

Phase 1 suites: authentication, authorisation, administration, rules.

Phase 2 suites:

- `tests/phase2a-tickets.test.ts` — categories, priority matrix, unique numbers, invalid category, IDOR, transitions map
- `tests/phase2c-workflow.test.ts` — assignment, invalid transitions, resolution/reopen reasons, internal notes, assign permission
- `tests/phase2d-attachments.test.ts` — file type/size rejection, internal download protection, dashboard totals from real rows

Latest results are recorded in `PHASE2_COMPLETION_REPORT.md`. Re-run after changes; do not copy an old pass forward.
