import { useState } from "react";
import { Link } from "react-router-dom";
import SiteNavbar from "@/components/feature/SiteNavbar";
import SiteFooter from "@/components/feature/SiteFooter";
import WhatsAppFab from "@/pages/home/components/WhatsAppFab";
import { hostelLocations } from "@/mocks/hostels";

const FORM_URL = "https://readdy.ai/api/form/da6rskmij9sffln41kug";

const contactMethods = [
  {
    icon: "ri-map-pin-2-line",
    title: "Head Office",
    text: "6th Road, Rawalpindi, Pakistan",
    tone: "bg-primary-500",
  },
  {
    icon: "ri-phone-line",
    title: "Phone",
    text: "+92 300 000 0000",
    tone: "bg-primary-500",
  },
  {
    icon: "ri-mail-line",
    title: "Email",
    text: "admissions@mubarakhostels.pk",
    tone: "bg-primary-500",
  },
  {
    icon: "ri-time-line",
    title: "Business Hours",
    text: "Daily · 9:00 AM — 9:00 PM",
    tone: "bg-accent-500",
  },
  {
    icon: "ri-whatsapp-line",
    title: "WhatsApp",
    text: "+92 300 000 0000",
    tone: "bg-secondary-500",
  },
  {
    icon: "ri-alarm-warning-line",
    title: "Emergency",
    text: "+92 300 000 0999 (24/7)",
    tone: "bg-accent-500",
  },
];

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const honeypot = formData.get("company_alt");
    if (typeof honeypot === "string" && honeypot.trim() !== "") {
      setStatus("success");
      setMessage("Thank you! Your message has been received. Our team will contact you shortly.");
      form.reset();
      return;
    }

    formData.delete("company_alt");
    const params = new URLSearchParams();
    formData.forEach((value, key) => params.append(key, String(value)));

    setStatus("submitting");
    try {
      const res = await fetch(FORM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const responseText = await res.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = null;
      }
      const code = parsed?.code;
      if (res.ok && code === "OK") {
        setStatus("success");
        setMessage("Thank you! Your message has been received. Our team will contact you shortly.");
        form.reset();
      } else {
        setStatus("error");
        setMessage(
          parsed?.meta?.message || parsed?.message || parsed?.meta?.detail || responseText ||
            "Something went wrong. Please try again.",
        );
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background-50">
      <SiteNavbar />

      {/* Hero */}
      <section className="relative h-[380px] md:h-[460px] overflow-hidden">
        <img
          src="https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/31d7cd4e-7789-4a9a-99eb-dde331f13bb9_compressed_unnamed-1.webp"
          alt="Contact Mubarak Group of Hostels"
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
              Contact Us
            </span>
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-background-50 mt-2">
              We're here to help you move in.
            </h1>
            <p className="mt-3 text-background-200 max-w-xl">
              Questions about rooms, fees, availability or admission? Reach out and our team will
              respond within 24 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Contact methods */}
      <section className="py-16 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {contactMethods.map((c) => (
              <div
                key={c.title}
                className="flex gap-4 items-start bg-background-50 border border-background-200 rounded-2xl p-6"
              >
                <div className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 ${c.tone}`}>
                  <i className={`${c.icon} text-background-50 text-xl`}></i>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-foreground-500">{c.title}</div>
                  <div className="text-foreground-950 font-semibold mt-1">{c.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + map */}
      <section className="pb-20 px-4 md:px-8">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-10">
          {/* Form */}
          <div className="bg-background-50 border border-background-200 rounded-2xl p-6 md:p-8">
            <h2 className="font-heading text-2xl font-bold text-foreground-950">Send us a message</h2>
            <p className="mt-2 text-sm text-foreground-600">
              Fill in the form below and we'll get back to you as soon as possible.
            </p>

            {status === "success" && (
              <div className="mt-5 px-4 py-3 rounded-md bg-primary-50 text-primary-700 text-sm">
                {message}
              </div>
            )}
            {status === "error" && (
              <div className="mt-5 px-4 py-3 rounded-md bg-accent-50 text-accent-900 text-sm">
                {message}
              </div>
            )}

            <form
              id="site-contact-form"
              data-readdy-form
              onSubmit={handleSubmit}
              className="mt-6 grid sm:grid-cols-2 gap-5"
            >
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground-800 mb-1.5">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground-800 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground-800 mb-1.5">
                  Phone / WhatsApp
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="+92 3xx xxxxxxx"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-foreground-800 mb-1.5">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value="General Enquiry">General Enquiry</option>
                  <option value="Room Enquiry">Room Enquiry</option>
                  <option value="Booking Enquiry">Booking Enquiry</option>
                  <option value="Fee Information">Fee Information</option>
                  <option value="Complaint / Feedback">Complaint / Feedback</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="message" className="block text-sm font-medium text-foreground-800 mb-1.5">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  maxLength={500}
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                  placeholder="Tell us how we can help — rooms, availability, fees or admission..."
                ></textarea>
                <div className="mt-1 text-xs text-foreground-400">Maximum 500 characters.</div>
              </div>

              <input
                type="text"
                name="company_alt"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                readOnly
                className="hp-field"
              />

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full sm:w-auto px-7 py-3 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>

          {/* Map */}
          <div className="flex flex-col">
            <div className="rounded-2xl overflow-hidden border border-background-200 flex-1 min-h-[420px]">
              <iframe
                title="Mubarak Group of Hostels — Head Office Location"
                src="https://maps.google.com/maps?q=6th%20Road%20Rawalpindi&t=&z=14&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
              ></iframe>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <i className="ri-map-pin-line text-primary-600 mt-0.5"></i>
              <p className="text-sm text-foreground-600">
                Head office: 6th Road, Rawalpindi. Walk-ins welcome daily from 9:00 AM
                to 9:00 PM — we'd love to show you around.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Individual hostel contacts */}
      <section className="py-20 px-4 md:px-8 bg-background-100">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs tracking-[0.3em] uppercase text-primary-600 font-semibold">
              Reach a Specific Hostel
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground-950 mt-3">
              Contact any of our hostels directly
            </h2>
            <p className="mt-3 text-foreground-600">
              Each hostel has its own warden and contact line. Choose the one closest to your
              university.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hostelLocations.map((loc) => (
              <div
                key={loc.id}
                className="bg-background-50 border border-background-200 rounded-2xl p-6 flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-bold text-foreground-950">
                    Hostel 0{loc.id}
                  </h3>
                  <Link
                    to={`/hostel/${loc.id}/contact`}
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700 cursor-pointer"
                  >
                    Details
                    <i className="ri-arrow-right-line ml-1"></i>
                  </Link>
                </div>
                <div className="mt-4 space-y-2.5 text-sm text-foreground-700">
                  <div className="flex gap-2">
                    <i className="ri-map-pin-line text-primary-600 mt-0.5"></i>
                    {loc.address}
                  </div>
                  <div className="flex gap-2">
                    <i className="ri-phone-line text-primary-600 mt-0.5"></i>
                    {loc.phone}
                  </div>
                  <div className="flex gap-2">
                    <i className="ri-user-line text-primary-600 mt-0.5"></i>
                    Warden: <span className="font-semibold text-foreground-950">{loc.warden}</span>
                  </div>
                </div>
                <a
                  href={`https://wa.me/${loc.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-secondary-500 hover:bg-secondary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
                >
                  <i className="ri-whatsapp-line"></i>
                  Chat on WhatsApp
                </a>
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