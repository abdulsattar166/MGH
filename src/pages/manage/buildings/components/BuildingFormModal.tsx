import { useEffect, useState, type FormEvent } from "react";
import type { Building } from "@/lib/buildingsDb";
import type { HostelRef } from "@/lib/roomsDb";

export type BuildingFormValues = {
  name: string;
  hostelId: number;
  description: string;
  status: string;
};

type Props = {
  open: boolean;
  building: Building | null;
  hostels: HostelRef[];
  fixedHostelId?: number | null;
  saving: boolean;
  error: string;
  onSubmit: (values: BuildingFormValues) => void;
  onClose: () => void;
};

const inputClass =
  "w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";

export default function BuildingFormModal({
  open,
  building,
  hostels,
  fixedHostelId,
  saving,
  error,
  onSubmit,
  onClose,
}: Props) {
  const [values, setValues] = useState<BuildingFormValues>({
    name: "",
    hostelId: fixedHostelId ?? hostels[0]?.id ?? 0,
    description: "",
    status: "active",
  });

  useEffect(() => {
    if (!open) return;
    setValues({
      name: building?.name ?? "",
      hostelId: building?.hostelId ?? fixedHostelId ?? hostels[0]?.id ?? 0,
      description: building?.description ?? "",
      status: building?.status ?? "active",
    });
  }, [open, building, hostels, fixedHostelId]);

  if (!open) return null;

  const set = (patch: Partial<BuildingFormValues>) => setValues((v) => ({ ...v, ...patch }));

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!values.name.trim()) return;
    onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground-950/50" onClick={onClose}></div>
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-background-50 rounded-2xl border border-background-200">
        <div className="sticky top-0 bg-background-50 border-b border-background-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground-950">
              {building ? "Edit Building" : "Add Building"}
            </h2>
            <p className="text-xs text-foreground-500">
              {building ? "Update building details" : "Register a new building"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 cursor-pointer"
            aria-label="Close"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">
              Building Name <span className="text-accent-600">*</span>
            </label>
            <input
              className={inputClass}
              value={values.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Building 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">Hostel</label>
            <select
              className={`${inputClass} cursor-pointer`}
              value={values.hostelId}
              onChange={(e) => set({ hostelId: Number(e.target.value) })}
              disabled={Boolean(fixedHostelId)}
            >
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">Status</label>
            <select
              className={`${inputClass} cursor-pointer`}
              value={values.status}
              onChange={(e) => set({ status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">Description</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              maxLength={500}
              value={values.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Short description of the building"
            />
          </div>

          {error && (
            <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">{error}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-md border border-background-300 text-foreground-700 text-sm font-semibold whitespace-nowrap hover:bg-background-100 cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60"
            >
              {saving && <i className="ri-loader-4-line animate-spin"></i>}
              {building ? "Save Changes" : "Add Building"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}