# Changelog

## 0.2.0 — Phase 2

- Helpdesk tickets with concurrency-safe numbers `INC-YYYY-######`.
- Configurable categories, impact/urgency priority matrix, and status workflow.
- Assignment history, public comments, internal notes, activity timeline.
- Secure private attachments with authorised downloads.
- Role-scoped ticket lists, technician workspace, unassigned queue, and dashboard statistics from live data.
- Ticket permissions integrated into the existing RBAC catalogue.
- Migration `20261126040000_phase2_helpdesk_core` without rewriting Phase 1 migrations.

## 0.1.0 — Phase 1

- Sign-in, sessions, lockout, password change, and administrator password reset.
- User, department, location, role, audit, and settings screens backed by PostgreSQL.
- Server-side permission checks, department-head scoping, and last-administrator protection.
- Vitest coverage for authentication, authorisation, administration, and business rules.
