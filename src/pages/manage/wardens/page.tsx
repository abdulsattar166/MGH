import { useCallback, useEffect, useState } from "react";
import { useHostels } from "@/hooks/useHostels";
import {
  listWardens,
  createWarden,
  updateWarden,
  setWardenHostel,
  resetWardenPassword,
  setWardenActive,
  deleteWarden,
  type ManagedWarden,
} from "@/lib/wardens";
import WardenFormModal, { type WardenFormValues } from "@/pages/manage/settings/components/WardenFormModal";
import ResetPasswordModal from "@/pages/manage/settings/components/ResetPasswordModal";

export default function WardensPage() {
  const [wardens, setWardens] = useState<ManagedWarden[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const { hostels } = useHostels();

  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<ManagedWarden | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [resetTarget, setResetTarget] = useState<ManagedWarden | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ManagedWarden | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await listWardens();
      setWardens(data);
    } catch (e) {
      setLoadError((e as Error).message || "Could not load warden accounts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const handleSave = async (values: WardenFormValues) => {
    setFormError("");
    if (formMode === "create" && (!values.name.trim() || !values.email.trim() || values.password.length < 6)) {
      setFormError("Please enter a name, a valid email and a password of at least 6 characters.");
      return;
    }
    setSaving(true);
    try {
      if (formMode === "create") {
        await createWarden({
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
          phone: values.phone.trim() || undefined,
          hostelId: values.hostelId ? Number(values.hostelId) : null,
          role: values.role,
          position: values.position.trim() || undefined,
          avatarUrl: values.avatarUrl.trim() || null,
        });
        flash("Warden account created successfully.");
      } else if (editing) {
        await updateWarden({
          userId: editing.id,
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim() || null,
          position: values.position.trim() || null,
          hostelId: values.hostelId ? Number(values.hostelId) : null,
          avatarUrl: values.avatarUrl.trim() || null,
        });
        flash("Warden account updated.");
      }
      setFormMode(null);
      setEditing(undefined);
      load();
    } catch (e) {
      setFormError((e as Error).message || "Could not save the account.");
    } finally {
      setSaving(false);
    }
  };

  const handleHostelChange = async (warden: ManagedWarden, value: string) => {
    const hostelId = value === "" ? null : Number(value);
    setWardens((prev) => prev.map((w) => (w.id === warden.id ? { ...w, hostel_id: hostelId } : w)));
    try {
      await setWardenHostel(warden.id, hostelId);
      flash(`${warden.name} reassigned. New permissions apply immediately.`);
    } catch (e) {
      setLoadError((e as Error).message);
      load();
    }
  };

  const handleToggleActive = async (warden: ManagedWarden, isActive: boolean) => {
    setWardens((prev) => prev.map((w) => (w.id === warden.id ? { ...w, is_active: isActive } : w)));
    try {
      await setWardenActive(warden.id, isActive);
      flash(isActive ? `${warden.name} activated.` : `${warden.name} deactivated.`);
    } catch (e) {
      setLoadError((e as Error).message);
      load();
    }
  };

  const handleResetPassword = async (password: string) => {
    if (!resetTarget) return;
    setFormError("");
    setSaving(true);
    try {
      await resetWardenPassword(resetTarget.id, password, true);
      flash(`Password reset for ${resetTarget.name}.`);
      setResetTarget(null);
    } catch (e) {
      setFormError((e as Error).message || "Could not reset the password.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await deleteWarden(confirmDelete.id);
      flash("Account removed.");
      setConfirmDelete(null);
      load();
    } catch (e) {
      setLoadError((e as Error).message || "Could not remove the account.");
    } finally {
      setSaving(false);
    }
  };

  const avatar = (w: ManagedWarden) => (
    <div className="w-11 h-11 rounded-full overflow-hidden bg-secondary-500 text-background-50 flex items-center justify-center text-sm font-bold shrink-0">
      {w.avatar_url ? (
        <img src={w.avatar_url} alt={w.name} className="w-full h-full object-cover object-top" />
      ) : (
        w.name.charAt(0).toUpperCase()
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground-950">Hostel Admin Management</h2>
          <p className="text-sm text-foreground-600 mt-1">
            Manage hostel admin accounts, hostel assignments, photos and passwords.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(undefined);
            setFormError("");
            setFormMode("create");
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
        >
          <i className="ri-add-line"></i> Add Hostel Admin
        </button>
      </div>

      {message && (
        <div className="bg-primary-100 text-primary-800 border border-primary-200 rounded-lg px-4 py-3 text-sm">
          {message}
        </div>
      )}

      <div className="bg-background-50 border border-background-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-foreground-500">
            <i className="ri-loader-4-line animate-spin text-xl"></i>
            <span className="text-sm">Loading accounts…</span>
          </div>
        ) : loadError ? (
          <div className="py-12 px-6 text-center">
            <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2 inline-block">{loadError}</div>
            <div className="mt-3">
              <button onClick={load} className="px-4 py-2 rounded-md bg-secondary-500 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer">
                Retry
              </button>
            </div>
          </div>
        ) : wardens.length === 0 ? (
          <div className="py-12 px-6 text-center text-foreground-500 text-sm">
            No hostel admin accounts yet. Add your first hostel admin above.
          </div>
        ) : (
          <ul className="divide-y divide-background-100">
            {wardens.map((w) => (
              <li key={w.id} className="px-5 py-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {avatar(w)}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground-900 truncate">{w.name}</span>
                        {!w.is_active && (
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 font-semibold">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-foreground-500 truncate">
                        {w.email} · {w.phone ?? "no phone"} · <span className="capitalize">{w.position ?? w.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={w.hostel_id ? String(w.hostel_id) : ""}
                      onChange={(e) => handleHostelChange(w, e.target.value)}
                      className="px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {hostels.map((h) => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleToggleActive(w, !w.is_active)}
                      className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-600 hover:bg-background-100 cursor-pointer transition"
                      title={w.is_active ? "Deactivate" : "Activate"}
                    >
                      <i className={`${w.is_active ? "ri-toggle-fill text-primary-600" : "ri-toggle-line"} text-xl`}></i>
                    </button>
                    <button
                      onClick={() => {
                        setEditing(w);
                        setFormError("");
                        setFormMode("edit");
                      }}
                      className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-600 hover:bg-background-100 cursor-pointer transition"
                      title="Edit"
                    >
                      <i className="ri-edit-line"></i>
                    </button>
                    <button
                      onClick={() => {
                        setFormError("");
                        setResetTarget(w);
                      }}
                      className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-600 hover:bg-background-100 cursor-pointer transition"
                      title="Reset password"
                    >
                      <i className="ri-lock-password-line"></i>
                    </button>
                    <button
                      onClick={() => setConfirmDelete(w)}
                      className="w-9 h-9 flex items-center justify-center rounded-md text-accent-700 hover:bg-accent-100 cursor-pointer transition"
                      title="Remove"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {formMode && (
        <WardenFormModal
          mode={formMode}
          warden={editing}
          saving={saving}
          error={formError}
          onSubmit={handleSave}
          onClose={() => {
            setFormMode(null);
            setEditing(undefined);
            setFormError("");
          }}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          name={resetTarget.name}
          saving={saving}
          error={formError}
          onSubmit={handleResetPassword}
          onClose={() => {
            setResetTarget(null);
            setFormError("");
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-foreground-950/40" onClick={() => setConfirmDelete(null)}></div>
          <div className="relative bg-background-50 border border-background-200 rounded-lg p-6 w-full max-w-sm">
            <h3 className="font-heading text-base font-semibold text-foreground-900">Remove Account?</h3>
            <p className="text-sm text-foreground-600 mt-2">
              This permanently deletes the account for {confirmDelete.name} ({confirmDelete.email}).
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-md text-sm font-medium text-foreground-600 hover:bg-background-100 whitespace-nowrap cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 rounded-md bg-accent-500 hover:bg-accent-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60"
              >
                {saving ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}