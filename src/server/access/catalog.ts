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

export const ROLE_TEMPLATES = {
  SYSTEM_ADMIN: {
    name: "System Administrator",
    description:
      "Manages accounts, organisation structure, roles, settings, and the audit log.",
    permissions: ALL_PERMISSIONS,
  },
  IT_MANAGER: {
    name: "IT Manager",
    description:
      "Views organisation reference data. Incident supervision arrives in a later phase.",
    permissions: ["dashboard.view", "departments.read", "locations.read"],
  },
  TECHNICIAN: {
    name: "IT Technician",
    description:
      "Views organisation reference data. Assigned technical work arrives in a later phase.",
    permissions: ["dashboard.view", "departments.read", "locations.read"],
  },
  EMPLOYEE: {
    name: "Employee",
    description: "Uses the personal home page. Support requests arrive in a later phase.",
    permissions: ["dashboard.view"],
  },
  DEPARTMENT_HEAD: {
    name: "Department Head",
    description:
      "Views their own department and its child departments. Organisation-wide administration is not included.",
    permissions: ["dashboard.view", "departments.read", "locations.read"],
  },
} as const;

export type RoleKey = keyof typeof ROLE_TEMPLATES;

export function hasPermission(permissions: readonly string[], required: string) {
  return permissions.includes(required);
}
