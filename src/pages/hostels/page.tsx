import { useState } from "react";
import { Link } from "react-router-dom";
import SiteNavbar from "@/components/feature/SiteNavbar";
import SiteFooter from "@/components/feature/SiteFooter";
import WhatsAppFab from "@/pages/home/components/WhatsAppFab";
import { useHostelsFull } from "@/hooks/useHostelsFull";
import type { Hostel } from "@/lib/hostelsDb";

function HostelCard({ h }: { h: Hostel }) {
  const isBoys = h.gender === "boys";
  return (
    <article className="group bg-background-50 border border-background-200 rounded-2xl overflow-hidden hover:border-primary-300 transition-all flex flex-col">
      <Link to={`/hostel/${h.id}`} className="relative h-56 overflow-hidden cursor-pointer">
        <img
          src={h.image}
          alt={h.name}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-background-50/95 backdrop-blur text-xs font-semibold text-primary-700">
          <i className="ri-map-pin-line mr-1"></i>
          {h.location ?? "Lahore"}
        </div>
        <div
          className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-background-50 flex items-center gap-1 ${
            isBoys ? "bg-secondary-500" : "bg-accent-500"
          }`}
        >
          <i className={isBoys ? "ri-men-line" : "ri-women-line"}></i>
          {isBoys ? "Boys" : "Girls"}
        </div>
        <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-accent-500 text-foreground-950 text-xs font-bold">
          {h.available} beds available
        </div>
      </Link>

      <div className="p-6 flex flex-col flex-1">
        <h2 className="font-heading text-xl font-bold text-foreground-950 leading-snug">
          <Link to={`/hostel/${h.id}`} className="hover:text-primary-600 cursor-pointer transition">
            {h.name}
          </Link>
        </h2>

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

        <div className="mt-6 pt-5 border-t border-background-200 flex gap-2 mt-auto">
          <Link
            to={`/hostel/${h.id}`}
            className="flex-1 text-center px-4 py-2.5 rounded-md border border-background-300 text-foreground-800 text-sm font-semibold hover:bg-background-100 whitespace-nowrap cursor-pointer transition"
          >
            View Details
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
}

export default function Hostels() {
  const [query, setQuery] = useState("");
  const { hostels, loading, error, reload } = useHostelsFull();

  const filtered = hostels.filter(
    (h) =>
      h.name.toLowerCase().includes(query.toLowerCase()) ||
      (h.location ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  const sections = [
    {
      key: "boys",
      title: "Boys Hostels",
      icon: "ri-men-line",
      iconClass: "bg-secondary-100 text-secondary-900",
      items: filtered.filter((h) => h.gender === "boys"),
    },
    {
      key: "girls",
      title: "Girls Hostels",
      icon: "ri-women-line",
      iconClass: "bg-accent-100 text-accent-900",
      items: filtered.filter((h) => h.gender === "girls"),
    },
  ];

  return (
    <div className="min-h-screen bg-background-50">
      <SiteNavbar />

      {/* Hero */}
      <section className="relative h-[380px] md:h-[460px] overflow-hidden">
        <img
          src="https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/f4fc409f-5ee7-47ba-8c6-6dfee5a58986_compressed_unnamed-4.webp"
          alt="Our hostels"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground-950/80 via-foreground-950/40 to-foreground-950/20"></div>
        <div className="absolute inset-0 flex items-end">
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pb-14">
            <div className="flex items-center gap-3 mb-3">
              <img
                src="https://static.readdy.ai/image/773d73dcd4bfe3b3ab546a821d990052/7b72bbd942d6c3a71db63e797abcba69.png"
                alt="Mubarak Group of Hostels"
                className="h-12 w-auto rounded-lg bg-background-50/90 px-3 py-1"
              />
            </div>
            <span className="text-accent-400 text-xs tracking-[0.3em] uppercase font-semibold">
              Our Hostels
            </span>
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-background-50 mt-2">
              Comfort in every location.
            </h1>
            <p className="mt-3 text-background-200 max-w-xl">
              Explore each of our hostels across Rawalpindi and find the one closest to your university.
            </p>
          </div>
        </div>
      </section>

      {/* Search + list */}
      <section className="py-16 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-md">
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground-400"></i>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or location..."
                className="w-full pl-11 pr-4 py-3 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-foreground-500">
              <i className="ri-loader-4-line animate-spin text-3xl"></i>
              <p className="mt-3 text-sm">Loading hostels…</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <p className="text-sm text-accent-700">{error}</p>
              <button
                onClick={reload}
                className="mt-4 px-4 py-2 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-foreground-500">
              No hostels match your search.
            </div>
          ) : (
            sections.map((section) =>
              section.items.length === 0 ? null : (
                <div key={section.key} className="mt-12 first:mt-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${section.iconClass}`}
                    >
                      <i className={`${section.icon} text-lg`}></i>
                    </div>
                    <h2 className="font-heading text-2xl font-bold text-foreground-950">
                      {section.title}
                    </h2>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-secondary-100 text-secondary-900 font-semibold">
                      {section.items.length}
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-product-shop>
                    {section.items.map((h) => (
                      <HostelCard key={h.id} h={h} />
                    ))}
                  </div>
                </div>
              ),
            )
          )}
        </div>
      </section>

      <SiteFooter />
      <WhatsAppFab />
    </div>
  );
}