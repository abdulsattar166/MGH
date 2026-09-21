export default function Contact() {
  return (
    <section id="contact" className="py-24 px-4 md:px-8 bg-background-100">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-12">
        <div>
          <span className="text-xs tracking-[0.3em] uppercase text-primary-600 font-semibold">
            Get In Touch
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground-950 mt-3 leading-tight">
            Visit us, call us or WhatsApp us — anytime.
          </h2>
          <p className="mt-5 text-foreground-600">
            Our admission office is open every day from 9:00 AM to 9:00 PM. Walk-ins are welcome —
            we'd love to show you around.
          </p>

          <div className="mt-8 space-y-5">
            {[
              { icon: "ri-map-pin-2-line", title: "Head Office", text: "6th Road, Rawalpindi, Pakistan" },
              { icon: "ri-phone-line", title: "Phone", text: "+92 300 000 0000  ·  +92 42 111 222 333" },
              { icon: "ri-mail-line", title: "Email", text: "admissions@mubarakhostels.pk" },
              { icon: "ri-time-line", title: "Hours", text: "Daily · 9:00 AM — 9:00 PM" },
            ].map((c) => (
              <div key={c.title} className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-md bg-primary-500 flex items-center justify-center shrink-0">
                  <i className={`${c.icon} text-background-50 text-lg`}></i>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-foreground-500">{c.title}</div>
                  <div className="text-foreground-950 font-medium mt-0.5">{c.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-background-200 h-[520px]">
          <iframe
            title="Mubarak Group of Hostels — Location"
            src="https://www.google.com/maps?q=6th+Road+Rawalpindi&output=embed"
            className="w-full h-full"
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </section>
  );
}