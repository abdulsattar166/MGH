import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationsBell() {
  const { items, unread, loading, refresh, markRead, markAllRead, remove } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open) void refresh();
  };

  const handleClick = async (n: (typeof items)[number]) => {
    if (!n.isRead) await markRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const typeIcon = (type: string): { box: string; icon: string } => {
    switch (type) {
      case "booking":
        return { box: "bg-primary-100", icon: "ri-bookmark-line text-primary-600" };
      case "fee":
        return { box: "bg-secondary-100", icon: "ri-money-rupee-circle-line text-secondary-700" };
      case "attendance":
        return { box: "bg-secondary-100", icon: "ri-calendar-check-line text-secondary-700" };
      case "complaint":
        return { box: "bg-accent-100", icon: "ri-tools-line text-accent-700" };
      case "improvement":
        return { box: "bg-accent-100", icon: "ri-lightbulb-line text-accent-700" };
      case "system":
        return { box: "bg-background-200", icon: "ri-information-line text-foreground-600" };
      default:
        return { box: "bg-primary-100", icon: "ri-notification-3-line text-primary-600" };
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="w-10 h-10 flex items-center justify-center text-foreground-600 cursor-pointer rounded-md hover:bg-background-100 relative"
        aria-label="Notifications"
      >
        <i className="ri-notification-3-line text-xl"></i>
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-600 text-background-50 text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[340px] sm:w-[380px] max-w-[92vw] bg-background-50 border border-background-200 rounded-xl shadow-lg z-40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-background-200">
            <div className="flex items-center gap-2">
              <i className="ri-notification-3-line text-foreground-600"></i>
              <span className="text-sm font-bold text-foreground-950">Notifications</span>
              {unread > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-accent-100 text-accent-900 text-[11px] font-bold">
                  {unread} new
                </span>
              )}
            </div>
            {items.length > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 cursor-pointer whitespace-nowrap"
              >
                <i className="ri-check-double-line"></i> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-background-100">
            {loading && items.length === 0 ? (
              <div className="py-12 text-center text-foreground-500">
                <i className="ri-loader-4-line animate-spin text-2xl inline-block"></i>
                <p className="mt-2 text-xs">Loading notifications…</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center">
                <i className="ri-notification-off-line text-3xl text-foreground-300"></i>
                <p className="mt-3 text-sm text-foreground-500">No notifications yet</p>
                <p className="text-xs text-foreground-400">
                  Booking, fee and attendance updates will appear here.
                </p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => void handleClick(n)}
                  className="w-full text-left px-4 py-3 hover:bg-background-100 transition flex items-start gap-3 cursor-pointer"
                >
                  <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${typeIcon(n.type).box}`}>
                    <i className={`${typeIcon(n.type).icon} text-base`}></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground-900 truncate">
                        {n.title}
                      </span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0"></span>}
                    </div>
                    {n.message && (
                      <p className="text-xs text-foreground-600 line-clamp-2 mt-0.5">{n.message}</p>
                    )}
                    <span className="text-[10px] text-foreground-400 mt-1 block">
                      {new Date(n.createdAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {n.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void remove(n.id);
                      }}
                      className="self-start text-foreground-300 hover:text-accent-600 cursor-pointer p-0.5"
                      aria-label="Delete notification"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-background-200 bg-background-100 text-center">
            <span className="text-[11px] text-foreground-500">
              Notifications update automatically every 20 seconds.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}