# Application actions

Phase 1 does not expose a public HTTP API. Screens call Server Actions. Each action requires a live session and the permission named below. Validation errors and permission failures return to the form. Success redirects back to the record.

## Sign-in

| Action | Who | Effect |
| --- | --- | --- |
| Sign in | Anonymous | Creates a session or returns a generic failure, lockout, or disabled-account message |
| Change password | Signed-in user with `mustChangePassword` | Replaces the hash, clears the flag, revokes other sessions |
| Sign out | Signed-in user | Revokes the current session and clears the cookie |

## Users (`users.create`, `users.update`, `users.deactivate`, `users.read`)

| Action | Permission | Effect |
| --- | --- | --- |
| Create user | `users.create` | Inserts the account, hashes the password, assigns roles, writes audit |
| Update user | `users.update` | Updates profile, department, location, and roles |
| Set status | `users.deactivate` | Sets `ACTIVE` or `INACTIVE`. Blocks the last administrator and self-deactivation |
| Reset password | `users.update` | Stores a temporary password, sets `mustChangePassword`, revokes that user's sessions |

List, search, and filters are page reads under `users.read`. Account history is the last 50 audit rows for that user.

## Departments (`departments.manage`, `departments.read`)

Create and update accept code, name, description, parent, head, and active flag. A parent that is the department itself or one of its descendants is rejected. List and detail honour department-head scope.

## Locations (`locations.manage`, `locations.read`)

Create and update accept code, name, building, floor, room, department, and active flag. Scoped the same way as departments.

## Roles (`roles.manage`, `roles.read`)

Create and update accept name, description, and permission keys. Custom roles can be deleted when nobody holds them. System roles cannot be deleted. Privilege rules in `SECURITY.md` apply before the write.

## Settings (`settings.manage`)

Updates organisation name, support email, session hours, max failed logins, and lockout minutes.

## Audit (`audit.read`)

Read-only. Filters: text, action, and a UTC date range. There is no write action for audit rows.
