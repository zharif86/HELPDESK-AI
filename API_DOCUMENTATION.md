# Application actions

Phase 2 still has no public REST API for business mutations. Screens call Server Actions. Attachment download is a GET route handler with session checks.

## Sign-in and administration

Unchanged from Phase 1: sign-in, password change, sign-out, users, departments, locations, roles, settings, audit reads.

## Tickets

| Action | Permission | Effect |
| --- | --- | --- |
| Create ticket | `tickets.create` | Allocates number, calculates priority, writes activity + audit |
| Assign / reassign | `tickets.assign` | Creates assignment history, may move status to `ASSIGNED` |
| Change status | `tickets.change_status` or resolve/close/reopen/cancel | Validates transition; resolution/reason rules apply |
| Override priority | `tickets.change_priority` | Requires justification; audited |
| Public comment | `tickets.comment` | Visible to ticket participants |
| Internal note | `tickets.internal_note` | Hidden from employees |
| Upload attachment | `tickets.comment` (+ internal note for internal files) | Stores under `.data/attachments` |

## Categories

| Action | Permission | Effect |
| --- | --- | --- |
| Create / update category | `ticket_categories.manage` | Parent/child, active flag, sort order |

## Downloads

`GET /api/tickets/attachments/[id]` — requires a live session and ticket access. Internal attachments require `tickets.internal_note`.
