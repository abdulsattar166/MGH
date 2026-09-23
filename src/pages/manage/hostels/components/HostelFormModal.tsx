import { useEffect, useState, type FormEvent } from "react";
import type { Hostel } from "@/lib/hostelsDb";
import ImageUpload from "@/pages/manage/components/ImageUpload";

export type HostelFormValues = {
  name: string;
  code: string;
  gender: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  facilities: string;
  imageUrl: string;
  status: string;
};

type Props = {
  open: boolean;
  hostel: Hostel | null;
  saving: boolean;
  error: string;
  onSubmit: (values: HostelFormValues) => void;
  onClose: () => void;
};

const inputClass =
  "w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";

export default function HostelFormModal({ open, hostel, saving, error, onSubmit, onClose }: Props) {
  const [values, setValues] = useState<HostelFormValues>({
    name: "",
    code: "",
    gender: "boys",
    location: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    facilities: "",
    imageUrl: "",
    status: "active",
  });

  useEffect(() => {
    if (!open) return;
    setValues({
      name: hostel?.name ?? "",
      code: hostel?.code ?? "",
      gender: hostel?.gender ?? "boys",
      location: hostel?.location ?? "",
      address: hostel?.address ?? "",
      phone: hostel?.phone ?? "",
      email: hostel?.email ?? "",
      description: hostel?.description ?? "",
      facilities: hostel?.facilities?.join(", ") ?? "",
      imageUrl: hostel?.image ?? "",
      status: hostel?.status ?? "active",
    });
  }, [open, hostel]);

  if (!open) return null;

  const set = (patch: Partial<HostelFormValues>) => setValues((v) => ({ ...v, ...patch }));

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!values.name.trim()) return;
    onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground-950/50" onClick={onClose}></div>
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-background-50 rounded-2xl border border-background-200">
        <div className="sticky top-0 bg-background-50 border-b border-background-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground-950">
              {hostel ? "Edit Hostel" : "Add Hostel"}
            </h2>
            <p className="text-xs text-foreground-500">
              {hostel ? "Update hostel details" : "Register a new hostel branch"}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">
                Hostel Name <span className="text-accent-600">*</span>
              </label>
              <input
                className={inputClass}
                value={values.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="e.g. Jinnah Boys House"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">Code</label>
              <input
                className={inputClass}
                value={values.code}
                onChange={(e) => set({ code: e.target.value })}
                placeholder="e.g. JINN"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">Gender</label>
              <select
                className={`${inputClass} cursor-pointer`}
                value={values.gender}
                onChange={(e) => set({ gender: e.target.value })}
              >
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
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
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">Location</label>
            <input
              className={inputClass}
              value={values.location}
              onChange={(e) => set({ location: e.target.value })}
              placeholder="e.g. 6th Road, Rawalpindi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">Address</label>
            <input
              className={inputClass}
              value={values.address}
              onChange={(e) => set({ address: e.target.value })}
              placeholder="Full street address"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">Phone</label>
              <input
                className={inputClass}
                value={values.phone}
                onChange={(e) => set({ phone: e.target.value })}
                placeholder="+92 300 000 0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">Email</label>
              <input
                type="email"
                className={inputClass}
                value={values.email}
                onChange={(e) => set({ email: e.target.value })}
                placeholder="hostel@example.pk"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">Description</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              maxLength={500}
              value={values.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Short description of the hostel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1.5">
              Facilities <span className="text-foreground-400 font-normal">(comma separated)</span>
            </label>
            <input
              className={inputClass}
              value={values.facilities}
              onChange={(e) => set({ facilities: e.target.value })}
              placeholder="Wi-Fi, Mess, Security, Laundry"
            />
          </div>

          <div>
            <ImageUpload
              label="Hostel Photo"
              value={values.imageUrl}
              onChange={(url) => set({ imageUrl: url ?? "" })}
            />
            <p className="mt-1 text-xs text-foreground-400">
              Drag and drop a photo, or browse from your computer. No URL needed.
            </p>
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
              {hostel ? "Save Changes" : "Add Hostel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}