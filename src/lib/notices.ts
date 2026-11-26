const NOTICES: Record<string, string> = {
  created: "Record created.",
  updated: "Changes saved.",
  deactivated: "Account deactivated and signed out.",
  reactivated: "Account reactivated.",
  "password-reset": "Temporary password saved. The person must change it at the next sign-in.",
  "password-changed": "Password changed.",
  "role-created": "Role created.",
  "role-updated": "Role permissions saved.",
  "role-deleted": "Role deleted.",
  "settings-saved": "Organisation settings saved.",
  "ticket-created": "Ticket submitted.",
  "ticket-updated": "Ticket updated.",
  "ticket-assigned": "Technician assigned.",
  "ticket-status": "Ticket status updated.",
  "ticket-comment": "Comment added.",
};

export function noticeMessage(value: string | string[] | undefined) {
  const key = Array.isArray(value) ? value[0] : value;
  if (!key) return null;
  return NOTICES[key] ?? null;
}
