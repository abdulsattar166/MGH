import { Link } from "react-router-dom";
import { useHostelsFull } from "@/hooks/useHostelsFull";
import { useWardens } from "@/hooks/useWardens";

export default function Hostels() {
  const { hostels, loading, error, reload } = useHostelsFull();
  const { wardens } = useWardens();

  const wardenFor = (hostelId: number) =>
    wardens.find((w) => w.hostelId === hostelId) ?? null;

  return (
    <section id="hostels" className="py-24 px-4 md:px-8 bg-background-50">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-primary-600 font-semibold">
              Our Hostels
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground-950 mt-3">
              {loading || hostels.length === 0
                ? "Comfort in every location."
                : `${hostels.length} location${hostels.length > 1 ? "s" : ""}. One promise of comfort.`}
            </h2>
          </div>
          <p className="text-foreground-600 max-w-md">
            Handpicked neighborhoods across Rawalpindi — close to major universities, markets and
            transport hubs.
          </p>
        </div>

        {loading ? (
          <div className="mt-14 flex items-center justify-center gap-2 py-16 text-foreground-500">
            <i className="ri-loader-4-line animate-spin text-2xl"></i>
            <span className="text-sm">Loading hostels…</span>
          </div>
        ) : error ? (
          <div className="mt-14 py-16 text-center">
            <p className="text-sm text-foreground-500">{error}</p>
            <button
              onClick={reload}
              className="mt-3 px-4 py-2 rounded-md bg-secondary-500 hover:bg-secondary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
            >
              Retry
            </button>
          </div>
        ) : hostels.length === 0 ? (
          <div className="mt-14 py-16 text-center text-foreground-500 text-sm">
            No hostels available yet.
          </div>
        ) : (
          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-product-shop>
            {hostels.map((h) => {
              const warden = wardenFor(h.id);
              return (
              <article
                key={h.id}
                className="group bg-background-50 border border-background-200 rounded-2xl overflow-hidden hover:border-primary-300 transition-all"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={h.image ?? ""}
                    alt={h.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-background-50/95 backdrop-blur text-xs font-semibold text-primary-700">
                    <i className="ri-map-pin-line mr-1"></i>
                    {h.location ?? "Lahore"}
                  </div>
                  <div
                    className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-background-50 flex items-center gap-1 ${
                      h.gender === "boys" ? "bg-secondary-500" : "bg-accent-500"
                    }`}
                  >
                    <i className={h.gender === "boys" ? "ri-men-line" : "ri-women-line"}></i>
                    {h.gender === "boys" ? "Boys" : "Girls"}
                  </div>
                  <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-accent-500 text-foreground-950 text-xs font-bold">
                    {h.available} beds available
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-heading text-xl font-bold text-foreground-950 leading-snug">
                    {h.name}
                  </h3>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-md bg-background-100 py-2">
                      <div className="font-heading text-lg font-bold text-primary-600">{h.rooms}</div>
                      <div className="text-[10px] uppercase tracking-widest text-foreground-500">Rooms</div>
                    </div>
                    <div className="rounded-md bg-background-100 py-2">
                      <div className="font-heading text-lg font-bold text-primary-600">{h.floors}</div>
                      <div className="text-[10px] uppercase tracking-widest text-foreground-500">Floors</div>
                    </div>
                    <div className="rounded-md bg-background-100 py-2">
                      <div className="font-heading text-lg font-bold text-primary-600">{h.beds}</div>
                      <div className="text-[10px] uppercase tracking-widest text-foreground-500">Beds</div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {h.facilities.map((f) => (
                      <span
                        key={f}
                        className="text-xs px-2.5 py-1 rounded-full bg-secondary-100 text-secondary-900"
                      >
                        {f}
                      </span>
                    ))}
                  </div>

                  {warden && (
                    <div className="mt-5 flex items-center gap-3 border-t border-background-200 pt-4">
                      <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-secondary-500 text-background-50 flex items-center justify-center text-sm font-bold">
                        {warden.avatarUrl ? (
                          <img
                            src={warden.avatarUrl}
                            alt={warden.name}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          warden.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground-950 truncate">
                          {warden.name}
                        </div>
                        <div className="text-xs text-foreground-500 truncate">
                          {warden.position ?? "Warden"}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex gap-2">
                    <Link
                      to={`/hostel/${h.id}`}
                      className="flex-1 text-center px-4 py-2.5 rounded-md border border-background-300 text-foreground-800 text-sm font-semibold hover:bg-background-100 whitespace-nowrap cursor-pointer transition"
                    >
                      View Hostel
                    </Link>
                    <Link
                      to={`/booking?hostel=${h.id}`}
                      className="flex-1 text-center px-4 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}