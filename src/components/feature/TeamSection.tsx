import { leadership, wardens } from "@/mocks/team";

type TeamSectionProps = {
  showWardens?: boolean;
};

export default function TeamSection({ showWardens = true }: TeamSectionProps) {
  return (
    <section id="team" className="py-24 px-4 md:px-8 bg-background-50">
      <div className="mx-auto max-w-7xl">
        {/* Leadership Team */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs tracking-[0.3em] uppercase text-primary-600 font-semibold">
            Leadership Team
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground-950 mt-3">
            The people behind every student&apos;s comfort
          </h2>
          <p className="mt-4 text-foreground-600">
            A dedicated management team working around the clock to keep every residence clean,
            safe and welcoming.
          </p>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {leadership.map((m) => (
            <div
              key={m.name}
              className="bg-background-50 border border-background-200 rounded-2xl overflow-hidden hover:border-primary-300 transition"
            >
              <div className="relative h-72 overflow-hidden">
                <img
                  src={m.photo}
                  alt={m.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="p-5 text-center">
                <h3 className="font-heading text-lg font-bold text-foreground-950">{m.name}</h3>
                <div className="text-sm font-semibold text-primary-600 mt-1">{m.role}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Wardens */}
        {showWardens && (
          <>
            <div className="mt-20 text-center max-w-2xl mx-auto">
              <span className="text-xs tracking-[0.3em] uppercase text-primary-600 font-semibold">
                Our Wardens
              </span>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground-950 mt-3">
                The caretakers of every residence
              </h2>
              <p className="mt-4 text-foreground-600">
                Every hostel has a dedicated resident warden responsible for the safety, discipline
                and wellbeing of its students — available on-site around the clock.
              </p>
            </div>

            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wardens.map((w) => (
                <div
                  key={w.name}
                  className="bg-background-50 border border-background-200 rounded-2xl overflow-hidden hover:border-primary-300 transition"
                >
                  <div className="relative h-72 overflow-hidden">
                    <img
                      src={w.photo}
                      alt={w.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-heading text-lg font-bold text-foreground-950 text-center">
                      {w.name}
                    </h3>
                    <div className="text-sm font-semibold text-primary-600 mt-1 text-center">
                      {w.role}
                    </div>
                    <div className="mt-4 pt-4 border-t border-background-200 space-y-2.5 text-sm">
                      <div className="flex items-start gap-2">
                        <i className="ri-building-2-line text-primary-600 mt-0.5"></i>
                        <span className="text-foreground-700">{w.hostelName}</span>
                      </div>
                      <a
                        href={`tel:${w.phone.replace(/\s/g, "")}`}
                        className="flex items-center gap-2 text-foreground-700 hover:text-primary-600 cursor-pointer"
                      >
                        <i className="ri-phone-line text-primary-600"></i>
                        {w.phone}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}