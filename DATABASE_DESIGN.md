# Database design

PostgreSQL database `helpdesk` in local development. Prisma schema: `prisma/schema.prisma`. Migrations:

- `20261125002623_phase1_foundation` — initial tables
- `20261125090000_phase1_integrity` — assigning-user foreign key, its index, and Department Head read grants

Primary keys are CUID strings except composite keys on `role_permissions` and `user_roles`, and the string key on `system_settings`.

## Tables

### users

Account record. `email` is unique. `staff_id` is unique when present. `status` is `ACTIVE` or `INACTIVE`. `deleted_at` is the soft-delete marker; administration lists exclude deleted rows. `password_hash` is bcrypt. Failed attempts and `locked_until` support lockout. `must_change_password` forces a password change before the shell is shown.

`department_id` and `location_id` use `ON DELETE SET NULL`. `created_by_id` and `updated_by_id` point at users with the same rule.

### roles, permissions, role_permissions

`roles.key` is unique (`SYSTEM_ADMIN`, `IT_MANAGER`, `TECHNICIAN`, `EMPLOYEE`, `DEPARTMENT_HEAD`, plus any custom role). `is_system` marks the five templates; those roles cannot be deleted. `permissions.key` is unique. `role_permissions` cascades when a role or permission row is removed.

### user_roles

Composite primary key `(user_id, role_id)`. Deleting a user removes assignments. Deleting a role is restricted while assignments exist. `assigned_by_id` references `users` and becomes null if that administrator is removed (`ON DELETE SET NULL`). Index: `user_roles_assigned_by_id_idx`.

### departments

`code` is unique. `parent_id` references departments with `ON DELETE RESTRICT`, so a parent cannot be removed while children exist. The service also rejects a parent that would create a cycle. `head_user_id` becomes null if that user is removed. `deleted_at` is reserved for soft delete; the administration screens activate and deactivate with `is_active`.

### locations

`code` is unique. Optional `building`, `floor`, `room`, and `department_id` (`ON DELETE SET NULL`). `is_active` is the administration switch. `deleted_at` exists and is not used by the current screens.

### sessions

`token_hash` is unique. The raw token is not stored. `expires_at` and `revoked_at` decide whether the cookie is accepted. Deleting a user cascades to sessions.

### audit_logs

Append-only at the application layer. `actor_id` becomes null if the user is removed, so the row remains. Indexes cover actor, action, entity, and time. No application function updates or deletes these rows.

### system_settings

One row per key. Values are JSON. Phase 1 keys:

- `organisation.name`
- `organisation.supportEmail`
- `security.sessionHours` (1–12, default 8)
- `security.maxFailedLogins` (3–10, default 5)
- `security.lockoutMinutes` (5–120, default 15)

`updated_by_id` records the last editor.

## Integrity choices that were not changed

Audit rows are not protected by a database trigger. A trigger would drift from Prisma's migration history without a matching model change. Application code is the control.

Soft-delete columns exist on users, departments, and locations. User administration deactivates accounts (`status = INACTIVE`) rather than setting `deleted_at`. Department and location screens use `is_active`.

## Not in the database

There are no ticket, knowledge, asset, technician-roster, or SLA tables.
