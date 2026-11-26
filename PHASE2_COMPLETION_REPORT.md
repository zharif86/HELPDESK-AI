# Phase 2 completion report

## Executive summary

Phase 2 (Helpdesk Core) is complete on top of the accepted Phase 1 application. Employees can submit real incidents to PostgreSQL. IT staff can assign, work, comment, resolve, and close tickets under server-enforced workflow and RBAC. Phase 1 migrations and existing user/department data were preserved. Phase 3 was not started.

## Implemented features

- Unique concurrency-safe ticket numbers (`INC-YYYY-######`) via `ticket_number_sequences`
- Configurable categories/subcategories (30 seeded) and impact/urgency → priority matrix (9 rules)
- Ticket create, list, search/filter, detail, technician workspace, unassigned queue
- Assignment / reassignment with history and workload visibility
- Controlled status transitions with resolution / reopen / cancel rules
- Public comments and internal notes (employees never see internal notes)
- Append-only ticket activity timeline plus audit log entries for significant actions
- Secure attachments (type sniffing, size limit, private storage, authorised download)
- Role-scoped helpdesk dashboard statistics from live queries
- Category administration screens
- Ticket permissions integrated into the existing catalogue and synced onto system roles

## Database changes

New migration only: `20261126040000_phase2_helpdesk_core`.

Phase 1 migrations left untouched:

- `20261125002623_phase1_foundation`
- `20261125090000_phase1_integrity`

Applied successfully to `helpdesk` and `helpdesk_test`. Development `helpdesk` retained existing users (verified 5 accounts after migrate/seed). No reset and no deletion of Phase 1 rows as part of this work.

## Security review (Phase 2)

- Ticket IDOR blocked by `assertCanViewTicket` on get/list/mutate paths
- Workflow cannot be bypassed by posting arbitrary statuses
- Internal notes/attachments filtered without `tickets.internal_note`
- Attachment path traversal blocked; files outside `public/`
- Ticket numbers not client-writable
- Sensitive values continue through audit `redact`

Known residual limits (documented, not claimed as complete):

- In-memory sign-in rate limiter is still single-process (Phase 1)
- Audit/activity immutability is application-level, not a DB trigger
- Local disk attachment storage requires backing up `.data/attachments`

## Automated testing results

Command: `npm test` against `helpdesk_test`.

Latest run, 26 Nov 2026, 12:31 local time:

- Test files: **7 passed**
- Tests: **31 passed**
- Duration: 30.15s

Includes all Phase 1 tests plus Phase 2A/2C/2D suites. An earlier 2D failure (`Invalid storage key` because `.` was rejected in keys) was fixed and the suite re-run successfully.

Also run during Phase 2: `npx tsc --noEmit` (clean after implementation), `npx prisma migrate deploy`, `npx prisma db seed` on development.

## Known limitations

- No SLA timers or AI diagnostics (nullable AI fields only)
- No automatic intelligent workload balancing — managers see counts/specialisation and assign manually
- Technicians cannot self-grant `tickets.assign`; managers/admins assign (technicians work assigned/unassigned items)
- Attachment storage is local private disk, not object storage
- Export permission exists in the catalogue; export UI is not shipped in this phase

## Outstanding issues

None that block Phase 2 acceptance criteria listed in the Phase 2 brief.

## How to run

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use local `.env` administrator credentials (not committed).

```bash
npm run lint
npm run typecheck
npm test
```

## Acceptance checklist

1. Users can submit real tickets — yes  
2. Tickets persist in PostgreSQL — yes  
3. Ticket numbers unique / concurrency-safe — yes (sequence + tests)  
4. Categories/subcategories work — yes  
5. Impact/urgency set initial priority — yes  
6. Authorised staff can assign — yes  
7. Status transitions enforced — yes  
8. Comments work — yes  
9. Internal notes protected — yes  
10. Activity history recorded — yes  
11. Attachments stored securely — yes  
12. Role-based ticket access enforced — yes  
13. Department restrictions enforced — yes (department-head scope)  
14. Dashboards use real statistics — yes  
15. Search and filtering work — yes  
16. Automated tests pass — yes (31/31)  
17. Phase 1 tests still pass — yes  
18. Documentation updated — yes  
19. Phase 1 functionality preserved — yes  
20. No critical unresolved security issues identified in this review — yes  

## Confirmation

**Phase 2 acceptance criteria are satisfied.** Waiting for explicit approval before any Phase 3 work.
