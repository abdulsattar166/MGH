import { type Bed } from "@/lib/booking";
import { useHostelRooms } from "@/hooks/useHostelRooms";
import type { Hostel } from "@/lib/hostelsDb";

type Props = {
  hostels: Hostel[];
  hostelId: number;
  roomLabel: string;
  selectedBed: number | null;
  onSelect: (bed: number) => void;
  onBack: () => void;
};

export default function StepBed({ hostels, hostelId, roomLabel, selectedBed, onSelect, onBack }: Props) {
  const hostel = hostels.find((h) => h.id === hostelId);
  const rooms = useHostelRooms(hostelId);
  const room = rooms.find((r) => r.label === roomLabel);

  const bedLabel = (bed: Bed) =>
    bed.status === "occupied"
      ? "Occupied"
      : bed.status === "maintenance"
        ? "Maintenance"
        : bed.status === "reserved"
          ? "Reserved"
          : "Available";

  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-foreground-500 hover:text-foreground-900 cursor-pointer mb-4"
      >
        <i className="ri-arrow-left-line"></i>
        Change room
      </button>

      <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-950">
        Room {roomLabel} — pick a bed
      </h2>
      <p className="mt-2 text-sm text-foreground-600">
        {hostel?.name} · Floor {room?.floor} · Block {room?.block} ·{" "}
        {room?.availableCount} bed{room?.availableCount === 1 ? "" : "s"} free.
      </p>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {room?.beds.map((bed) => {
          const selectable = bed.status === "available";
          const isSelected = selectedBed === bed.number;
          return (
            <button
              key={bed.number}
              disabled={!selectable}
              onClick={() => onSelect(bed.number)}
              className={`rounded-xl border p-5 text-center transition cursor-pointer ${
                !selectable
                  ? "border-background-200 bg-background-100 cursor-not-allowed opacity-60"
                  : isSelected
                    ? "border-primary-500 ring-2 ring-primary-300 bg-primary-50"
                    : "border-background-200 bg-background-50 hover:border-primary-400"
              }`}
            >
              <i
                className={`ri-hotel-bed-line text-2xl ${
                  selectable ? "text-primary-600" : "text-foreground-400"
                }`}
              ></i>
              <div className="mt-2 text-sm font-semibold text-foreground-950">
                Bed {String(bed.number).padStart(2, "0")}
              </div>
              <div
                className={`mt-1 text-xs font-semibold ${
                  selectable
                    ? "text-primary-600"
                    : bed.status === "reserved"
                      ? "text-accent-600"
                      : "text-foreground-400"
                }`}
              >
                {bedLabel(bed)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-foreground-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-primary-500"></span> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-background-300"></span> Occupied
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-accent-300"></span> Reserved
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-background-300"></span> Maintenance
        </span>
      </div>
    </div>
  );
}