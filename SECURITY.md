# Security

## Passwords

Passwords are hashed with bcrypt, cost 12. The policy requires 12–128 characters, upper and lower case, a number, a symbol, and no spaces. The password must not contain the email local-part when that part is at least three characters.

A dummy hash is compared when the email is unknown so the failure timing stays closer to a real check. Wrong-password responses stay generic. A correct password on an inactive account returns a disabled-account message. A correct password during lockout returns a locked-account message.

The seed rejects `change-this-password`, `password`, `admin123`, and `Admin123!`, and any password that fails the policy. If `NODE_ENV` is `production`, the seed also rejects the local development passwords and refuses `SEED_DEMO_DATA=true` or `SEED_ADMIN_MUST_CHANGE=false`. Those development values are not production defaults.

Password hashes are never sent to the client or written to the audit log.

## Sign-in limits

`security.maxFailedLogins` (default 5) counts failures. The next failure at the limit sets `locked_until` for `security.lockoutMinutes` (default 15). A successful sign-in clears the counter. An in-memory fixed-window limiter also slows repeated attempts from the same key in a single process. That memory resets when the process restarts and does not coordinate across multiple app instances.

## Sessions

The cookie name is `helpdesk_session`. It is `HttpOnly`, `SameSite=Lax`, and `Secure` in production. The database stores SHA-256 of the token. Lifetime comes from `security.sessionHours` (default 8, maximum 12) and is fixed when the session is created. Logout, password change, and an administrator password reset set `revokedAt` on the relevant sessions. Inactive users fail the session lookup.

## Request checks

Server Actions are checked by Next.js against the request Origin and Host. Every mutation loads the session and calls `assertPermission`. Pages that render administration data do the same.

A user cannot grant `SYSTEM_ADMIN` unless they hold that role. A user cannot grant a role whose permissions they do not already hold. Only a System Administrator can change the System Administrator role. Locked permissions on that role are re-applied even if the form omits them. System roles cannot be deleted.

The last active System Administrator cannot be deactivated or removed from that role. A user cannot deactivate their own account.

Department heads are scoped in the service layer to their department and descendants. IT Manager, IT Technician, and System Administrator queries are organisation-wide, still limited by permission.

## Audit and settings

Audit writes go through `redact`. Keys that look like passwords, hashes, tokens, or secrets are removed. There is no screen or service that edits or deletes audit rows.

Settings that can be changed in the UI are organisation name, support email, session length, failure limit, and lockout length. They are validated with Zod. Changes are audited. Database credentials and other environment values are not shown or edited in the UI.

## What this phase does not claim

There is no multi-instance rate-limit store, no database trigger that blocks audit updates, and no self-service “forgot password” email flow. Password reset is an administrator action that sets a temporary password and revokes sessions.
