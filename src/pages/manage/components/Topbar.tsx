import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AuthUser } from "@/hooks/useAuth";
import { useHostels } from "@/hooks/useHostels";
import { roleLabel } from "@/lib/roles";
import NotificationsBell from "./NotificationsBell";

type Props = {
  user: AuthUser;
  title: string;
  onMenuClick: () => void;
  onLogout: () => void;
};

export default function Topbar({ user, title, onMenuClick, onLogout }: Props) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const { hostels } = useHostels();

  const hostelName =
    user.role === "warden" && user.hostelId
      ? hostels.find((h) => h.id === user.hostelId)?.name
      : "All Hostels";

  const handleLogout = () => {
    onLogout();
    navigate("/manage/login");
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background-50/95 backdrop-blur border-b border-background-200 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 flex items-center justify-center text-foreground-700 cursor-pointer rounded-md hover:bg-background-100"
          aria-label="Toggle menu"
        >
          <i className="ri-menu-line text-xl"></i>
        </button>
        <div className="flex flex-col leading-tight">
          <h1 className="font-heading text-lg font-bold text-foreground-950">{title}</h1>
          <span className="text-[11px] text-foreground-500">{hostelName}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <NotificationsBell />

        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-full hover:bg-background-100 cursor-pointer transition"
          >
            <div className="w-9 h-9 rounded-full bg-secondary-500 text-background-50 flex items-center justify-center text-sm font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="hidden md:flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold text-foreground-900">{user.name}</span>
              <span className="text-[11px] text-foreground-500 capitalize">{roleLabel(user.role)}</span>
            </div>
            <i className="ri-arrow-down-s-line text-foreground-500"></i>
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-background-50 border border-background-200 rounded-lg shadow-sm z-40 py-1">
                <div className="px-4 py-2 border-b border-background-100">
                  <div className="text-sm font-semibold text-foreground-900">{user.name}</div>
                  <div className="text-xs text-foreground-500 truncate">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-accent-700 hover:bg-accent-100 cursor-pointer transition text-left"
                >
                  <i className="ri-logout-box-r-line"></i>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}