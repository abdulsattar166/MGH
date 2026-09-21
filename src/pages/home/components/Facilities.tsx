import { facilities } from "@/mocks/hostels";

export default function Facilities() {
  return (
    <section id="facilities" className="py-24 px-4 md:px-8 bg-background-100">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs tracking-[0.3em] uppercase text-primary-600 font-semibold">
            Facilities &amp; Services
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground-950 mt-3">
            Everything you need. Nothing you don't.
          </h2>
          <p className="mt-4 text-foreground-600">
            From high-speed Wi-Fi to home-style meals, every detail is designed around the
            student's day.
          </p>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {facilities.map((f, i) => (
            <div
              key={f.title}
              className={`group rounded-xl p-6 border transition-all cursor-pointer ${
                i === 1
                  ? "bg-primary-500 border-primary-500 text-background-50"
                  : "bg-background-50 border-background-200 hover:border-primary-300"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-md flex items-center justify-center ${
                  i === 1 ? "bg-background-50/15" : "bg-primary-50 group-hover:bg-primary-100"
                }`}
              >
                <i
                  className={`${f.icon} text-2xl ${
                    i === 1 ? "text-background-50" : "text-primary-600"
                  }`}
                ></i>
              </div>
              <h3
                className={`mt-5 font-heading text-lg font-bold ${
                  i === 1 ? "text-background-50" : "text-foreground-950"
                }`}
              >
                {f.title}
              </h3>
              <p
                className={`mt-2 text-sm leading-relaxed ${
                  i === 1 ? "text-background-100" : "text-foreground-600"
                }`}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}