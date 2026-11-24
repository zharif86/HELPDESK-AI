export type NavIcon =
  | "dashboard"
  | "users"
  | "departments"
  | "locations"
  | "roles"
  | "audit"
  | "settings";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  permission: string;
};

export type NavGroup = {
  label: string | null;
  items: NavItem[];
};

const GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: "dashboard",
        permission: "dashboard.view",
      },
    ],
  },
  {
    label: "Organisation",
    items: [
      {
        href: "/admin/departments",
        label: "Departments",
        icon: "departments",
        permission: "departments.read",
      },
      {
        href: "/admin/locations",
        label: "Locations",
        icon: "locations",
        permission: "locations.read",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        href: "/admin/users",
        label: "Users",
        icon: "users",
        permission: "users.read",
      },
      {
        href: "/admin/roles",
        label: "Roles",
        icon: "roles",
        permission: "roles.read",
      },
      {
        href: "/admin/audit",
        label: "Audit log",
        icon: "audit",
        permission: "audit.read",
      },
      {
        href: "/admin/settings",
        label: "Settings",
        icon: "settings",
        permission: "settings.manage",
      },
    ],
  },
];

export function navigationFor(permissions: readonly string[]): NavGroup[] {
  return GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => permissions.includes(item.permission)),
  })).filter((group) => group.items.length > 0);
}
