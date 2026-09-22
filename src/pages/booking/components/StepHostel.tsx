import { useMemo } from "react";
import { useAvailabilitySummaries } from "@/hooks/useAvailabilitySummaries";
import type { Hostel } from "@/lib/hostelsDb";

type Props = {
  hostels: Hostel[];
  selectedId: number | null;
  onSelect: (hostelId: number) => void;
};

export default function StepHostel({ hostels, selectedId, onSelect }: Props) {
  const ids = useMemo(() => hostels.map((h) => h.id), [hostels]);
  const summaries = useAvailabilitySummaries(ids);

  return (
    <div>
      <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-950">
        Choose your hostel
      </h2>
      <p className="mt-2 text-sm text-foreground-600">
        Select a hostel to see its rooms and available beds.
      </p>

      {hostels.length === 0 ? (
        <div className="mt-10 py-16 text-center text-foreground-500">
          <i className="ri-building-2-line text-4xl block mb-3"></i>
          <p className="text-sm">No hostels are currently available to book.</p>
        </div>
      ) : (
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {hostels.map((h) => {
            const summary = summaries[h.id] ?? {
              totalRooms: 0,
              totalBeds: 0,
              availableBeds: 0,
              availableRooms: 0,
            };
            const isSelected = selectedId === h.id;
            return (
              <button
                key={h.id}
                onClick={() => onSelect(h.id)}
                className={`group text-left bg-background-50 border rounded-2xl overflow-hidden transition cursor-pointer ${
                  isSelected
                    ? "border-primary-500 ring-2 ring-primary-300"
                    : "border-background-200 hover:border-primary-300"
                }`}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={h.image}
                    alt={h.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-background-50/95 text-xs font-semibold text-primary-700">
                    <i className="ri-map-pin-line mr-1"></i>
                    {h.location ?? "Lahore"}
                  </div>
                  <span
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                      h.gender === "girls"
                        ? "bg-accent-500 text-foreground-950"
                        : "bg-background-50/95 text-foreground-800"
                    }`}
                  >
                    {h.gender === "girls" ? "Girls" : "Boys"}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-heading font-bold text-foreground-950 leading-snug">{h.name}</h3>
                  <div className="mt-2 flex items-center gap-3 text-xs text-foreground-500">
                    <span>
                      <i className="ri-door-open-line mr-1"></i>
                      {summary.totalRooms} rooms
                    </span>
                    <span>
                      <i className="ri-hotel-bed-line mr-1"></i>
                      {summary.totalBeds} beds
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary-600">
                      {summary.availableBeds} beds available
                    </span>
                    {isSelected && (
                      <i className="ri-checkbox-circle-fill text-primary-500 text-lg"></i>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}