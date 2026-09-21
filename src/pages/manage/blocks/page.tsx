import { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBuildings } from "@/hooks/useBuildings";
import { useBlocks } from "@/hooks/useBlocks";
import { useHostels } from "@/hooks/useHostels";
import {
  createBlock,
  updateBlock,
  deleteBlock,
  type Block,
} from "@/lib/buildingsDb";
import { logAudit } from "@/lib/auditLogs";
import BlockFormModal, { type BlockFormValues } from "./components/BlockFormModal";
import DataState from "@/pages/manage/components/DataState";
import ConfirmDialog from "@/pages/manage/students/components/ConfirmDialog";

export default function BlocksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hostels } = useHostels();

  const isWarden = user?.role === "warden";
  const canEdit = user?.role === "admin" || user?.role === "superintendent";
  const wardenHostelId = isWarden ? user?.hostelId ?? undefined : undefined;

  const { buildings, loading: buildingsLoading } = useBuildings(wardenHostelId);

  const buildingIdParam = Number(searchParams.get("building")) || null;
  const [buildingId, setBuildingId] = useState<number | null>(buildingIdParam);

  const activeBuildingId = buildingId ?? buildings[0]?.id ?? null;

  const { blocks, loading, error, reload } = useBlocks(activeBuildingId ?? undefined);

  const [modal, setModal] = useState<{ open: boolean; editing: Block | null }>({
    open: false,
    editing: null,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<Block | null>(null);
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");

  const buildingName = (id: number) =>
    buildings.find((b) => b.id === id)?.name ?? `Building #${id}`;
  const hostelName = (id: number) => hostels.find((h) => h.id === id)?.name ?? `Hostel #${id}`;

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const handleBuildingChange = (id: number | null) => {
    setBuildingId(id);
    setSearchParams(id ? { building: String(id) } : {});
  };

  const handleSave = async (values: BlockFormValues) => {
    setFormError("");
    setSaving(true);
    const building = buildings.find((b) => b.id === values.buildingId);
    try {
      if (modal.editing) {
        await updateBlock(modal.editing.id, {
          name: values.name.trim(),
          status: values.status,
          buildingId: values.buildingId,
          hostelId: building?.hostelId,
        });
        flash("Block updated.");
        void logAudit({
          action: "block.updated",
          resource: "blocks",
          resourceId: String(modal.editing.id),
          details: `Updated block ${values.name}`,
        });
      } else {
        if (!building) throw new Error("Please select a building.");
        await createBlock({
          hostelId: building.hostelId,
          buildingId: building.id,
          name: values.name.trim(),
          status: values.status,
        });
        flash("Block created.");
        void logAudit({
          action: "block.created",
          resource: "blocks",
          details: `Created block ${values.name}`,
        });
      }
      setModal({ open: false, editing: null });
      reload();
    } catch (e) {
      setFormError((e as Error).message || "Could not save the block.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setActionError("");
    try {
      await deleteBlock(deleting.id);
      flash("Block removed.");
      void logAudit({
        action: "block.deleted",
        resource: "blocks",
        resourceId: String(deleting.id),
        details: `Deleted block ${deleting.name}`,
      });
      setDeleting(null);
      reload();
    } catch (e) {
      setActionError((e as Error).message || "Could not remove the block.");
      setDeleting(null);
    }
  };

  const totals = useMemo(() => {
    const rooms = blocks.reduce((s, b) => s + b.rooms, 0);
    const beds = blocks.reduce((s, b) => s + b.beds, 0);
    const occupied = blocks.reduce((s, b) => s + b.occupied, 0);
    return { blocks: blocks.length, rooms, beds, occupied };
  }, [blocks]);

  const statItems = [
    { label: "Blocks", value: totals.blocks, icon: "ri-layout-grid-line" },
    { label: "Rooms", value: totals.rooms, icon: "ri-door-open-line" },
    { label: "Beds", value: totals.beds, icon: "ri-hotel-bed-line" },
    { label: "Occupied", value: totals.occupied, icon: "ri-user-3-line" },
  ];

  return (
    <DataState loading={loading || buildingsLoading} error={error} onRetry={reload}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground-950">Blocks</h2>
            <p className="text-sm text-foreground-600 mt-1">
              Blocks within each building, with live room and bed figures.
            </p>
          </div>
          {canEdit && (
            <button
              onClick={() => {
                setModal({ open: true, editing: null });
                setFormError("");
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
            >
              <i className="ri-add-line"></i> Add Block
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

        {/* Building filter */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleBuildingChange(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap cursor-pointer transition ${
              buildingId === null
                ? "bg-primary-500 text-background-50"
                : "bg-background-100 text-foreground-600 hover:bg-background-200"
            }`}
          >
            All Buildings
          </button>
          {buildings.map((b) => (
            <button
              key={b.id}
              onClick={() => handleBuildingChange(b.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap cursor-pointer transition ${
                buildingId === b.id
                  ? "bg-primary-500 text-background-50"
                  : "bg-background-100 text-foreground-600 hover:bg-background-200"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>

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

        {blocks.length === 0 ? (
          <div className="bg-background-50 border border-background-200 rounded-lg py-16 text-center">
            <i className="ri-layout-grid-line text-4xl text-foreground-300"></i>
            <p className="mt-3 text-sm text-foreground-500">
              No blocks have been created for this building yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {blocks.map((b) => {
              const occupancy = b.beds ? Math.round((b.occupied / b.beds) * 100) : 0;
              return (
                <div
                  key={b.id}
                  className="bg-background-50 border border-background-200 rounded-lg p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-base font-bold text-foreground-950 leading-snug">
                        {b.name}
                      </h3>
                      <div className="text-xs text-foreground-500 mt-1">
                        <i className="ri-building-4-line mr-1"></i>
                        {buildingName(b.buildingId)} · {hostelName(b.hostelId)}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        b.status === "active"
                          ? "bg-primary-100 text-primary-800"
                          : "bg-foreground-200 text-foreground-600"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-background-100 py-2">
                      <div className="font-heading text-base font-bold text-primary-600">{b.floors}</div>
                      <div className="text-[10px] uppercase tracking-widest text-foreground-500">Floors</div>
                    </div>
                    <div className="rounded-md bg-background-100 py-2">
                      <div className="font-heading text-base font-bold text-primary-600">{b.rooms}</div>
                      <div className="text-[10px] uppercase tracking-widest text-foreground-500">Rooms</div>
                    </div>
                    <div className="rounded-md bg-background-100 py-2">
                      <div className="font-heading text-base font-bold text-primary-600">{b.beds}</div>
                      <div className="text-[10px] uppercase tracking-widest text-foreground-500">Beds</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-foreground-600 mb-1">
                      <span>Occupancy</span>
                      <span className="font-semibold text-foreground-900">
                        {b.occupied}/{b.beds} ({occupancy}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-background-200 overflow-hidden">
                      <div className="h-full bg-accent-500" style={{ width: `${occupancy}%` }}></div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-background-200 pt-4">
                    <button
                      onClick={() => navigate(`/manage/rooms`)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-secondary-100 text-secondary-900 text-sm font-semibold whitespace-nowrap hover:bg-secondary-200 cursor-pointer transition"
                    >
                      <i className="ri-door-open-line"></i> View Rooms
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => {
                            setModal({ open: true, editing: b });
                            setFormError("");
                          }}
                          className="w-9 h-9 flex items-center justify-center rounded-md border border-background-300 text-foreground-700 hover:bg-background-100 cursor-pointer transition"
                          title="Edit"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          onClick={() => setDeleting(b)}
                          className="w-9 h-9 flex items-center justify-center rounded-md text-accent-700 hover:bg-accent-100 cursor-pointer transition"
                          title="Delete"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <BlockFormModal
          open={modal.open}
          block={modal.editing}
          buildings={buildings}
          fixedBuildingId={buildingId ?? null}
          saving={saving}
          error={formError}
          onSubmit={handleSave}
          onClose={() => setModal({ open: false, editing: null })}
        />

        <ConfirmDialog
          open={Boolean(deleting)}
          title="Delete block?"
          message={`This will permanently remove ${deleting?.name ?? "this block"}. Its rooms must be cleared first.`}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      </div>
    </DataState>
  );
}