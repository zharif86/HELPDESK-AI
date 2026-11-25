# Changelog

## 0.1.0 — Phase 1

- Sign-in with database sessions, lockout, password change, and administrator password reset.
- User, department, location, role, audit, and settings screens backed by PostgreSQL.
- Server-side permission checks, department-head scoping, and last-administrator protection.
- `user_roles.assigned_by_id` foreign key to the assigning user.
- Department Head read access to departments and locations, limited to their tree.
- Vitest coverage for authentication, authorisation, administration, and business rules.
- Docker Compose file for local PostgreSQL and the app, without publishing the database port.
- Sidebar no longer marks finished administration modules as later work. Future modules stay non-links under “In development”.
