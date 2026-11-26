# Administrator guide

Phase 1 administration (users, departments, locations, roles, audit, settings) is unchanged.

## Ticket categories

Open **Ticket categories** to create or edit parent and child categories, set display order, and deactivate categories that should no longer be selected. Categories already used on tickets should be deactivated, not removed.

## Helpdesk oversight

System administrators and IT managers use **Tickets**, **Unassigned queue**, and the dashboard helpdesk section to monitor incidents, assign technicians (with open-ticket counts and optional specialisation), change priority with a recorded reason, and close or cancel tickets.

## Attachments

Uploaded evidence is stored on the application server under `.data/attachments`. Back up that directory with the database if you rely on local storage. Object storage can replace the driver later without changing ticket metadata.
