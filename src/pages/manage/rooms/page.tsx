import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStudents } from "@/hooks/useStudents";
import { useHostels } from "@/hooks/useHostels";
import { useRooms, type RoomView, type Bed } from "@/hooks/useRooms";
import RoomCard from "./components/RoomCard";
import RoomFormModal, { type RoomFormValues } from "./components/RoomFormModal";
import AssignBedModal from "./components/AssignBedModal";
import ConfirmDialog from "@/pages/manage/students/components/ConfirmDialog";
import DataState from "@/pages/manage/components/DataState";

type Assignment = { room: RoomView; bed: Bed };

export default function Rooms() {
  const { user } = useAuth();
  const {
    students,
    loading: studentsLoading,
    error: studentsError,
    reload: reloadStudents,
  } = useStudents();
  const { hostels } = useHostels();
  const navigate = useNavigate();

  const isWarden = user?.role === "warden";
  const [hostelId, setHostelId] = useState<number>(isWarden ? (user?.hostelId ?? 1) : 1);
  const [floorFilter, setFloorFilter] = useState<number | "all">("all");
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [roomModal, setRoomModal] = useState<{ open: boolean; editing: RoomView | null }>({
    open: false,
    editing: null,
  });
  const [deleting, setDeleting] = useState<RoomView | null>(null);
  const [actionError, setActionError] = useState("");

  const {
    rooms,
    stats,
    loading,
    error,
    reload,
    assign,
    toggleMaintenance,
    createRoom,
    editRoom,
    removeRoom,
  } = useRooms(hostelId);

  const floors = useMemo(
    () => Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b),
    [rooms]
  );
  const visibleFloors = floorFilter === "all" ? floors : [floorFilter];

  const activeStudents = useMemo(
    () => students.filter((s) => s.hostelId === hostelId && s.status !== "Left"),
    [students, hostelId]
  );

  const handleAssign = async (studentId: number) => {
    if (!assignment) return;
    setActionError("");
    try {
      await assign(studentId, assignment.room.number, assignment.bed.number);
      setAssignment(null);
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  const handleToggleMaintenance = async (bedId: number, current: boolean) => {
    setActionError("");
    try {
      await toggleMaintenance(bedId, current);
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  const handleSaveRoom = async (data: RoomFormValues) => {
    setActionError("");
    try {
      if (roomModal.editing) {
        await editRoom(roomModal.editing.dbId, {
          room_number: data.roomNumber,
          floor: data.floor,
          room_type: data.roomType,
          capacity: data.capacity,
          status: data.status,
        });
      } else {
        await createRoom(data);
      }
      setRoomModal({ open: false, editing: null });
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  const handleDeleteRoom = async () => {
    if (!deleting) return;
    setActionError("");
    try {
      await removeRoom(deleting.dbId);
      setDeleting(null);
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  const handleHostelChange = (id: number) => {
    setHostelId(id);
    setFloorFilter("all");
  };

  const statItems = [
    { label: "Total Beds", value: stats.totalBeds, icon: "ri-hotel-bed-line", tone: "text-foreground-700" },
    { label: "Occupied", value: stats.occupied, icon: "ri-user-3-line", tone: "text-primary-600" },
    { label: "Vacant", value: stats.vacant, icon: "ri-checkbox-blank-circle-line", tone: "text-secondary-600" },
    { label: "Maintenance", value: stats.maintenance, icon: "ri-tools-line", tone: "text-accent-600" },
  ];

  const loadError = error || studentsError;
  const loadLoading = loading || studentsLoading;
  const retry = () => {
    reload();
    reloadStudents();
  };

  return (
    <DataState loading={loadLoading} error={loadError} onRetry={retry}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            {!isWarden && (
              <div className="flex items-center gap-2 mb-3">
                <i className="ri-building-2-line text-foreground-400"></i>
                <select
                  value={hostelId}
                  onChange={(e) => handleHostelChange(Number(e.target.value))}
                  className="px-3 py-2 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
                >
                  {hostels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <p className="text-sm text-foreground-500">
              {isWarden
                ? "Your hostel's room & bed allocation"
                : "Room grid with live bed allocation from the database"}
            </p>
          </div>
          <button
            onClick={() => setRoomModal({ open: true, editing: null })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
          >
            <i className="ri-add-line text-lg"></i>
            Add Room
          </button>
        </div>

        {actionError && (
          <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">
            {actionError}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statItems.map((s) => (
            <div
              key={s.label}
              className="bg-background-50 border border-background-200 rounded-lg p-4 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-md bg-background-100 flex items-center justify-center ${s.tone}`}>
                <i className={`${s.icon} text-lg`}></i>
              </div>
              <div>
                <div className="text-xl font-bold text-foreground-950">{s.value}</div>
                <div className="text-xs text-foreground-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Floor filter */}
        {floors.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFloorFilter("all")}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap cursor-pointer transition ${
                floorFilter === "all"
                  ? "bg-primary-500 text-background-50"
                  : "bg-background-100 text-foreground-600 hover:bg-background-200"
              }`}
            >
              All Floors
            </button>
            {floors.map((f) => (
              <button
                key={f}
                onClick={() => setFloorFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap cursor-pointer transition ${
                  floorFilter === f
                    ? "bg-primary-500 text-background-50"
                    : "bg-background-100 text-foreground-600 hover:bg-background-200"
                }`}
              >
                Floor {f}
              </button>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-500">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-primary-500"></span> Occupied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border border-dashed border-background-300"></span> Vacant
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-accent-100 text-accent-700 flex items-center justify-center">
              <i className="ri-tools-line text-[10px]"></i>
            </span>
            Maintenance
          </span>
        </div>

        {/* Room grid by floor */}
        {rooms.length === 0 && !loading ? (
          <div className="bg-background-50 border border-background-200 rounded-lg py-16 text-center">
            <i className="ri-door-open-line text-4xl text-foreground-300"></i>
            <p className="mt-3 text-sm text-foreground-500">
              No rooms have been created for this hostel yet.
            </p>
          </div>
        ) : (
          visibleFloors.map((floor) => {
            const floorRooms = rooms.filter((r) => r.floor === floor);
            if (floorRooms.length === 0) return null;
            return (
              <div key={floor}>
                <h4 className="font-heading font-bold text-foreground-950 mb-3">Floor {floor}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {floorRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onAssign={(r, b) => setAssignment({ room: r, bed: b })}
                      onViewStudent={(sid) => navigate(`/manage/students/${sid}`)}
                      onToggleMaintenance={handleToggleMaintenance}
                      onEdit={(r) => setRoomModal({ open: true, editing: r })}
                      onDelete={(r) => setDeleting(r)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}

        <AssignBedModal
          open={Boolean(assignment)}
          roomNumber={assignment?.room.number ?? ""}
          bedNumber={assignment?.bed.number ?? 1}
          students={activeStudents}
          onClose={() => setAssignment(null)}
          onAssign={handleAssign}
        />

        <RoomFormModal
          open={roomModal.open}
          initial={
            roomModal.editing
              ? {
                  number: roomModal.editing.number,
                  floor: roomModal.editing.floor,
                  type: roomModal.editing.type,
                  capacity: roomModal.editing.capacity,
                  status: roomModal.editing.status,
                }
              : null
          }
          onClose={() => setRoomModal({ open: false, editing: null })}
          onSave={handleSaveRoom}
        />

        <ConfirmDialog
          open={Boolean(deleting)}
          title="Delete room?"
          message={`This will permanently remove Room ${deleting?.number ?? ""} and all its bed assignments.`}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDeleteRoom}
        />
      </div>
    </DataState>
  );
}