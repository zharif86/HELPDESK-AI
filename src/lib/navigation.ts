export type NavIcon =
  | "dashboard"
  | "tickets"
  | "queue"
  | "users"
  | "departments"
  | "locations"
  | "roles"
  | "audit"
  | "settings"
  | "categories";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  permission?: string;
  anyOf?: string[];
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
    label: "Helpdesk",
    items: [
      {
        href: "/tickets",
        label: "Tickets",
        icon: "tickets",
        anyOf: ["tickets.read", "tickets.read_own", "tickets.read_department"],
      },
      {
        href: "/tickets/new",
        label: "New ticket",
        icon: "tickets",
        permission: "tickets.create",
      },
      {
        href: "/tickets/workspace",
        label: "Technician workspace",
        icon: "queue",
        anyOf: ["tickets.assign", "tickets.read", "tickets.update"],
      },
      {
        href: "/tickets/queue",
        label: "Unassigned queue",
        icon: "queue",
        anyOf: ["tickets.assign", "tickets.read", "tickets.update"],
      },
      {
        href: "/admin/ticket-categories",
        label: "Ticket categories",
        icon: "categories",
        permission: "ticket_categories.manage",
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

function canSee(item: NavItem, permissions: readonly string[]) {
  if (item.anyOf?.length) return item.anyOf.some((key) => permissions.includes(key));
  if (item.permission) return permissions.includes(item.permission);
  return false;
}

export function navigationFor(permissions: readonly string[]): NavGroup[] {
  return GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canSee(item, permissions)),
  })).filter((group) => group.items.length > 0);
}
