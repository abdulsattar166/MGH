import { useEffect, useRef, useState } from "react";
import { useHostelsFull } from "@/hooks/useHostelsFull";

function Counter({ end, suffix }: { end: number; suffix: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1600;
          const startTime = performance.now();
          const step = (t: number) => {
            const p = Math.min((t - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setN(Math.round(end * eased));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      });
    });
    io.observe(el);
    return () => io.disconnect();
  }, [end]);

  return (
    <span ref={ref} className="font-heading text-4xl md:text-5xl font-bold text-primary-600">
      {n}
      <span className="text-accent-600">{suffix}</span>
    </span>
  );
}

export default function Stats() {
  const { hostels, loading, error, reload } = useHostelsFull();

  const totalHostels = hostels.length;
  const totalRooms = hostels.reduce((s, h) => s + h.rooms, 0);
  const totalBeds = hostels.reduce((s, h) => s + h.beds, 0);
  const totalAvailable = hostels.reduce((s, h) => s + h.available, 0);
  const occupancy = totalBeds ? Math.round(((totalBeds - totalAvailable) / totalBeds) * 100) : 0;
  const floorsPerHostel = hostels.length ? Math.max(...hostels.map((h) => h.floors)) : 0;

  const stats = [
    { value: totalHostels, suffix: "", label: "Hostels", icon: "ri-building-2-line" },
    { value: totalRooms, suffix: "+", label: "Rooms", icon: "ri-door-open-line" },
    { value: totalBeds, suffix: "+", label: "Beds", icon: "ri-hotel-bed-line" },
    { value: totalAvailable, suffix: "", label: "Beds Available", icon: "ri-check-double-line" },
    { value: occupancy, suffix: "%", label: "Occupancy", icon: "ri-pie-chart-line" },
    { value: floorsPerHostel, suffix: "", label: "Floors / Hostel", icon: "ri-stack-line" },
  ];

  return (
    <section className="relative -mt-16 z-20 px-4 md:px-8">
      <div className="mx-auto max-w-7xl bg-background-50 rounded-2xl border border-background-200 px-6 md:px-10 py-10">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-foreground-500">
            <i className="ri-loader-4-line animate-spin text-xl"></i>
            <span className="text-sm">Loading live figures…</span>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-foreground-500">{error}</p>
            <button
              onClick={reload}
              className="mt-3 px-4 py-2 rounded-md bg-secondary-500 hover:bg-secondary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center text-center gap-2">
                <div className="w-11 h-11 rounded-full bg-primary-50 flex items-center justify-center">
                  <i className={`${s.icon} text-primary-600 text-xl`}></i>
                </div>
                <Counter end={s.value} suffix={s.suffix} />
                <p className="text-xs md:text-sm text-foreground-600 uppercase tracking-wider">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}