import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { hostels, hostelDetails } from "@/mocks/hostels";

export default function HostelGallery() {
  const { id } = useParams();
  const hostel = hostels.find((h) => h.id === Number(id));
  const detail = hostelDetails.find((d) => d.id === Number(id));
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!hostel || !detail) return null;

  const categories = [
    "Building & Exterior",
    "Rooms & Beds",
    "Common Areas",
    "Dining",
  ];

  return (
    <div>
      {/* Page header */}
      <section className="relative pt-32 pb-14 px-4 md:px-8 bg-foreground-950">
        <div className="mx-auto max-w-7xl">
          <Link
            to={`/hostel/${id}`}
            className="inline-flex items-center gap-2 text-background-300 hover:text-accent-300 text-sm cursor-pointer"
          >
            <i className="ri-arrow-left-line"></i>
            Back to {hostel.name}
          </Link>
          <h1 className="mt-4 font-heading text-3xl md:text-4xl font-bold text-background-50">
            Gallery
          </h1>
          <p className="mt-3 text-background-200 max-w-2xl">
            A look inside {hostel.name} — from the building exterior and rooms to the dining and
            common areas.
          </p>
        </div>
      </section>

      {/* Gallery grid */}
      <section className="py-16 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {detail.gallery.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightbox(i)}
                className="group relative rounded-2xl overflow-hidden border border-background-200 cursor-pointer text-left"
              >
                <img
                  src={img}
                  alt={`${hostel.name} gallery image ${i + 1}`}
                  className="w-full h-64 object-cover object-top group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground-950/60 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-background-50/90 text-foreground-900 text-xs font-semibold opacity-0 group-hover:opacity-100 transition">
                  {categories[i % categories.length]}
                </span>
                <span className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background-50/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <i className="ri-zoom-in-line text-foreground-900"></i>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[60] bg-foreground-950/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={detail.gallery[lightbox]}
              alt={`${hostel.name} gallery enlarged`}
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-4 -right-4 w-11 h-11 rounded-full bg-background-50 text-foreground-900 flex items-center justify-center cursor-pointer"
              aria-label="Close"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
            <button
              onClick={() => setLightbox((lightbox - 1 + detail.gallery.length) % detail.gallery.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background-50/90 text-foreground-900 flex items-center justify-center cursor-pointer"
              aria-label="Previous image"
            >
              <i className="ri-arrow-left-line text-xl"></i>
            </button>
            <button
              onClick={() => setLightbox((lightbox + 1) % detail.gallery.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background-50/90 text-foreground-900 flex items-center justify-center cursor-pointer"
              aria-label="Next image"
            >
              <i className="ri-arrow-right-line text-xl"></i>
            </button>
            <div className="mt-3 text-center text-background-200 text-sm">
              {lightbox + 1} / {detail.gallery.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}