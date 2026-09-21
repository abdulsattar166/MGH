import { ceo } from "@/mocks/team";

export default function About() {
  return (
    <section id="about" className="py-24 px-4 md:px-8 bg-background-50">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-14 items-center">
        <div className="relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 hidden md:block">
            <img
              src="https://static.readdy.ai/image/773d73dcd4bfe3b3ab546a821d990052/7b72bbd942d6c3a71db63e797abcba69.png"
              alt="Mubarak Group of Hostels"
              className="h-16 w-auto rounded-lg bg-background-50/95 px-3 py-1"
            />
          </div>
          <img
            src="https://readdy.ai/api/search-image?query=Warm%20and%20inviting%20student%20hostel%20common%20lounge%20interior%20with%20modern%20wooden%20furniture%2C%20soft%20cream%20and%20sage%20green%20cushions%2C%20large%20windows%20filling%20the%20room%20with%20soft%20natural%20daylight%2C%20potted%20green%20plants%2C%20clean%20minimalist%20cozy%20premium%20accommodation%20design%2C%20editorial%20interior%20photography%20with%20soft%20shadows%20and%20harmonious%20warm%20neutral%20composition&width=1200&height=1300&seq=about-lounge-main&orientation=portrait"
            alt="Mubarak Hostel lounge"
            className="w-full h-[520px] object-cover object-top rounded-2xl"
          />
          <img
            src="https://readdy.ai/api/search-image?query=Happy%20diverse%20university%20students%20studying%20together%20around%20a%20warm%20wooden%20table%20in%20a%20bright%20modern%20hostel%20study%20lounge%2C%20laptops%20and%20notebooks%20spread%20out%2C%20soft%20golden%20natural%20light%20through%20large%20windows%2C%20green%20plants%20and%20bookshelves%20in%20the%20background%2C%20candid%20editorial%20lifestyle%20photography%20with%20warm%20cozy%20tones&width=600&height=600&seq=about-students-study&orientation=squarish"
            alt="Students studying"
            className="hidden md:block absolute -bottom-10 -right-10 w-56 h-56 object-cover object-top rounded-2xl border-8 border-background-50"
          />
          <div className="absolute -top-6 -left-6 bg-accent-500 rounded-xl px-6 py-4 hidden md:block">
            <div className="font-heading text-3xl font-bold text-foreground-950">12+</div>
            <div className="text-xs uppercase tracking-widest text-foreground-800">Years of Trust</div>
          </div>
        </div>

        <div>
          <span className="text-xs tracking-[0.3em] uppercase text-primary-600 font-semibold">
            About Mubarak Group
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground-950 mt-3 leading-tight">
            A safe, focused &amp; caring home for every student.
          </h2>
          <p className="mt-6 text-foreground-700 leading-relaxed">
            For over a decade, Mubarak Group of Hostels has been redefining what student living should
            feel like — clean rooms, fresh food, a strong sense of community and around-the-clock
            security. Across our six hostels in Lahore, we host hundreds of students from universities
            all over Pakistan, giving them the peace of mind to focus on what really matters: their
            studies and their future.
          </p>

          <div className="mt-8 grid sm:grid-cols-2 gap-5">
            {[
              { icon: "ri-shield-check-line", title: "Our Mission", text: "Provide safe, affordable and dignified accommodation for every student." },
              { icon: "ri-eye-line", title: "Our Vision", text: "Be Pakistan's most trusted student-living brand — a true second home." },
              { icon: "ri-community-line", title: "Community", text: "A respectful, disciplined and study-friendly environment for all residents." },
              { icon: "ri-award-line", title: "Standards", text: "Consistent quality across all six branches, audited every single month." },
            ].map((v) => (
              <div key={v.title} className="flex gap-4">
                <div className="w-11 h-11 rounded-md bg-primary-50 flex items-center justify-center shrink-0">
                  <i className={`${v.icon} text-primary-600 text-xl`}></i>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground-950">{v.title}</h4>
                  <p className="text-sm text-foreground-600 mt-1">{v.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CEO */}
      <div className="mx-auto max-w-7xl mt-20">
        <div className="bg-background-100 border border-background-200 rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-10">
          <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden shrink-0 border-4 border-background-50">
            <img src={ceo.photo} alt={ceo.name} className="w-full h-full object-cover object-top" />
          </div>
          <div className="text-center md:text-left">
            <span className="text-xs tracking-[0.3em] uppercase text-primary-600 font-semibold">
              From the Founder
            </span>
            <h3 className="font-heading text-2xl md:text-3xl font-bold text-foreground-950 mt-2">
              {ceo.name}
            </h3>
            <div className="text-sm font-semibold text-foreground-600 mt-1">{ceo.title}</div>
            <p className="mt-4 text-foreground-700 leading-relaxed max-w-2xl">{ceo.intro}</p>
            <blockquote className="mt-5 text-foreground-600 italic border-l-2 border-accent-500 pl-4 max-w-2xl">
              "{ceo.quote}"
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}