# Database design

PostgreSQL database `helpdesk` in local development. Prisma schema: `prisma/schema.prisma`. Migrations:

- `20261125002623_phase1_foundation` — initial tables
- `20261125090000_phase1_integrity` — assigning-user foreign key, its index, and Department Head read grants
- `20261126040000_phase2_helpdesk_core` — tickets, categories, priority rules, sequences, assignments, comments, activities, attachments; optional `users.specialisation`

Primary keys are CUID strings except composite keys on `role_permissions` and `user_roles`, the string key on `system_settings`, and integer year on `ticket_number_sequences`.

## Phase 1 tables

Unchanged in behaviour: `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `departments`, `locations`, `sessions`, `audit_logs`, `system_settings`. See earlier Phase 1 notes for constraints. Phase 2 added nullable `users.specialisation` only.

## Phase 2 tables

### ticket_number_sequences

Primary key `year`. `last_value` increments atomically for `INC-{year}-{######}`.

### ticket_categories

Unique `code`. Optional `parent_id` with `ON DELETE RESTRICT`. `is_active`, `sort_order`. Categories referenced by tickets are not deleted; deactivate instead.

### ticket_priority_rules

Unique `(impact, urgency)` → `priority`.

### tickets

Unique `number`. Status, impact, urgency, priority enums. Requester required (`ON DELETE RESTRICT`). Department/location/incident location use `ON DELETE SET NULL`. Category/subcategory use `ON DELETE RESTRICT`. Assignee `ON DELETE SET NULL`. Snapshot fields store requester department/location names at creation. Nullable AI readiness fields and `asset_id` (no FK) are reserved for later modules. `source` is `USER`, `ADMIN`, or `AI`.

### ticket_assignments

History of assignments. Cascade delete with ticket. Assignee restrict. Assigning officer set null if removed.

### ticket_comments

`PUBLIC` or `INTERNAL` visibility. Cascade with ticket. Author restrict.

### ticket_activities

Append-only timeline. Actor set null if removed. Cascade with ticket.

### ticket_attachments

Metadata only. `storage_key` unique. Files live on private disk. Internal flag hides employee downloads. Cascade with ticket.

## Integrity choices

- Phase 1 migrations are never rewritten.
- Audit and ticket activity immutability are application-level.
- No ticket, knowledge, asset, or SLA tables beyond the Phase 2 ticket module.
