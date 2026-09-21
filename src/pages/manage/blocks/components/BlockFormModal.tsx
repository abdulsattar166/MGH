import { useEffect, useState, type FormEvent } from "react";
import type { Block, Building } from "@/lib/buildingsDb";

export type BlockFormValues = {
  name: string;
  buildingId: number;
  status: string;
};

type Props = {
  open: boolean;
  block: Block | null;
  buildings: Building[];
  fixedBuildingId?: number | null;
  saving: boolean;
  error: string;
  onSubmit: (values: BlockFormValues) => void;
  onClose: () => void;
};

const inputClass =
  "w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";

export default function BlockFormModal({
  open,
  block,
  buildings,
  fixedBuildingId,
  saving,
  error,
  onSubmit,
  onClose,
}: Props) {
  const [values, setValues] = useState<BlockFormValues>({
    name: "",
    buildingId: fixedBuildingId ?? buildings[0]?.id ?? 0,
    status: "active",
  });

  useEffect(() => {
    if (!open) return;
    setValues({
      name: block?.name ?? "",
      buildingId: block?.buildingId ?? fixedBuildingId ?? buildings[0]?.id ?? 0,
      status: block?.status ?? "active",
    });
  }, [open, block, buildings, fixedBuildingId]);

  if (!open) return null;

  const set = (patch: Partial<BlockFormValues>) => setValues((v) => ({ ...v, ...patch }));

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
              {block ? "Edit Block" : "Add Block"}
            </h2>
            <p className="text-xs text-foreground-500">
              {block ? "Update block details" : "Register a new block"}
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
              Block Name <span className="text-accent-600">*</span>
            </label>
            <input
              className={inputClass}
              value={values.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Block A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">Building</label>
            <select
              className={`${inputClass} cursor-pointer`}
              value={values.buildingId}
              onChange={(e) => set({ buildingId: Number(e.target.value) })}
              disabled={Boolean(fixedBuildingId)}
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
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
              {block ? "Save Changes" : "Add Block"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}