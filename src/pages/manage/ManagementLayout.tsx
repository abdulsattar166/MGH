import { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

const titles: Record<string, string> = {
  "/manage": "Dashboard",
  "/manage/hostels": "Hostels",
  "/manage/wardens": "Hostel Admins",
  "/manage/students": "Students",
  "/manage/rooms": "Rooms & Beds",
  "/manage/bookings": "Bookings",
  "/manage/fees": "Fees",
  "/manage/attendance": "Attendance",
  "/manage/complaints": "Complaints",
  "/manage/notices": "Notices",
  "/manage/visitors": "Visitors",
  "/manage/reports": "Reports",
  "/manage/audit-logs": "Audit Logs",
  "/manage/import": "Data Import",
  "/manage/settings": "Settings",
};

export default function ManagementLayout() {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-100">
        <div className="flex flex-col items-center gap-3 text-foreground-600">
          <i className="ri-loader-4-line animate-spin text-3xl"></i>
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/manage/login" replace />;
  }

  // Students are redirected to the public complaint portal.
  if (user.role === "student") {
    return <Navigate to="/complaint" replace />;
  }

  // Admin-only routes are enforced server-side via RLS too, but block early here.
  const adminOnlyPaths = ["/manage/settings", "/manage/wardens", "/manage/audit-logs", "/manage/import"];
  if (
    user.role !== "admin" &&
    adminOnlyPaths.some((p) => location.pathname.startsWith(p))
  ) {
    return <Navigate to="/manage" replace />;
  }

  const title = titles[location.pathname] ?? "Dashboard";

  // Student detail pages (dynamic :id) fall back to a readable title
  const isStudentDetail = location.pathname.startsWith("/manage/students/");
  const resolvedTitle = isStudentDetail ? "Student Details" : title;

  return (
    <div className="min-h-screen bg-background-100">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-20">
        <Sidebar user={user} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground-950/40"
            onClick={() => setMobileOpen(false)}
          ></div>
          <div className="absolute inset-y-0 left-0 w-64">
            <Sidebar user={user} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Topbar
          user={user}
          title={resolvedTitle}
          onMenuClick={() => setMobileOpen(true)}
          onLogout={signOut}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {user.role === "warden" && !user.hostelId && (
            <div className="mb-6 bg-accent-100 text-accent-900 border border-accent-200 rounded-lg px-4 py-3 text-sm">
              Your account hasn't been assigned to a hostel yet. Please contact the owner.
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}