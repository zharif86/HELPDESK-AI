# Phase 1 completion report

## Executive summary

Phase 1 is complete. The helpdesk keeps the existing Next.js, Prisma, and PostgreSQL design. Administration screens read and write the `helpdesk` database. Sign-in, sessions, permissions, and the business rules covered below were exercised by Vitest. The browser was used against the running development server.

Phase 2 was not started. Tickets, knowledge, assets, SLA, technicians, reports, and the assistant remain unavailable.

## Implemented features

- Sign-in, required password change, sign-out, session expiry, and session revocation.
- Account lockout from `security.maxFailedLogins` and `security.lockoutMinutes`, plus a single-process request limiter.
- User list with search and filters for status, department, and role. Create, edit, role assignment, department, location, activate, deactivate, temporary password reset, and account history.
- Departments with parent, head, active flag, and rejection of a parent that would create a cycle.
- Locations with building, floor, room, department, and active flag.
- Roles and permissions by module. System roles cannot be deleted. System Administrator keeps its locked permissions. A user cannot grant System Administrator or a role that contains a permission they do not hold.
- Department heads see their own department and its descendants. IT Manager and IT Technician can read organisation departments and locations and cannot manage users.
- Audit list with text, action, and date filters. No edit or delete action.
- Settings for organisation name, support email, session length, failure limit, and lockout length. Changes are audited.
- Sidebar links match permissions. Unfinished modules are labels under “In development”.

## Database changes

Migration `20261125090000_phase1_integrity` was applied to the development database `helpdesk` and to `helpdesk_test`:

- Foreign key `user_roles.assigned_by_id` → `users.id` with `ON DELETE SET NULL`.
- Index `user_roles_assigned_by_id_idx`.
- `departments.read` and `locations.read` granted to the existing Department Head role.

No tables were dropped and no existing rows were deleted. The development database still holds the seeded organisation plus one inactive verification account, Phase One Check (`phase1.check@helpdesk.local`).

## Security improvements

- bcrypt cost 12, password policy, and generic failure text for an unknown email or a wrong password.
- A correct password on an inactive account is the only case that says the account is disabled.
- Session cookie `helpdesk_session` is `HttpOnly` and `SameSite=Lax`. `Secure` is set when `NODE_ENV` is `production`. Only the SHA-256 hash is stored.
- Server Actions check the caller and the permission. Next.js checks Origin and Host on those actions.
- Last active System Administrator cannot be deactivated or removed from that role. A person cannot deactivate their own account.
- Audit metadata is redacted. Passwords, hashes, and tokens are not written there.
- Production seed refuses demonstration data, `SEED_ADMIN_MUST_CHANGE=false`, and the known local development passwords. Those values still work for this local database because `NODE_ENV` is not `production`.

## Interfaces verified in the browser

Checked at http://localhost:3000 while signed in as the system administrator:

- Dashboard: 4 accounts before the extra account, 3 departments, 2 locations, role counts, and recent audit rows from the database.
- Users: search for “Aina” returned Aina Rahman only. A new account was created with Finance, Headquarters Level 1, and the Employee role, then deactivated. History showed the create and deactivate rows.
- Departments: Finance, Human Resource, Information Technology.
- Locations: Headquarters Level 1 and Level 3.
- Roles: five system roles with live account and permission counts.
- Audit: filters and the new user events, including `user.created` and `user.deactivated`.
- Settings: organisation name, support email, session hours 8, 5 failures, 15 minute lockout.

Signed out, then signed in as `employee@helpdesk.local`. The session stopped on the required password change. Opening `/admin/users` returned to that same screen. The password was not changed. That session was revoked afterwards. Automated tests cover employee, IT manager, technician, and department-head denials after a normal session.

The Next.js issue badge during this browser pass reported a hydration mismatch on attributes injected by the browser inspector (`data-cursor-ref`). The server log shows the same attribute diff. It is not an application markup error in `PageHeader`.

## Automated testing results

Command: `npm test` (Vitest 4.1.12 against `helpdesk_test`).

Latest run, 25 Nov 2026, 09:05 local time:

- Test files: 4 passed
- Tests: 21 passed
- Duration: 15.10s

The same 21 tests had already passed once earlier in this session (17.78s) before the role-description sync change. They were run again after that change.

Also run, all clean:

- `npx eslint . --max-warnings 0`
- `npx tsc --noEmit`
- `npx prisma validate`
- `npx prisma migrate deploy` on `helpdesk` (integrity migration applied) and on `helpdesk_test`

## Known limitations

- No emailed “forgot password” flow. An administrator sets a temporary password.
- Audit rows are append-only in application code. The database has no immutability trigger.
- The sign-in rate limiter is in memory for one Node process. Database lockout still applies on every process.
- Docker Compose was not started here. Docker is not installed on this workstation. The files are in the repository. Local `npm run dev` remains the working path.
- Department and location screens deactivate records. They do not offer a separate delete.
- Future modules have no routes or tables.

## Outstanding issues

None that block Phase 1 administration. The inactive Phase One Check account can stay as a record of this verification or be left inactive.

## How to run

```bash
npm install
npm run dev
```

Open http://localhost:3000. The administrator email and password are `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the local `.env`, which is not committed. Do not reuse that password in production.

```bash
npm run lint
npm run typecheck
npm test
```

## Acceptance

Phase 1 acceptance criteria for accounts, organisation structure, roles, audit, settings, server-side access control, and the tests listed above are met. Phase 2 has not been started.
