# Security

Phase 1 controls remain in force (passwords, lockout, sessions, CSRF origin checks on Server Actions, privilege escalation rules, last-administrator protection, audit redaction). Phase 2 adds the following.

## Ticket access

Every ticket read and mutation loads the ticket and runs `assertCanViewTicket`. Changing a ticket id in the URL or form cannot bypass that check. Employees see their own tickets. Department heads see their department tree. IT managers and system administrators with `tickets.read` see the organisation. Technicians without org-wide read see assigned tickets and the unassigned queue only.

## Workflow

Status transitions are validated server-side against `TICKET_TRANSITIONS`. Resolution, reopen, and cancellation reasons are required where the workflow demands them. Ticket numbers cannot be set by clients.

## Comments and attachments

Internal notes and internal attachments are filtered out for callers without `tickets.internal_note`. Uploads validate extension and sniffed content type, reject executables, cap size at 5 MB, use random storage keys, and block path traversal. Files are stored under `.data/attachments`, not in `public/`. Downloads re-check authorisation.

## Production seed

Development demonstration passwords remain blocked when `NODE_ENV=production`. Do not enable `SEED_DEMO_DATA` in production.
