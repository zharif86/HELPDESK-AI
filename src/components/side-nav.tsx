"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  LayoutDashboard,
  MapPin,
  MonitorSmartphone,
  ScrollText,
  Settings,
  Shield,
  Ticket,
  Users,
  Bot,
  Gauge,
  BarChart3,
} from "lucide-react";
import type { NavGroup, NavIcon } from "@/lib/navigation";
import { isActivePath } from "@/lib/paths";

const ICONS: Record<NavIcon, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  users: Users,
  departments: Building2,
  locations: MapPin,
  roles: Shield,
  audit: ScrollText,
  settings: Settings,
};

const FUTURE = [
  { label: "AI IT Assistant", icon: Bot },
  { label: "Helpdesk Tickets", icon: Ticket },
  { label: "Knowledge Base", icon: BookOpen },
  { label: "IT Assets", icon: MonitorSmartphone },
  { label: "Technicians", icon: Users },
  { label: "SLA", icon: Gauge },
  { label: "Reports", icon: BarChart3 },
];

export function SideNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {groups.map((group) => (
        <div key={group.label ?? "home"}>
          {group.label ? (
            <p className="px-3 pb-2 text-xs font-medium tracking-wide text-slate-400">{group.label}</p>
          ) : null}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                      active ? "bg-white/10 text-white" : "text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div>
        <p className="px-3 pb-2 text-xs font-medium tracking-wide text-slate-400">In development</p>
        <ul className="space-y-1">
          {FUTURE.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <span className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-500">
                  <Icon className="h-4 w-4" aria-hidden />
                  <span className="flex-1">{item.label}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
