import { isRoomFull, type RoomBeds } from "@/lib/booking";
import { useHostelRooms } from "@/hooks/useHostelRooms";
import type { Hostel } from "@/lib/hostelsDb";

type Props = {
  hostels: Hostel[];
  hostelId: number;
  selectedRoom: string | null;
  onSelect: (room: RoomBeds) => void;
  onBack: () => void;
};

export default function StepRoom({ hostels, hostelId, selectedRoom, onSelect, onBack }: Props) {
  const hostel = hostels.find((h) => h.id === hostelId);
  const rooms = useHostelRooms(hostelId);

  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-foreground-500 hover:text-foreground-900 cursor-pointer mb-4"
      >
        <i className="ri-arrow-left-line"></i>
        Change hostel
      </button>

      <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-950">
        Available rooms at {hostel?.name ?? `Hostel #${hostelId}`}
      </h2>
      <p className="mt-2 text-sm text-foreground-600">
        Only rooms with at least one free bed are shown. Full rooms are disabled.
      </p>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-foreground-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-primary-500"></span> Has free beds
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-background-300"></span> Room full
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {rooms.map((room) => {
          const full = isRoomFull(room);
          const isSelected = selectedRoom === room.label;
          return (
            <button
              key={room.label}
              disabled={full}
              onClick={() => onSelect(room)}
              className={`rounded-xl border overflow-hidden flex flex-col transition cursor-pointer ${
                full
                  ? "border-background-200 bg-background-100 opacity-60 cursor-not-allowed"
                  : isSelected
                    ? "border-primary-500 ring-2 ring-primary-300 bg-primary-50"
                    : "border-background-200 bg-background-50 hover:border-primary-300"
              }`}
            >
              <div className="relative h-20 w-full overflow-hidden bg-background-100">
                <img
                  src={room.image}
                  alt={`Room ${room.label}`}
                  title={`Room ${room.label}`}
                  className="w-full h-full object-cover"
                />
                <span
                  className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                    full
                      ? "bg-background-200 text-foreground-500"
                      : "bg-primary-100 text-primary-700"
                  }`}
                >
                  {full ? "FULL" : `${room.availableCount} free`}
                </span>
              </div>
              <div className="p-3 flex flex-col items-center gap-1">
                <span className="font-heading text-lg font-bold text-foreground-950">{room.label}</span>
                <span className="text-[11px] text-foreground-500">
                  Floor {room.floor} · Block {room.block}
                </span>
                <span className="text-[11px] text-foreground-500">{room.capacity} beds</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}