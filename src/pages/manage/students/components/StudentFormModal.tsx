import { useEffect, useState } from "react";
import type { Student } from "@/mocks/management/students";
import { useHostels } from "@/hooks/useHostels";
import { roomTypes } from "@/mocks/management/rooms";
import ImageUpload from "@/pages/manage/components/ImageUpload";

type Props = {
  open: boolean;
  initial: Student | null;
  lockedHostelId: number | null;
  onClose: () => void;
  onSave: (data: Omit<Student, "id">) => void;
};

const emptyForm: Record<string, string> = {
  name: "",
  fatherName: "",
  cnic: "",
  phone: "",
  hostelId: "1",
  room: "",
  bed: "1",
  roomType: "2-Seater Deluxe",
  university: "",
  program: "",
  guardianPhone: "",
  joinDate: "",
  monthlyFee: "",
  status: "Active",
  imageUrl: "",
};

const inputClass =
  "w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground-800 mb-1.5">
        {label}
        {required && <span className="text-accent-600"> *</span>}
      </label>
      {children}
    </div>
  );
}

export default function StudentFormModal({
  open,
  initial,
  lockedHostelId,
  onClose,
  onSave,
}: Props) {
  const { hostels } = useHostels();
  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        name: initial.name,
        fatherName: initial.fatherName,
        cnic: initial.cnic,
        phone: initial.phone,
        hostelId: String(initial.hostelId),
        room: initial.room,
        bed: String(initial.bed),
        roomType: initial.roomType,
        university: initial.university,
        program: initial.program,
        guardianPhone: initial.guardianPhone,
        joinDate: initial.joinDate,
        monthlyFee: String(initial.monthlyFee),
        status: initial.status,
        imageUrl: initial.imageUrl ?? "",
      });
    } else {
      setForm({
        ...emptyForm,
        hostelId: lockedHostelId ? String(lockedHostelId) : "1",
      });
    }
    setError("");
  }, [open, initial, lockedHostelId]);

  if (!open) return null;

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim() || !form.cnic.trim() || !form.phone.trim()) {
      setError("Please fill name, CNIC and phone number.");
      return;
    }
    onSave({
      name: form.name.trim(),
      fatherName: form.fatherName.trim(),
      cnic: form.cnic.trim(),
      phone: form.phone.trim(),
      hostelId: Number(form.hostelId),
      room: form.room.trim(),
      bed: Number(form.bed) || 1,
      roomType: form.roomType,
      university: form.university.trim(),
      program: form.program.trim(),
      guardianPhone: form.guardianPhone.trim(),
      joinDate: form.joinDate || new Date().toISOString().slice(0, 10),
      monthlyFee: Number(form.monthlyFee) || 0,
      status: form.status as Student["status"],
      imageUrl: form.imageUrl,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground-950/50" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background-50 rounded-2xl border border-background-200">
        <div className="sticky top-0 bg-background-50 border-b border-background-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground-950">
              {initial ? "Edit Student" : "Add Student"}
            </h2>
            <p className="text-xs text-foreground-500">
              {initial ? "Update resident details" : "Create a new resident record"}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <ImageUpload
            label="Student Photo"
            value={form.imageUrl}
            onChange={(url) => set("imageUrl", url ?? "")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Hamza Ahmed"
              />
            </Field>
            <Field label="Father's Name">
              <input
                className={inputClass}
                value={form.fatherName}
                onChange={(e) => set("fatherName", e.target.value)}
                placeholder="e.g. Ahmed Raza"
              />
            </Field>
            <Field label="CNIC" required>
              <input
                className={inputClass}
                value={form.cnic}
                onChange={(e) => set("cnic", e.target.value)}
                placeholder="61101-2345678-1"
              />
            </Field>
            <Field label="Phone" required>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="0300-1110001"
              />
            </Field>
            <Field label="Guardian Phone">
              <input
                className={inputClass}
                value={form.guardianPhone}
                onChange={(e) => set("guardianPhone", e.target.value)}
                placeholder="0300-2220001"
              />
            </Field>
            <Field label="Hostel">
              <select
                className={`${inputClass} cursor-pointer`}
                value={form.hostelId}
                disabled={Boolean(lockedHostelId)}
                onChange={(e) => set("hostelId", e.target.value)}
              >
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Room Type">
              <select
                className={`${inputClass} cursor-pointer`}
                value={form.roomType}
                onChange={(e) => set("roomType", e.target.value)}
              >
                {roomTypes.map((r) => (
                  <option key={r.type} value={r.type}>
                    {r.type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className={`${inputClass} cursor-pointer`}
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Notice">Notice</option>
                <option value="Left">Left</option>
              </select>
            </Field>
            <Field label="Room">
              <input
                className={inputClass}
                value={form.room}
                onChange={(e) => set("room", e.target.value)}
                placeholder="A1"
              />
            </Field>
            <Field label="Bed">
              <input
                className={inputClass}
                type="number"
                min={1}
                value={form.bed}
                onChange={(e) => set("bed", e.target.value)}
              />
            </Field>
            <Field label="University">
              <input
                className={inputClass}
                value={form.university}
                onChange={(e) => set("university", e.target.value)}
                placeholder="e.g. Bahria University"
              />
            </Field>
            <Field label="Program">
              <input
                className={inputClass}
                value={form.program}
                onChange={(e) => set("program", e.target.value)}
                placeholder="e.g. BS Computer Science"
              />
            </Field>
            <Field label="Join Date">
              <input
                className={inputClass}
                type="date"
                value={form.joinDate}
                onChange={(e) => set("joinDate", e.target.value)}
              />
            </Field>
            <Field label="Monthly Fee (PKR)">
              <input
                className={inputClass}
                type="number"
                min={0}
                value={form.monthlyFee}
                onChange={(e) => set("monthlyFee", e.target.value)}
                placeholder="22000"
              />
            </Field>
          </div>

          {error && (
            <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">
              {error}
            </div>
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
              className="px-5 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
            >
              {initial ? "Save Changes" : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}