import { useState } from "react";
import { useHostels } from "@/hooks/useHostels";
import type { ManagedWarden } from "@/lib/wardens";
import ImageUpload from "@/pages/manage/components/ImageUpload";

export type WardenFormValues = {
  name: string;
  email: string;
  phone: string;
  position: string;
  hostelId: string;
  role: string;
  password: string;
  avatarUrl: string;
};

type Props = {
  mode: "create" | "edit";
  warden?: ManagedWarden;
  saving: boolean;
  error: string;
  onSubmit: (values: WardenFormValues) => void;
  onClose: () => void;
};

export default function WardenFormModal({ mode, warden, saving, error, onSubmit, onClose }: Props) {
  const { hostels } = useHostels();
  const [values, setValues] = useState<WardenFormValues>({
    name: warden?.name ?? "",
    email: warden?.email ?? "",
    phone: warden?.phone ?? "",
    position: warden?.position ?? "Warden",
    hostelId: warden?.hostel_id ? String(warden.hostel_id) : "",
    role: warden?.role ?? "warden",
    password: "",
    avatarUrl: warden?.avatar_url ?? "",
  });

  const set = (patch: Partial<WardenFormValues>) => setValues((v) => ({ ...v, ...patch }));

  const inputClass =
    "w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-foreground-950/40" onClick={onClose}></div>
      <div className="relative bg-background-50 border border-background-200 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-background-200">
          <h3 className="font-heading text-lg font-bold text-foreground-950">
            {mode === "create" ? "Add Warden" : `Edit ${warden?.name ?? "Warden"}`}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 cursor-pointer transition"
            aria-label="Close"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(values);
          }}
          className="px-6 py-5 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">Full Name</label>
            <input value={values.name} onChange={(e) => set({ name: e.target.value })} className={inputClass} placeholder="e.g. Yousaf Mehsood" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">Email</label>
            <input type="email" value={values.email} onChange={(e) => set({ email: e.target.value })} className={inputClass} placeholder="warden@example.com" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">Phone</label>
              <input value={values.phone} onChange={(e) => set({ phone: e.target.value })} className={inputClass} placeholder="03xx xxxxxxx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">Position</label>
              <input value={values.position} onChange={(e) => set({ position: e.target.value })} className={inputClass} placeholder="Warden" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">Assigned Hostel</label>
              <select value={values.hostelId} onChange={(e) => set({ hostelId: e.target.value })} className={`${inputClass} cursor-pointer`}>
                <option value="">Unassigned</option>
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
            {mode === "create" && (
              <div>
                <label className="block text-sm font-medium text-foreground-800 mb-1.5">Role</label>
                <select value={values.role} onChange={(e) => set({ role: e.target.value })} className={`${inputClass} cursor-pointer`}>
                  <option value="warden">Warden</option>
                  <option value="superintendent">Superintendent</option>
                </select>
              </div>
            )}
          </div>
          <div>
            <ImageUpload
              label="Profile Photo"
              value={values.avatarUrl}
              onChange={(url) => set({ avatarUrl: url ?? "" })}
            />
          </div>
          {mode === "create" && (
            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">
                Temporary Password
              </label>
              <input value={values.password} onChange={(e) => set({ password: e.target.value })} className={inputClass} placeholder="At least 6 characters" />
              <p className="text-xs text-foreground-500 mt-1">
                The account will be asked to change this on first login.
              </p>
            </div>
          )}

          {error && <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">{error}</div>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-md text-sm font-medium text-foreground-600 hover:bg-background-100 whitespace-nowrap cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60"
            >
              {saving && <i className="ri-loader-4-line animate-spin"></i>}
              {mode === "create" ? "Create Account" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}