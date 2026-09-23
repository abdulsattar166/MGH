import { NavLink } from "react-router-dom";
import type { AuthUser } from "@/hooks/useAuth";
import { roleLabel } from "@/lib/roles";

type Role = AuthUser["role"];

type NavItem = {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  roles?: Role[];
  wardenLabel?: string;
};

const navItems: NavItem[] = [
  { to: "/manage", label: "Dashboard", icon: "ri-dashboard-line", end: true },
  { to: "/manage/hostels", label: "Hostels", icon: "ri-building-2-line", wardenLabel: "My Hostel" },
  { to: "/manage/buildings", label: "Buildings", icon: "ri-building-4-line" },
  { to: "/manage/blocks", label: "Blocks", icon: "ri-layout-grid-line" },
  { to: "/manage/wardens", label: "Hostel Admins", icon: "ri-user-star-line", roles: ["admin"] },
  { to: "/manage/rooms", label: "Rooms & Beds", icon: "ri-door-open-line" },
  { to: "/manage/import", label: "Data Import", icon: "ri-file-excel-2-line", roles: ["admin"] },
  { to: "/manage/students", label: "Students", icon: "ri-group-line" },
  { to: "/manage/bookings", label: "Bookings", icon: "ri-bookmark-line" },
  { to: "/manage/complaints", label: "Complaints", icon: "ri-tools-line" },
  { to: "/manage/improvements", label: "Improvements", icon: "ri-lightbulb-line", roles: ["admin", "warden"] },
  { to: "/manage/notices", label: "Notices", icon: "ri-megaphone-line" },
  { to: "/manage/fees", label: "Fees", icon: "ri-money-rupee-circle-line", roles: ["admin", "superintendent", "warden"] },
  { to: "/manage/attendance", label: "Attendance", icon: "ri-calendar-check-line", roles: ["admin", "superintendent", "warden"] },
  { to: "/manage/visitors", label: "Visitors", icon: "ri-user-received-line", roles: ["admin", "superintendent"] },
  { to: "/manage/reports", label: "Reports", icon: "ri-bar-chart-line" },
  { to: "/manage/audit-logs", label: "Audit Logs", icon: "ri-file-list-3-line", roles: ["admin"] },
  { to: "/manage/settings", label: "Settings", icon: "ri-settings-3-line", roles: ["admin"] },
];

type Props = {
  user: AuthUser;
  onNavigate?: () => void;
};

export default function Sidebar({ user, onNavigate }: Props) {
  const items = navItems.filter((i) => !i.roles || i.roles.includes(user.role));

  return (
    <div className="flex h-full flex-col bg-background-50 border-r border-background-200">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-background-200">
        <img
          src="https://static.readdy.ai/image/773d73dcd4bfe3b3ab546a821d990052/7b72bbd942d6c3a71db63e797abcba69.png"
          alt="Mubarak Group of Hostels"
          className="h-9 w-auto"
        />
        <div className="flex flex-col leading-tight">
          <span className="font-heading text-sm font-bold text-foreground-950">
            Mubarak Group
          </span>
          <span className="text-[9px] tracking-[0.2em] uppercase text-foreground-500">
            Management
          </span>
        </div>
      </div>

      <div className="px-3 py-3 flex-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-400">
          Menu
        </div>
        <nav className="space-y-1">
          {items.map((item) => {
            const label = user.role === "warden" && item.wardenLabel ? item.wardenLabel : item.label;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-primary-100 text-primary-800"
                      : "text-foreground-600 hover:bg-background-100 hover:text-foreground-900"
                  }`
                }
              >
                <i className={`${item.icon} text-lg w-5 text-center`}></i>
                {label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-3 border-t border-background-200">
        <div className="px-3 pt-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground-400">
            Signed in as
          </div>
          <div className="mt-2 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-secondary-500 text-background-50 flex items-center justify-center text-sm font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-sm font-semibold text-foreground-900 truncate">
                {user.name}
              </span>
              <span className="text-[11px] text-foreground-500 capitalize">
                {roleLabel(user.role)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}