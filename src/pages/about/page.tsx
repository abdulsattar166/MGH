import SiteNavbar from "@/components/feature/SiteNavbar";
import SiteFooter from "@/components/feature/SiteFooter";
import WhatsAppFab from "@/pages/home/components/WhatsAppFab";
import TeamSection from "@/components/feature/TeamSection";
import { ceo } from "@/mocks/team";
import { useWardens } from "@/hooks/useWardens";
import { useHostels } from "@/hooks/useHostels";

const values = [
  {
    icon: "ri-shield-check-line",
    title: "Our Mission",
    text: "To provide safe, affordable and dignified student accommodation where every resident can focus on their education without worry.",
  },
  {
    icon: "ri-eye-line",
    title: "Our Vision",
    text: "To become Pakistan's most trusted student-living brand — a true second home for students from every corner of the country.",
  },
  {
    icon: "ri-heart-3-line",
    title: "Student-First",
    text: "Every decision — from room design to food menus — is made with the student's comfort, safety and productivity in mind.",
  },
  {
    icon: "ri-award-line",
    title: "Quality Standards",
    text: "Consistent cleanliness, maintenance and service standards audited monthly across all of our hostels.",
  },
];

const milestones = [
  { year: "2012", text: "Founded with our first hostel on 6th Road, Rawalpindi, hosting 50 students." },
  { year: "2015", text: "Expanded to three hostels with dedicated wardens and 24/7 security." },
  { year: "2019", text: "Introduced premium room categories, mess services and fiber Wi-Fi." },
  { year: "2022", text: "Grew to a network of hostels serving hundreds of students across Rawalpindi." },
  { year: "2026", text: "Launched our digital platform with online admissions and management." },
];

export default function About() {
  const { wardens } = useWardens();
  const { hostels } = useHostels();

  return (
    <div className="min-h-screen bg-background-50">
      <SiteNavbar />

      {/* Hero */}
      <section className="relative h-[420px] md:h-[520px] overflow-hidden">
        <img
          src="https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/3a908a7d-8858-4a4c-b0d4-219122009883_compressed_unnamed.webp"
          alt="Mubarak Group of Hostels"
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
              About Us
            </span>
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-background-50 mt-2">
              A decade of caring for students
            </h1>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-24 px-4 md:px-8">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground-950 leading-tight">
              More than a place to sleep — a place to grow.
            </h2>
            <p className="mt-6 text-foreground-700 leading-relaxed">
              Mubarak Group of Hostels began in 2012 with a simple belief: that students deserve
              accommodation that treats them with dignity, security and care. What started as a
              single 50-bed hostel on 6th Road, Rawalpindi has grown into a network of hostels
              serving students from universities across Pakistan.
            </p>
            <p className="mt-4 text-foreground-700 leading-relaxed">
              Our management philosophy is rooted in discipline and respect — for the student, for
              the family that trusts us, and for the learning environment we help protect. We
              believe a clean room, a warm meal and a safe building are not luxuries; they are the
              foundation every student needs to succeed.
            </p>
            <p className="mt-4 text-foreground-700 leading-relaxed">
              Today, our team of wardens, managers and support staff work around the clock to
              maintain the highest standards of cleanliness, security and student support across
              every one of our branches.
            </p>
          </div>
          <div className="relative">
            <img
              src="https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/db69d22d-f7de-46d5-bd73-201f66a529af_compressed_unnamed-3.webp"
              alt="Hostel lounge"
              className="w-full h-[420px] object-cover object-top rounded-2xl"
            />
            <div className="absolute -bottom-8 -left-6 bg-accent-500 rounded-xl px-7 py-5">
              <div className="font-heading text-4xl font-bold text-foreground-950">14+</div>
              <div className="text-xs uppercase tracking-widest text-foreground-800">Years of Trust</div>
            </div>
          </div>
        </div>
      </section>

      {/* CEO */}
      <section className="py-24 px-4 md:px-8 bg-background-50">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-[1fr_1.4fr] gap-12 items-center">
          <div className="relative">
            <img
              src={ceo.photo}
              alt={ceo.name}
              className="w-full h-[440px] md:h-[500px] object-cover object-top rounded-2xl"
            />
            <div className="absolute -bottom-6 -right-6 bg-accent-500 rounded-xl px-6 py-4 hidden md:block">
              <div className="font-heading text-lg font-bold text-foreground-950">Founder</div>
              <div className="text-xs text-foreground-800">Est. 2012</div>
            </div>
          </div>
          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-primary-600 font-semibold">
              Meet Our CEO
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground-950 mt-3">
              {ceo.name}
            </h2>
            <div className="text-foreground-600 font-semibold mt-1">{ceo.title}</div>
            <div className="text-foreground-500 text-sm mt-1">{ceo.designation}</div>
            <p className="mt-6 text-foreground-700 leading-relaxed">{ceo.intro}</p>
            <blockquote className="mt-6 text-foreground-600 italic border-l-2 border-accent-500 pl-4">
              "{ceo.quote}"
            </blockquote>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href={`tel:${ceo.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
              >
                <i className="ri-phone-line"></i>
                {ceo.phone}
              </a>
              <a
                href={`mailto:${ceo.email}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-background-300 text-foreground-800 text-sm font-semibold whitespace-nowrap cursor-pointer hover:bg-background-100 transition"
              >
                <i className="ri-mail-line"></i>
                {ceo.email}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <TeamSection showWardens={false} />

      {/* Wardens */}
      <section className="py-24 px-4 md:px-8 bg-background-100">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
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
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wardens.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3 text-center py-10 text-foreground-500 text-sm">
                Warden details will appear here once accounts are assigned.
              </div>
            ) : (
              wardens.map((w) => {
                const hostel = hostels.find((h) => h.id === w.hostelId);
                return (
                  <div
                    key={w.id}
                    className="bg-background-50 border border-background-200 rounded-2xl p-6 hover:border-primary-300 transition"
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-4 border-background-100 bg-secondary-500 text-background-50 flex items-center justify-center text-2xl font-bold">
                      {w.avatarUrl ? (
                        <img src={w.avatarUrl} alt={w.name} className="w-full h-full object-cover object-top" />
                      ) : (
                        w.name.charAt(0)
                      )}
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="font-heading text-lg font-bold text-foreground-950">{w.name}</h3>
                      <div className="text-sm text-foreground-500 mt-0.5">{w.position ?? "Warden"}</div>
                    </div>
                    <div className="mt-5 pt-5 border-t border-background-200 space-y-2.5 text-sm">
                      <div className="flex items-start gap-2">
                        <i className="ri-building-2-line text-primary-600 mt-0.5"></i>
                        <span className="text-foreground-700">{hostel?.name ?? "Unassigned"}</span>
                      </div>
                      <a
                        href={`tel:${(w.phone ?? "").replace(/\s/g, "")}`}
                        className="flex items-center gap-2 text-foreground-700 hover:text-primary-600 cursor-pointer"
                      >
                        <i className="ri-phone-line text-primary-600"></i>
                        {w.phone ?? "—"}
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-4 md:px-8 bg-background-100">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs tracking-[0.3em] uppercase text-primary-600 font-semibold">
              Our Values
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground-950 mt-3">
              What we stand for
            </h2>
          </div>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div
                key={v.title}
                className={`rounded-2xl p-7 border ${
                  i === 1
                    ? "bg-primary-500 border-primary-500 text-background-50"
                    : "bg-background-50 border-background-200"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-md flex items-center justify-center ${
                    i === 1 ? "bg-background-50/15" : "bg-primary-50"
                  }`}
                >
                  <i
                    className={`${v.icon} text-2xl ${i === 1 ? "text-background-50" : "text-primary-600"}`}
                  ></i>
                </div>
                <h3 className={`mt-5 font-heading text-lg font-bold ${i === 1 ? "text-background-50" : "text-foreground-950"}`}>
                  {v.title}
                </h3>
                <p className={`mt-2 text-sm leading-relaxed ${i === 1 ? "text-background-100" : "text-foreground-600"}`}>
                  {v.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 px-4 md:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <span className="text-xs tracking-[0.3em] uppercase text-primary-600 font-semibold">
              Our Journey
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground-950 mt-3">
              How we got here
            </h2>
          </div>
          <div className="mt-14 relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-background-300"></div>
            {milestones.map((m, i) => (
              <div key={m.year} className="relative flex gap-6 pb-10 last:pb-0 pl-16">
                <div
                  className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    i === milestones.length - 1 ? "bg-accent-500" : "bg-primary-500"
                  }`}
                >
                  <span className="text-background-50 font-semibold text-sm">{m.year.slice(2)}</span>
                </div>
                <div className="bg-background-50 border border-background-200 rounded-xl p-5 flex-1">
                  <div className="font-heading text-lg font-bold text-foreground-950">{m.year}</div>
                  <p className="mt-1 text-foreground-600 text-sm leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
      <WhatsAppFab />
    </div>
  );
}