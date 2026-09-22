import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { facilities } from "@/mocks/hostels";
import { useHostelFull } from "@/hooks/useHostelFull";
import { getHostelDetail, getHostelLocation } from "@/lib/hostelContent";
import { useWardens } from "@/hooks/useWardens";
import { usePublicHostelAvailability } from "@/hooks/usePublicHostelAvailability";
import WardenCard from "@/pages/hostel/components/WardenCard";
import NoticesBoard from "@/pages/hostel/components/NoticesBoard";

export default function HostelHome() {
  const { id } = useParams();
  const numId = id ? Number(id) : null;
  const { hostel, loading } = useHostelFull(numId);
  const detail = getHostelDetail(numId ?? 0, hostel ?? undefined);
  const loc = getHostelLocation(numId ?? 0, hostel ?? undefined);
  const { forHostel } = useWardens();
  const wardenForHostel = forHostel(hostel ? hostel.id : null);
  const availability = usePublicHostelAvailability(numId ?? 0);

  const blocks = useMemo(() => {
    const map = new Map<
      string,
      { block: string; floor: number; rooms: number; available: number }
    >();
    for (const r of availability.data?.rooms ?? []) {
      const cur = map.get(r.block) ?? { block: r.block, floor: r.floor, rooms: 0, available: 0 };
      cur.rooms += 1;
      if (r.available > 0) cur.available += 1;
      map.set(r.block, cur);
    }
    return Array.from(map.values()).sort((a, b) => a.block.localeCompare(b.block));
  }, [availability.data]);

  if (loading && !availability.data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-foreground-500">
        <i className="ri-loader-4-line animate-spin text-3xl"></i>
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <i className="ri-error-warning-line text-5xl text-accent-500"></i>
        <h1 className="font-heading text-2xl font-bold text-foreground-950 mt-4">Hostel not found</h1>
        <Link
          to="/hostels"
          className="mt-6 px-6 py-3 rounded-md bg-primary-500 text-background-50 font-semibold cursor-pointer"
        >
          View All Hostels
        </Link>
      </div>
    );
  }

  const availLoading = availability.loading && !availability.data;
  const totalRooms = availability.data?.totalRooms ?? 0;
  const totalBeds = availability.data?.totalBeds ?? 0;
  const availableBeds = availability.data?.availableBeds ?? 0;
  const occupiedBeds = availability.data?.occupiedBeds ?? 0;
  const floors = availability.data?.floors ?? 0;
  const occupancy = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const stats = [
    { label: "Floors", value: availLoading ? "—" : String(floors), icon: "ri-stack-line" },
    { label: "Rooms", value: availLoading ? "—" : String(totalRooms), icon: "ri-door-open-line" },
    { label: "Total Beds", value: availLoading ? "—" : String(totalBeds), icon: "ri-hotel-bed-line" },
    { label: "Available", value: availLoading ? "—" : String(availableBeds), icon: "ri-checkbox-circle-line" },
    { label: "Occupancy", value: availLoading ? "—" : `${occupancy}%`, icon: "ri-bar-chart-fill" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[480px] md:h-[620px] overflow-hidden">
        <img
          src={hostel.image}
          alt={hostel.name}
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/60 via-foreground-950/30 to-foreground-950/80"></div>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background-50/15 backdrop-blur text-background-50 text-xs font-medium">
              <i className="ri-map-pin-line text-accent-300"></i>
              {hostel.location}
            </span>
            <h1 className="mt-5 font-heading text-3xl md:text-5xl font-bold text-background-50 leading-tight">
              Welcome to {hostel.name}
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-background-200 text-base md:text-lg leading-relaxed">
              Comfortable accommodation. Secure environment. Better student living — right here at
              our {hostel.location} residence.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={`/hostel/${id}/rooms`}
                className="px-7 py-3.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 font-semibold whitespace-nowrap cursor-pointer transition"
              >
                Explore Rooms
              </Link>
              <Link
                to={`/booking?hostel=${id}`}
                className="px-7 py-3.5 rounded-md bg-background-50 text-foreground-950 font-semibold whitespace-nowrap cursor-pointer transition hover:bg-background-100"
              >
                Book a Room
              </Link>
              <a
                href={`https://wa.me/${loc.whatsapp}?text=${encodeURIComponent(
                  `Hello, I am interested in ${hostel.name}. Please share availability and admission details.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-md border border-background-300 text-background-50 font-semibold whitespace-nowrap cursor-pointer transition hover:bg-background-50/10"
              >
                <i className="ri-whatsapp-line mr-1.5"></i>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="relative -mt-10 z-10 px-4 md:px-8">
        <div className="mx-auto max-w-7xl bg-background-50 rounded-2xl border border-background-200 px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-md bg-primary-50 flex items-center justify-center shrink-0">
                  <i className={`${s.icon} text-primary-600 text-xl`}></i>
                </div>
                <div>
                  <div className="font-heading text-2xl font-bold text-foreground-950">{s.value}</div>
                  <div className="text-xs text-foreground-500 uppercase tracking-wider">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16 px-4 md:px-8">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary-600">
              About this residence
            </span>
            <h2 className="mt-3 font-heading text-2xl md:text-3xl font-bold text-foreground-950">
              A dedicated home for students in {hostel.location}
            </h2>
            <p className="mt-4 text-foreground-700 leading-relaxed">{detail.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {hostel.facilities.map((f) => (
                <span
                  key={f}
                  className="text-sm px-3 py-1.5 rounded-full bg-secondary-100 text-secondary-900"
                >
                  {f}
                </span>
              ))}
            </div>
            <div className="mt-8 bg-background-100 border border-background-200 rounded-2xl p-5">
              <WardenCard
                name={wardenForHostel?.name ?? loc.warden}
                position={wardenForHostel?.position ?? "Warden"}
                hostelName={hostel.name}
                phone={wardenForHostel?.phone ?? null}
                email={wardenForHostel?.email ?? null}
                avatarUrl={wardenForHostel?.avatarUrl ?? null}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {detail.gallery.slice(0, 2).map((img, i) => (
              <div
                key={i}
                className={`rounded-2xl overflow-hidden border border-background-200 ${i === 1 ? "mt-8" : ""}`}
              >
                <img
                  src={img}
                  alt={`${hostel.name} interior ${i + 1}`}
                  className="w-full h-56 md:h-64 object-cover object-top"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notices board */}
      <section className="py-12 px-4 md:px-8 bg-background-100">
        <div className="mx-auto max-w-5xl">
          <NoticesBoard hostelId={hostel.id} />
        </div>
      </section>

      {/* Security / Food / Wi-Fi */}
      <section className="py-12 px-4 md:px-8 bg-background-100">
        <div className="mx-auto max-w-7xl grid sm:grid-cols-3 gap-5">
          {[
            { icon: "ri-shield-check-line", title: "Security", text: detail.security },
            { icon: "ri-restaurant-2-line", title: "Food & Mess", text: detail.food },
            { icon: "ri-wifi-line", title: "Wi-Fi", text: detail.wifi },
          ].map((f) => (
            <div key={f.title} className="bg-background-50 border border-background-200 rounded-2xl p-6">
              <div className="w-11 h-11 rounded-md bg-primary-500 flex items-center justify-center">
                <i className={`${f.icon} text-background-50 text-xl`}></i>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-foreground-950">{f.title}</h3>
              <p className="mt-2 text-sm text-foreground-600 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Facilities */}
      <section className="py-16 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary-600">
              Facilities
            </span>
            <h2 className="mt-3 font-heading text-2xl md:text-3xl font-bold text-foreground-950">
              Everything you need to live and study comfortably
            </h2>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {facilities.map((f) => (
              <div
                key={f.title}
                className="bg-background-50 border border-background-200 rounded-2xl p-6 hover:border-primary-300 transition"
              >
                <div className="w-11 h-11 rounded-md bg-accent-100 flex items-center justify-center">
                  <i className={`${f.icon} text-accent-900 text-xl`}></i>
                </div>
                <h3 className="mt-4 font-semibold text-foreground-950">{f.title}</h3>
                <p className="mt-2 text-sm text-foreground-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rooms preview */}
      <section className="py-16 px-4 md:px-8 bg-background-100">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary-600">
                Rooms &amp; Beds
              </span>
              <h2 className="mt-3 font-heading text-2xl md:text-3xl font-bold text-foreground-950">
                {totalRooms} rooms across {floors} {floors === 1 ? "floor" : "floors"}
              </h2>
            </div>
            <Link
              to={`/hostel/${id}/rooms`}
              className="hidden sm:inline-flex items-center gap-2 text-primary-600 font-semibold text-sm cursor-pointer whitespace-nowrap"
            >
              View all rooms
              <i className="ri-arrow-right-line"></i>
            </Link>
          </div>
          {blocks.length === 0 ? (
            <p className="mt-8 text-sm text-foreground-500">
              Room availability is being prepared. Please check back soon.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {blocks.map((b) => (
                <Link
                  key={b.block}
                  to={`/hostel/${id}/rooms`}
                  className="bg-background-50 border border-background-200 rounded-xl p-4 text-center hover:border-primary-300 transition cursor-pointer"
                >
                  <div className="w-9 h-9 mx-auto rounded-md bg-secondary-500 text-background-50 flex items-center justify-center font-heading font-bold text-lg">
                    {b.block}
                  </div>
                  <div className="mt-2 font-heading font-bold text-foreground-950">Floor {b.floor}</div>
                  <div className="text-xs text-foreground-500">{b.rooms} rooms</div>
                  <div className="mt-2 text-xs font-semibold text-primary-600">{b.available} available</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Location */}
      <section className="py-16 px-4 md:px-8">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary-600">
              Location
            </span>
            <h2 className="mt-3 font-heading text-2xl md:text-3xl font-bold text-foreground-950">
              Find us in {hostel.location}
            </h2>
            <p className="mt-4 text-foreground-600">{loc.address}</p>

            <div className="mt-6 space-y-6">
              <div>
                <h4 className="font-semibold text-foreground-950 flex items-center gap-2">
                  <i className="ri-graduation-cap-line text-primary-600"></i>
                  Nearby universities
                </h4>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {loc.nearbyUniversities.map((u) => (
                    <li
                      key={u}
                      className="text-xs px-3 py-1.5 rounded-full bg-primary-50 text-primary-700"
                    >
                      {u}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground-950 flex items-center gap-2">
                  <i className="ri-landscape-line text-accent-600"></i>
                  Nearby landmarks
                </h4>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {loc.nearbyLandmarks.map((l) => (
                    <li
                      key={l}
                      className="text-xs px-3 py-1.5 rounded-full bg-secondary-100 text-secondary-900"
                    >
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 font-semibold text-sm whitespace-nowrap cursor-pointer transition"
              >
                <i className="ri-navigation-line mr-1.5"></i>
                Get Directions
              </a>
              <Link
                to={`/hostel/${id}/contact`}
                className="px-5 py-3 rounded-md border border-background-300 text-foreground-800 hover:bg-background-100 font-semibold text-sm whitespace-nowrap cursor-pointer transition"
              >
                Contact Us
              </Link>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-background-200 h-[380px] md:h-[460px]">
            <iframe
              src={loc.mapEmbed}
              title={`${hostel.name} location map`}
              className="w-full h-full border-0"
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Warden login strip */}
      <section className="pb-16 px-4 md:px-8">
        <div className="mx-auto max-w-7xl bg-primary-950 rounded-3xl px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-background-50">
              Are you the warden of {hostel.name}?
            </h2>
            <p className="mt-2 text-background-200">
              Sign in to manage rooms, beds, students, admissions and payments for this hostel.
            </p>
          </div>
          <Link
            to={`/hostel/${id}/warden-login`}
            className="px-7 py-3.5 rounded-md bg-accent-500 hover:bg-accent-600 text-foreground-950 font-semibold whitespace-nowrap cursor-pointer transition"
          >
            <i className="ri-user-settings-line mr-1.5"></i>
            Warden Login
          </Link>
        </div>
      </section>
    </div>
  );
}