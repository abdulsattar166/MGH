import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHostelsFull } from "@/hooks/useHostelsFull";
import { useWardens } from "@/hooks/useWardens";
import { createHostel, updateHostel, deleteHostel, type Hostel } from "@/lib/hostelsDb";
import { logAudit } from "@/lib/auditLogs";
import HostelFormModal, { type HostelFormValues } from "./components/HostelFormModal";
import DataState from "@/pages/manage/components/DataState";
import ConfirmDialog from "@/pages/manage/students/components/ConfirmDialog";

export default function HostelsPage() {
  const { user } = useAuth();
  const { hostels, loading, error, reload } = useHostelsFull();
  const { wardens } = useWardens();

  const isAdmin = user?.role === "admin";
  const isWarden = user?.role === "warden";

  const visible = useMemo(() => {
    if (isWarden) return hostels.filter((h) => h.id === user?.hostelId);
    return hostels;
  }, [hostels, isWarden, user?.hostelId]);

  const [modal, setModal] = useState<{ open: boolean; editing: Hostel | null }>({
    open: false,
    editing: null,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<Hostel | null>(null);
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const wardenFor = (hostelId: number) => wardens.find((w) => w.hostelId === hostelId) ?? null;

  const handleSave = async (values: HostelFormValues) => {
    setFormError("");
    setSaving(true);
    const facilities = values.facilities
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      const payload = {
        name: values.name.trim(),
        gender: values.gender,
        location: values.location.trim() || null,
        address: values.address.trim() || null,
        phone: values.phone.trim() || null,
        email: values.email.trim() || null,
        code: values.code.trim() || null,
        description: values.description.trim() || null,
        status: values.status,
        imageUrl: values.imageUrl.trim() || null,
        facilities,
      };

      if (modal.editing) {
        await updateHostel(modal.editing.id, payload);
        flash("Hostel updated.");
        void logAudit({
          action: "hostel.updated",
          resource: "hostels",
          resourceId: String(modal.editing.id),
          details: `Updated hostel ${payload.name}`,
        });
      } else {
        await createHostel(payload);
        flash("Hostel created.");
        void logAudit({
          action: "hostel.created",
          resource: "hostels",
          details: `Created hostel ${payload.name}`,
        });
      }
      setModal({ open: false, editing: null });
      reload();
    } catch (e) {
      setFormError((e as Error).message || "Could not save the hostel.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setActionError("");
    try {
      await deleteHostel(deleting.id);
      flash("Hostel removed.");
      void logAudit({
        action: "hostel.deleted",
        resource: "hostels",
        resourceId: String(deleting.id),
        details: `Deleted hostel ${deleting.name}`,
      });
      setDeleting(null);
      reload();
    } catch (e) {
      setActionError((e as Error).message || "Could not remove the hostel.");
      setDeleting(null);
    }
  };

  const totals = useMemo(() => {
    const rooms = visible.reduce((s, h) => s + h.rooms, 0);
    const beds = visible.reduce((s, h) => s + h.beds, 0);
    const available = visible.reduce((s, h) => s + h.available, 0);
    return { hostels: visible.length, rooms, beds, available };
  }, [visible]);

  const statItems = [
    { label: "Hostels", value: totals.hostels, icon: "ri-building-2-line" },
    { label: "Rooms", value: totals.rooms, icon: "ri-door-open-line" },
    { label: "Beds", value: totals.beds, icon: "ri-hotel-bed-line" },
    { label: "Available", value: totals.available, icon: "ri-check-double-line" },
  ];

  return (
    <DataState loading={loading} error={error} onRetry={reload}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground-950">
              {isWarden ? "My Hostel" : "Hostel Management"}
            </h2>
            <p className="text-sm text-foreground-600 mt-1">
              {isAdmin
                ? "Create and manage hostel branches. Room and bed figures are derived live from the database."
                : "Live overview of hostel occupancy from the database."}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setModal({ open: true, editing: null });
                setFormError("");
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
            >
              <i className="ri-add-line"></i> Add Hostel
            </button>
          )}
        </div>

        {message && (
          <div className="bg-primary-100 text-primary-800 border border-primary-200 rounded-lg px-4 py-3 text-sm">
            {message}
          </div>
        )}
        {actionError && (
          <div className="bg-accent-100 text-accent-800 border border-accent-200 rounded-lg px-4 py-3 text-sm">
            {actionError}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statItems.map((s) => (
            <div
              key={s.label}
              className="bg-background-50 border border-background-200 rounded-lg p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-md bg-background-100 flex items-center justify-center text-primary-600">
                <i className={`${s.icon} text-lg`}></i>
              </div>
              <div>
                <div className="text-xl font-bold text-foreground-950">{s.value}</div>
                <div className="text-xs text-foreground-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="bg-background-50 border border-background-200 rounded-lg py-16 text-center">
            <i className="ri-building-2-line text-4xl text-foreground-300"></i>
            <p className="mt-3 text-sm text-foreground-500">
              {isWarden
                ? "Your account is not assigned to a hostel yet."
                : "No hostels have been created yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map((h) => {
              const warden = wardenFor(h.id);
              const occupancy = h.beds ? Math.round(((h.beds - h.available) / h.beds) * 100) : 0;
              return (
                <div
                  key={h.id}
                  className="bg-background-50 border border-background-200 rounded-lg overflow-hidden"
                >
                  <div className="relative h-40">
                    {h.image ? (
                      <img
                        src={h.image}
                        alt={h.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full bg-background-100 flex items-center justify-center">
                        <i className="ri-building-2-line text-4xl text-foreground-300"></i>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-background-50/95 backdrop-blur text-xs font-bold text-foreground-900">
                      {h.code ?? "—"}
                    </div>
                    <div
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold text-background-50 ${
                        h.status === "active" ? "bg-primary-500" : "bg-foreground-400"
                      }`}
                    >
                      {h.status}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-heading text-base font-bold text-foreground-950 leading-snug">
                          {h.name}
                        </h3>
                        <div className="text-xs text-foreground-500 mt-1">
                          <i className="ri-map-pin-line mr-1"></i>
                          {h.location ?? "Location not set"}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          h.gender === "boys"
                            ? "bg-secondary-100 text-secondary-900"
                            : "bg-accent-100 text-accent-900"
                        }`}
                      >
                        {h.gender === "boys" ? "Boys" : "Girls"}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm text-foreground-600">
                      <i className="ri-user-star-line"></i>
                      <span>{warden ? warden.name : "No warden assigned"}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-md bg-background-100 py-2">
                        <div className="font-heading text-base font-bold text-primary-600">{h.rooms}</div>
                        <div className="text-[10px] uppercase tracking-widest text-foreground-500">Rooms</div>
                      </div>
                      <div className="rounded-md bg-background-100 py-2">
                        <div className="font-heading text-base font-bold text-primary-600">{h.beds}</div>
                        <div className="text-[10px] uppercase tracking-widest text-foreground-500">Beds</div>
                      </div>
                      <div className="rounded-md bg-background-100 py-2">
                        <div className="font-heading text-base font-bold text-primary-600">{h.available}</div>
                        <div className="text-[10px] uppercase tracking-widest text-foreground-500">Free</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-foreground-600 mb-1">
                        <span>Occupancy</span>
                        <span className="font-semibold text-foreground-900">{occupancy}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-background-200 overflow-hidden">
                        <div
                          className="h-full bg-accent-500"
                          style={{ width: `${occupancy}%` }}
                        ></div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="mt-4 flex items-center gap-2 border-t border-background-200 pt-4">
                        <button
                          onClick={() => {
                            setModal({ open: true, editing: h });
                            setFormError("");
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-background-300 text-foreground-700 text-sm font-semibold whitespace-nowrap hover:bg-background-100 cursor-pointer transition"
                        >
                          <i className="ri-edit-line"></i> Edit
                        </button>
                        <button
                          onClick={() => setDeleting(h)}
                          className="w-9 h-9 flex items-center justify-center rounded-md text-accent-700 hover:bg-accent-100 cursor-pointer transition"
                          title="Delete"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <HostelFormModal
          open={modal.open}
          hostel={modal.editing}
          saving={saving}
          error={formError}
          onSubmit={handleSave}
          onClose={() => setModal({ open: false, editing: null })}
        />

        <ConfirmDialog
          open={Boolean(deleting)}
          title="Delete hostel?"
          message={`This will permanently remove ${deleting?.name ?? "this hostel"}. Existing rooms and students must be cleared first.`}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      </div>
    </DataState>
  );
}