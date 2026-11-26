export const PERMISSIONS = {
  "dashboard.view": {
    module: "Dashboard",
    description: "View the home dashboard",
  },
  "users.read": {
    module: "Administration",
    description: "View user accounts",
  },
  "users.create": {
    module: "Administration",
    description: "Create user accounts",
  },
  "users.update": {
    module: "Administration",
    description: "Update user accounts and role assignments",
  },
  "users.deactivate": {
    module: "Administration",
    description: "Deactivate or reactivate user accounts",
  },
  "departments.read": {
    module: "Organisation",
    description: "View departments",
  },
  "departments.manage": {
    module: "Organisation",
    description: "Create and update departments",
  },
  "locations.read": {
    module: "Organisation",
    description: "View locations",
  },
  "locations.manage": {
    module: "Organisation",
    description: "Create and update locations",
  },
  "roles.read": {
    module: "Administration",
    description: "View roles and their permissions",
  },
  "roles.manage": {
    module: "Administration",
    description: "Create roles and edit permission grants",
  },
  "audit.read": {
    module: "Administration",
    description: "View the system audit log",
  },
  "settings.manage": {
    module: "Administration",
    description: "Manage organisation and sign-in settings",
  },
  "tickets.read": {
    module: "Helpdesk",
    description: "View all organisation tickets",
  },
  "tickets.read_own": {
    module: "Helpdesk",
    description: "View tickets you requested",
  },
  "tickets.read_department": {
    module: "Helpdesk",
    description: "View tickets for your department tree",
  },
  "tickets.create": {
    module: "Helpdesk",
    description: "Create helpdesk tickets",
  },
  "tickets.update": {
    module: "Helpdesk",
    description: "Update ticket details while working an incident",
  },
  "tickets.assign": {
    module: "Helpdesk",
    description: "Assign or reassign technicians",
  },
  "tickets.change_priority": {
    module: "Helpdesk",
    description: "Override ticket priority with a justification",
  },
  "tickets.change_status": {
    module: "Helpdesk",
    description: "Move a ticket through the workflow",
  },
  "tickets.comment": {
    module: "Helpdesk",
    description: "Add public comments on tickets you can access",
  },
  "tickets.internal_note": {
    module: "Helpdesk",
    description: "Add and read internal technical notes",
  },
  "tickets.resolve": {
    module: "Helpdesk",
    description: "Mark tickets as resolved with a resolution",
  },
  "tickets.close": {
    module: "Helpdesk",
    description: "Close resolved tickets",
  },
  "tickets.reopen": {
    module: "Helpdesk",
    description: "Reopen a resolved or closed ticket with a reason",
  },
  "tickets.cancel": {
    module: "Helpdesk",
    description: "Cancel a ticket with a reason",
  },
  "tickets.export": {
    module: "Helpdesk",
    description: "Export ticket lists you are authorised to view",
  },
  "ticket_categories.manage": {
    module: "Helpdesk",
    description: "Manage incident categories and subcategories",
  },
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as PermissionKey[];

export const LOCKED_SYSTEM_ADMIN_PERMISSIONS = [
  "dashboard.view",
  "users.read",
  "users.update",
  "users.deactivate",
  "roles.read",
  "roles.manage",
  "settings.manage",
  "audit.read",
] as const satisfies readonly PermissionKey[];

const HELPDESK_MANAGER_PERMISSIONS = [
  "dashboard.view",
  "departments.read",
  "locations.read",
  "tickets.read",
  "tickets.create",
  "tickets.update",
  "tickets.assign",
  "tickets.change_priority",
  "tickets.change_status",
  "tickets.comment",
  "tickets.internal_note",
  "tickets.resolve",
  "tickets.close",
  "tickets.reopen",
  "tickets.cancel",
  "tickets.export",
] as const satisfies readonly PermissionKey[];

const HELPDESK_TECHNICIAN_PERMISSIONS = [
  "dashboard.view",
  "departments.read",
  "locations.read",
  "tickets.read_own",
  "tickets.create",
  "tickets.update",
  "tickets.change_status",
  "tickets.comment",
  "tickets.internal_note",
  "tickets.resolve",
  "tickets.reopen",
] as const satisfies readonly PermissionKey[];

export const ROLE_TEMPLATES = {
  SYSTEM_ADMIN: {
    name: "System Administrator",
    description:
      "Manages accounts, organisation structure, roles, settings, the audit log, and helpdesk administration.",
    permissions: ALL_PERMISSIONS,
  },
  IT_MANAGER: {
    name: "IT Manager",
    description:
      "Supervises organisation-wide incidents, assigns technicians, and monitors the helpdesk queue.",
    permissions: [...HELPDESK_MANAGER_PERMISSIONS],
  },
  TECHNICIAN: {
    name: "IT Technician",
    description:
      "Works assigned and unassigned helpdesk tickets. Does not manage accounts or system settings.",
    permissions: [...HELPDESK_TECHNICIAN_PERMISSIONS],
  },
  EMPLOYEE: {
    name: "Employee",
    description: "Creates and follows their own support tickets.",
    permissions: [
      "dashboard.view",
      "tickets.create",
      "tickets.read_own",
      "tickets.comment",
      "tickets.reopen",
    ],
  },
  DEPARTMENT_HEAD: {
    name: "Department Head",
    description:
      "Views their department tree and the incidents raised from those departments.",
    permissions: [
      "dashboard.view",
      "departments.read",
      "locations.read",
      "tickets.read_department",
      "tickets.create",
      "tickets.read_own",
      "tickets.comment",
      "tickets.reopen",
    ],
  },
} as const;

export type RoleKey = keyof typeof ROLE_TEMPLATES;

export function hasPermission(permissions: readonly string[], required: string) {
  return permissions.includes(required);
}
