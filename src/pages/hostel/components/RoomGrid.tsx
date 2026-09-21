import { Link } from "react-router-dom";
import { usePublicHostelAvailability } from "@/hooks/usePublicHostelAvailability";
import type { PublicRoom } from "@/lib/roomsDb";
import { getRoomImage } from "@/lib/roomImages";

type RoomStatus = "available" | "full" | "maintenance";

function statusOf(room: PublicRoom): RoomStatus {
  if (room.available > 0) return "available";
  if (room.maintenance > 0) return "maintenance";
  return "full";
}

const statusMeta: Record<
  RoomStatus,
  { label: string; icon: string; wrap: string; badge: string }
> = {
  available: {
    label: "Available",
    icon: "ri-checkbox-circle-line",
    wrap: "border-primary-200 bg-primary-50",
    badge: "bg-primary-500 text-background-50",
  },
  full: {
    label: "Full",
    icon: "ri-checkbox-circle-fill",
    wrap: "border-background-200 bg-background-100",
    badge: "bg-background-200 text-foreground-500",
  },
  maintenance: {
    label: "Maintenance",
    icon: "ri-tools-line",
    wrap: "border-accent-200 bg-accent-50",
    badge: "bg-accent-100 text-accent-900",
  },
};

export default function RoomGrid({ hostelId }: { hostelId: number }) {
  const { data, loading, error, reload } = usePublicHostelAvailability(hostelId);

  if (loading && !data) {
    return (
      <div className="py-20 text-center text-foreground-500">
        <i className="ri-loader-4-line animate-spin text-3xl"></i>
        <p className="mt-3 text-sm">Loading room availability…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="py-20 text-center text-foreground-500">
        <i className="ri-error-warning-line text-4xl block mb-3"></i>
        <p className="text-sm">Could not load rooms. Please try again.</p>
        <button
          onClick={reload}
          className="mt-4 px-4 py-2 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const rooms = data?.rooms ?? [];

  if (rooms.length === 0) {
    return (
      <div className="py-20 text-center text-foreground-500">
        <i className="ri-door-open-line text-4xl block mb-3"></i>
        <p className="text-sm">No rooms have been configured for this hostel yet.</p>
      </div>
    );
  }

  // Group rooms by block (first letter of the room number, e.g. "A1" -> "A").
  const blocks = new Map<string, PublicRoom[]>();
  for (const r of rooms) {
    const list = blocks.get(r.block) ?? [];
    list.push(r);
    blocks.set(r.block, list);
  }
  const blockEntries = Array.from(blocks.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Rooms", value: data!.totalRooms, icon: "ri-door-open-line", tone: "text-foreground-700" },
          { label: "Available Rooms", value: data!.availableRooms, icon: "ri-checkbox-circle-line", tone: "text-primary-600" },
          { label: "Full Rooms", value: data!.fullRooms, icon: "ri-checkbox-circle-fill", tone: "text-foreground-500" },
          { label: "Available Beds", value: data!.availableBeds, icon: "ri-hotel-bed-line", tone: "text-accent-600" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-background-50 border border-background-200 rounded-xl p-4 flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-md bg-background-100 flex items-center justify-center ${s.tone}`}>
              <i className={`${s.icon} text-lg`}></i>
            </div>
            <div>
              <div className="font-heading text-xl font-bold text-foreground-950">{s.value}</div>
              <div className="text-xs text-foreground-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-500 mb-8">
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-primary-500"></span> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-background-300"></span> Full
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-accent-300"></span> Maintenance
        </span>
      </div>

      {/* Blocks */}
      <div className="space-y-10">
        {blockEntries.map(([block, blockRooms]) => {
          const floor = blockRooms[0]?.floor ?? 0;
          const available = blockRooms.filter((r) => r.available > 0).length;
          return (
            <div key={block}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-secondary-500 text-background-50 flex items-center justify-center font-heading font-bold text-lg">
                    {block}
                  </div>
                  <h3 className="font-heading text-lg md:text-xl font-bold text-foreground-950">
                    Floor {floor} — Block {block}
                  </h3>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-primary-100 text-primary-700 font-semibold whitespace-nowrap">
                  {available} of {blockRooms.length} available
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {blockRooms.map((room) => {
                  const status = statusOf(room);
                  const meta = statusMeta[status];
                  return (
                    <div
                      key={room.id}
                      className={`rounded-xl border overflow-hidden flex flex-col ${meta.wrap}`}
                    >
                      <div className="relative h-20 w-full overflow-hidden bg-background-100">
                        <img
                          src={getRoomImage(`${hostelId}-${room.roomNumber}`)}
                          alt={`Room ${room.roomNumber}`}
                          title={`Room ${room.roomNumber} — ${meta.label}`}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <div className="p-3 flex flex-col items-center gap-1.5">
                        <i
                          className={`${meta.icon} text-xl ${
                            status === "available"
                              ? "text-primary-600"
                              : status === "maintenance"
                                ? "text-accent-700"
                                : "text-foreground-400"
                          }`}
                        ></i>
                        <span className="font-heading text-lg font-bold text-foreground-950">
                          {room.roomNumber}
                        </span>
                        <span className="text-[11px] text-foreground-500">
                          {room.available > 0
                            ? `${room.available} of ${room.capacity} beds free`
                            : `${room.capacity} beds`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <Link
          to={`/booking?hostel=${hostelId}`}
          className="inline-flex px-7 py-3.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 font-semibold whitespace-nowrap cursor-pointer transition"
        >
          <i className="ri-hotel-bed-line mr-2"></i>
          Book a Room
        </Link>
      </div>
    </div>
  );
}