import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiMode } from "@/lib/api";

export default function Settings() {
  const [adminStatus, setAdminStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [applyingAdmin, setApplyingAdmin] = useState(false);

  const applySuperAdmin = async () => {
    setApplyingAdmin(true);
    setAdminStatus(null);
    if (apiMode) {
      setAdminStatus({ type: "success", text: "Super admin is managed via the backend seed script." });
      setApplyingAdmin(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("ensure-super-admin", { body: {} });
      if (error || data?.error) {
        setAdminStatus({ type: "error", text: error?.message || data?.error || "Could not set the super admin login." });
      } else {
        setAdminStatus({ type: "success", text: "Super admin login is ready." });
      }
    } catch {
      setAdminStatus({ type: "error", text: "Could not set the super admin login. Please try again." });
    } finally {
      setApplyingAdmin(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground-950">Settings</h2>
        <p className="text-sm text-foreground-600 mt-1">
          Account and system-level configuration.
        </p>
      </div>

      <div className="bg-background-50 border border-background-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground-900">Super Admin</h3>
            <p className="text-sm text-foreground-600 mt-1">abdulsattar1717asm@gmail.com</p>
          </div>
          <button
            onClick={applySuperAdmin}
            disabled={applyingAdmin}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-secondary-500 hover:bg-secondary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60"
          >
            {applyingAdmin && <i className="ri-loader-4-line animate-spin"></i>}
            Set Super Admin Login
          </button>
        </div>
        {adminStatus && (
          <div
            className={`mt-3 text-sm rounded-md px-3 py-2 ${
              adminStatus.type === "success" ? "bg-primary-100 text-primary-800" : "bg-accent-100 text-accent-700"
            }`}
          >
            {adminStatus.text}
          </div>
        )}
      </div>
    </div>
  );
}