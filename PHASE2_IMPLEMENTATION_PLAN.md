# Phase 2 implementation plan

Inspection date: 26 Nov 2026. Phase 1 remains the base. No database reset. No edits to existing Phase 1 migrations.

## Findings from inspection

- Schema today covers users, roles, permissions, departments, locations, sessions, audit_logs, system_settings only.
- RBAC is catalogue-driven (`src/server/access/catalog.ts`) with `syncAccessCatalog` that **adds missing template permissions** to existing system roles — Phase 2 can extend permissions without re-seeding roles.
- Department scope lives in `visibleDepartmentIds` (null = organisation-wide for SYSTEM_ADMIN / IT_MANAGER / TECHNICIAN). Ticket visibility for technicians must be **stricter than organisation-wide** (assigned + unassigned queue), enforced inside ticket services, not by changing department scope for all modules.
- Mutations use Server Actions + Zod + `assertPermission`. Continue that pattern.
- Local DB: `helpdesk` on `127.0.0.1:5433`. Tests: `helpdesk_test` only. `tests/helpers.ts` truncates a fixed table list — must be extended for new tables.
- Sidebar still lists “Helpdesk Tickets” under In development; navigation will gain real links when screens land (2B+).
- Existing migrations to keep untouched:
  - `20261125002623_phase1_foundation`
  - `20261125090000_phase1_integrity`

## Database rules (non-negotiable)

1. Add only a **new** migration (for example `20261126…_phase2_helpdesk_core`).
2. Never edit or delete Phase 1 migration SQL.
3. Never `prisma migrate reset`, never drop `helpdesk`, never truncate production/dev user data as part of deploy.
4. Tests may truncate **`helpdesk_test` only**, including the new ticket tables.
5. Nullable AI / future fields only — no fake diagnostics.

## Proposed schema (Phase 2A)

| Table | Purpose |
| --- | --- |
| `ticket_categories` | Parent/child categories, description, `is_active`, `sort_order` |
| `ticket_priority_rules` | Unique `(impact, urgency)` → `priority` |
| `ticket_number_sequences` | Per-year counter; concurrency-safe `INSERT … ON CONFLICT DO UPDATE … RETURNING` |
| `tickets` | Incident record + snapshots + workflow + nullable AI readiness fields |
| `ticket_assignments` | Assignment / reassignment history |
| `ticket_comments` | Public vs internal notes |
| `ticket_activities` | Append-only ticket timeline |
| `ticket_attachments` | Metadata; files stored outside public web root (logic in 2D) |

Enums: status, impact, urgency, priority, comment visibility, ticket source (`USER` / `ADMIN` / `AI`).

Ticket number format: `INC-{year}-{6-digit}` from the sequence table inside the create transaction. Not user-editable.

Future hooks without new tables yet: `asset_tag`, nullable `asset_id` (no FK), nullable AI summary / suggested category / suggested priority / confidence / session ref, `source`.

## Permission catalogue (Phase 2A)

Add ticket permissions to `PERMISSIONS` and update `ROLE_TEMPLATES` descriptions and grants:

| Role | Ticket-related grants (summary) |
| --- | --- |
| SYSTEM_ADMIN | All ticket + `ticket_categories.manage` |
| IT_MANAGER | Org-wide read/update/assign/priority/status/comment/internal/resolve/close/reopen/cancel/export; create |
| TECHNICIAN | Create optional; read assigned+queue; update/status/comment/internal/resolve; reopen limited |
| EMPLOYEE | `tickets.create`, `tickets.read_own`, `tickets.comment`, `tickets.reopen` |
| DEPARTMENT_HEAD | `tickets.read_department` (+ create/comment/reopen on own if also employee — combined via multi-role) |

`LOCKED_SYSTEM_ADMIN_PERMISSIONS` stays focused on admin control plane; ticket keys ride on `ALL_PERMISSIONS` for SYSTEM_ADMIN.

## Ticket visibility rules (services)

1. `tickets.read` → organisation-wide.
2. Else `tickets.read_department` → requester department in `visibleDepartmentIds`.
3. Else `tickets.read_own` → `requesterId === actor.id`.
4. Technician without `tickets.read`: assigned to them **or** unassigned (for queue), still never IDOR past that check on get-by-id.
5. Internal notes require `tickets.internal_note` to read or write.

## Subphases

| Subphase | Scope | Exit criteria |
| --- | --- | --- |
| **2A** | Schema, migration, seed categories + priority matrix, permission sync, core services (numbering, categories, priority lookup, create/get foundation) | `migrate deploy` on `helpdesk` and `helpdesk_test`; Phase 1 tests still pass; new 2A tests for number uniqueness / category seed / access foundation |
| **2B** | Create / list / detail / search UI for employees | Real tickets in DB through UI |
| **2C** | Technician workspace, assign/reassign, workflow, comments/notes | Workflow + assignment tests |
| **2D** | Timeline UI, attachments, role dashboards, category admin | Attachment security tests; dashboards from DB |
| **2E** | Full test suite, security review, docs, `PHASE2_COMPLETION_REPORT.md` | Acceptance checklist; stop; wait for approval |

## Out of scope (Phase 2)

AI assistant behaviour, SLA engine, knowledge articles, asset registry, automatic workload balancing, Phase 3 modules.

## Execution note

After this plan: implement **Phase 2A only** next, summarise files and migration, run tests, then continue 2B–2E in order.
