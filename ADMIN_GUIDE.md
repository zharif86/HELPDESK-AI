# Administrator guide

Sign in with the administrator account created by the seed (`ADMIN_EMAIL` in `.env`). If the account is flagged to change its password, the next screen asks for a new one before the dashboard opens.

The sidebar shows only sections your roles allow. System Administrators see Dashboard, Departments, Locations, Users, Roles, Audit, and Settings. Entries under “In development” are not links.

## Users

Open **Users**. Search by name, email, or staff id. Filter by status, department, or role.

**New user** requires name, email, and a password that meets the policy. Optional fields: staff id, phone, job title, department, location, and roles. The account is active and must change the password at the next sign-in.

Open a row to edit the profile, department, location, and roles. You cannot assign System Administrator unless you are one. You cannot assign a role that includes a permission you do not hold.

**Deactivate** blocks sign-in and is refused for your own account and for the last active System Administrator. **Activate** restores an inactive account. **Reset password** sets a temporary password, forces a change, and signs that user out. **Account history** lists recent audit rows for that person.

## Departments

Create a department with a unique code and name. Choose a parent to build a tree. Choose a head from active users. Clearing the active flag hides it from assignment lists but keeps the record.

You cannot set a parent that would make a department sit under itself. A department that still has children cannot be removed through the database; the screen does not offer delete.

Department Heads see their own department and child departments only.

## Locations

Create a location with a unique code and name. Building, floor, room, and department are optional. Clear the active flag to retire it without deleting history.

## Roles

The five system roles are listed with the permissions stored for them. You can add a custom role and tick permissions by module. System Administrator keeps a fixed set of permissions even if those boxes are cleared. System roles cannot be deleted. A custom role that is still assigned cannot be deleted until those assignments are removed.

## Audit

Filter by text, action, and dates. The date filter uses UTC days. Each row shows actor, action, summary, and metadata. Metadata does not contain passwords or session tokens. Rows cannot be edited here.

## Settings

Set the organisation name and an optional support email. Session length applies to new sign-ins. The failure limit and lockout length apply from the next failed attempt. The change is written to the audit log.
