import { useEffect, useState } from "react";
import { reelVideos } from "@/mocks/videos";

const SPEEDS = [1, 1.25, 1.5] as const;
const BASE_DURATION = 50; // seconds for one full loop at 1x

type Reel = { src: string; caption: string };

function VideoCard({ src, caption, onOpen }: { src: string; caption: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative shrink-0 mr-5 w-[210px] md:w-[240px] aspect-[9/16] rounded-2xl overflow-hidden bg-background-200 group cursor-pointer text-left"
      aria-label={`Play video: ${caption}`}
    >
      <video
        src={src}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
      <div className="absolute top-3 left-3 flex items-center gap-1.5 text-white/90">
        <i className="ri-play-circle-fill text-lg"></i>
        <span className="text-[11px] font-semibold tracking-wide">Mubarak Group</span>
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-white">
        <span className="text-xs font-medium leading-snug drop-shadow-sm">{caption}</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
        <span className="w-14 h-14 rounded-full bg-background-50/90 flex items-center justify-center">
          <i className="ri-fullscreen-line text-foreground-950 text-2xl"></i>
        </span>
      </div>
    </button>
  );
}

export default function VideoReels() {
  const [speed, setSpeed] = useState<number>(1);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState<Reel | null>(null);

  const duration = BASE_DURATION / speed;

  useEffect(() => {
    if (active) {
      document.body.style.overflow = "hidden";
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setActive(null);
      };
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", onKey);
      };
    }
    return undefined;
  }, [active]);

  return (
    <section className="py-20 md:py-24 px-4 md:px-8 bg-background-100 overflow-hidden">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <span className="text-xs tracking-[0.3em] uppercase text-primary-600 font-semibold">
            Video Showcase
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground-950 mt-3 leading-tight">
            Life at Mubarak Hostels
          </h2>
          <p className="mt-4 text-foreground-700 max-w-xl leading-relaxed">
            Take a scroll through our reels and see what everyday student life feels like across the
            Mubarak Group of Hostels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground-600 mr-1">Speed</span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
                speed === s
                  ? "bg-primary-500 text-background-50"
                  : "bg-background-200 text-foreground-700 hover:bg-background-300"
              }`}
            >
              {s === 1 ? "1×" : `${s}×`}
            </button>
          ))}
        </div>
      </div>

      <div
        className="mt-10 relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="reel-track flex w-max"
          style={{
            animationDuration: `${duration}s`,
            animationPlayState: hovered ? "paused" : "running",
          }}
        >
          {[...reelVideos, ...reelVideos].map((v, i) => (
            <VideoCard key={i} src={v.src} caption={v.caption} onOpen={() => setActive(v)} />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-40 bg-gradient-to-r from-background-100 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-40 bg-gradient-to-l from-background-100 to-transparent" />
      </div>

      <p className="mt-6 text-center text-xs text-foreground-500">
        Click any video to watch it in full screen.
      </p>

      {/* Fullscreen modal */}
      {active && (
        <div className="fixed inset-0 z-[100] bg-foreground-950 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute top-4 right-4 md:top-6 md:right-6 z-10 w-11 h-11 rounded-full bg-background-50/10 hover:bg-background-50/20 border border-background-50/20 flex items-center justify-center cursor-pointer transition"
            aria-label="Close video"
          >
            <i className="ri-close-line text-background-50 text-2xl"></i>
          </button>

          <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-background-50">
              <i className="ri-play-circle-fill text-xl"></i>
              <span className="text-sm md:text-base font-medium">{active.caption}</span>
            </div>
            <span className="text-xs text-background-300">Mubarak Group of Hostels</span>
          </div>

          <video
            src={active.src}
            className="w-full h-full object-contain"
            autoPlay
            controls
            playsInline
          />
        </div>
      )}
    </section>
  );
}