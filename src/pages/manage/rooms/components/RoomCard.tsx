import { useRef, useState } from "react";
import type { RoomView, Bed } from "@/hooks/useRooms";
import { useRoomImage } from "@/hooks/useRoomImage";
import { fileToResizedDataUrl, isAcceptedImage, isWithinSizeLimit } from "@/lib/image";

type Props = {
  room: RoomView;
  onAssign: (room: RoomView, bed: Bed) => void;
  onViewStudent: (studentId: number) => void;
  onToggleMaintenance?: (bedId: number, current: boolean) => void;
  onEdit?: (room: RoomView) => void;
  onDelete?: (room: RoomView) => void;
};

export default function RoomCard({
  room,
  onAssign,
  onViewStudent,
  onToggleMaintenance,
  onEdit,
  onDelete,
}: Props) {
  const occupiedCount = room.beds.filter((b) => b.status === "occupied").length;
  const { image, update } = useRoomImage(room.id);
  const [error, setError] = useState<string | null>(null);
  const [maintMode, setMaintMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isInactive = room.status === "inactive";

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!isAcceptedImage(file)) {
      setError("Please upload a JPG, PNG or WEBP image.");
      return;
    }
    if (!isWithinSizeLimit(file)) {
      setError("Image must be under 5 MB.");
      return;
    }
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      update(dataUrl);
      setError(null);
    } catch {
      setError("Could not process this image. Please try another file.");
    }
  };

  const handleBedClick = (bed: Bed) => {
    if (bed.status === "occupied" && bed.studentId) {
      onViewStudent(bed.studentId);
    } else if (maintMode && (bed.status === "vacant" || bed.status === "maintenance")) {
      onToggleMaintenance?.(bed.id, bed.status === "maintenance");
    } else if (!maintMode && bed.status === "vacant" && !isInactive) {
      onAssign(room, bed);
    }
  };

  return (
    <div
      className={`bg-background-50 border border-background-200 rounded-lg overflow-hidden ${
        isInactive ? "opacity-60" : ""
      }`}
    >
      <div className="relative h-36 w-full overflow-hidden bg-background-100">
        <img
          src={image}
          alt={`Room ${room.number}`}
          title={`Room ${room.number}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background-50/95 text-foreground-800 text-xs font-semibold hover:bg-background-50 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-camera-line"></i>
            Change photo
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      <div className="p-4">
        {error && <p className="text-xs text-accent-700 mb-2">{error}</p>}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-heading text-base font-bold text-foreground-950">
              Room {room.number}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-foreground-400 bg-background-100 rounded-full px-2 py-0.5">
              Floor {room.floor}
            </span>
            {isInactive && (
              <span className="text-[10px] uppercase tracking-wide text-foreground-600 bg-background-200 rounded-full px-2 py-0.5">
                Inactive
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(room)}
                className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 hover:text-primary-600 cursor-pointer"
                aria-label="Edit room"
                title="Edit room"
              >
                <i className="ri-pencil-line"></i>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(room)}
                className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-500 hover:bg-accent-100 hover:text-accent-700 cursor-pointer"
                aria-label="Delete room"
                title="Delete room"
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-foreground-500">{room.type}</span>
          <span className="text-xs text-foreground-500">
            {occupiedCount}/{room.capacity} occupied
          </span>
        </div>

        {onToggleMaintenance && !isInactive && (
          <button
            type="button"
            onClick={() => setMaintMode((v) => !v)}
            className={`mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
              maintMode
                ? "bg-accent-500 text-foreground-950"
                : "bg-background-100 text-foreground-600 hover:bg-background-200"
            }`}
          >
            <i className="ri-tools-line"></i>
            {maintMode ? "Maintenance mode: ON" : "Mark maintenance"}
          </button>
        )}

        <div className="flex flex-wrap gap-2">
          {room.beds.map((bed) => {
            const isMaintTarget =
              maintMode && (bed.status === "vacant" || bed.status === "maintenance");
            const clickable =
              (bed.status === "occupied" && bed.studentId) ||
              (!maintMode && bed.status === "vacant" && !isInactive) ||
              isMaintTarget;

            return (
              <button
                key={bed.id}
                disabled={!clickable}
                title={
                  maintMode
                    ? bed.status === "maintenance"
                      ? "Click to remove from maintenance"
                      : bed.status === "vacant"
                        ? "Click to mark maintenance"
                        : bed.studentName
                    : bed.status === "occupied"
                      ? bed.studentName
                      : bed.status === "maintenance"
                        ? "Under maintenance"
                        : "Vacant — click to assign"
                }
                onClick={() => handleBedClick(bed)}
                className={`w-9 h-9 rounded-md flex items-center justify-center text-sm font-semibold transition ${
                  bed.status === "occupied"
                    ? "bg-primary-500 text-background-50 hover:bg-primary-600 cursor-pointer"
                    : bed.status === "vacant"
                      ? maintMode
                        ? "border border-dashed border-accent-400 text-accent-600 hover:bg-accent-100 cursor-pointer"
                        : isInactive
                          ? "border border-dashed border-background-200 text-foreground-300 cursor-not-allowed"
                          : "border border-dashed border-background-300 text-foreground-400 hover:border-primary-400 hover:text-primary-600 cursor-pointer"
                      : maintMode
                        ? "bg-accent-100 text-accent-700 hover:bg-accent-200 cursor-pointer"
                        : "bg-accent-100 text-accent-700 cursor-not-allowed"
                }`}
              >
                {bed.status === "maintenance" ? (
                  <i className="ri-tools-line text-sm"></i>
                ) : bed.status === "occupied" ? (
                  bed.studentName?.charAt(0)
                ) : (
                  bed.number
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}