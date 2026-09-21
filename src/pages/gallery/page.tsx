import { useState } from "react";
import SiteNavbar from "@/components/feature/SiteNavbar";
import SiteFooter from "@/components/feature/SiteFooter";
import WhatsAppFab from "@/pages/home/components/WhatsAppFab";
import { galleryItems } from "@/mocks/site";

const categories = ["All", "Exterior", "Rooms", "Dining", "Study", "Common Areas", "Washrooms", "Facilities"];

export default function Gallery() {
  const [active, setActive] = useState("All");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filtered =
    active === "All" ? galleryItems : galleryItems.filter((g) => g.category === active);

  return (
    <div className="min-h-screen bg-background-50">
      <SiteNavbar />

      <section className="relative h-[380px] md:h-[460px] overflow-hidden">
        <img
          src="https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/b3c6a844-4444-434f-b25a-221a79675a38_compressed_unnamed-9.webp"
          alt="Gallery"
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
              Gallery
            </span>
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-background-50 mt-2">
              Life inside our hostels
            </h1>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition ${
                  active === c
                    ? "bg-primary-500 text-background-50"
                    : "bg-background-100 text-foreground-700 hover:bg-background-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((g, i) => (
              <button
                key={i}
                onClick={() => setLightbox(g.image)}
                className="group relative rounded-2xl overflow-hidden cursor-pointer border border-background-200 hover:border-primary-300 transition"
              >
                <img
                  src={g.image}
                  alt={g.category}
                  className="w-full h-64 object-cover object-top group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground-950/60 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  <span className="px-3 py-1 rounded-full bg-background-50/90 text-xs font-semibold text-foreground-900">
                    {g.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-foreground-950/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-background-50/20 flex items-center justify-center text-background-50 cursor-pointer hover:bg-background-50/30 transition"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
          <img
            src={lightbox}
            alt="Gallery preview"
            className="max-w-5xl max-h-[85vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <SiteFooter />
      <WhatsAppFab />
    </div>
  );
}