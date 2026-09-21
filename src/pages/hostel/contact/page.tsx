import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { hostels, hostelLocations } from "@/mocks/hostels";
import { useWardens } from "@/hooks/useWardens";
import WardenCard from "@/pages/hostel/components/WardenCard";

const FORM_URL = "https://readdy.ai/api/form/da6o2muij9sffln41iug";

export default function HostelContact() {
  const { id } = useParams();
  const hostel = hostels.find((h) => h.id === Number(id));
  const loc = hostelLocations.find((l) => l.id === Number(id));
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const { forHostel } = useWardens();
  const wardenForHostel = forHostel(hostel ? hostel.id : null);

  if (!hostel || !loc) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const honeypot = formData.get("website_alt");
    if (typeof honeypot === "string" && honeypot.trim() !== "") {
      setStatus("success");
      setMessage("Thank you! Your enquiry has been received. Our team will contact you shortly.");
      form.reset();
      return;
    }

    formData.delete("website_alt");
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
        setMessage("Thank you! Your enquiry has been received. Our team will contact you shortly.");
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
            Contact Us
          </h1>
          <p className="mt-3 text-background-200 max-w-2xl">
            Have a question about {hostel.name}? Reach out and our team will get back to you within
            24 hours.
          </p>
        </div>
      </section>

      {/* Contact body */}
      <section className="py-16 px-4 md:px-8">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-3 gap-10">
          {/* Info */}
          <div className="space-y-5">
            <div className="bg-background-100 border border-background-200 rounded-2xl p-6">
              <h3 className="font-heading text-lg font-bold text-foreground-950">Get in touch</h3>
              <ul className="mt-5 space-y-4 text-sm">
                <li className="flex gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary-50 flex items-center justify-center shrink-0">
                    <i className="ri-map-pin-line text-primary-600"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground-950">Address</div>
                    <div className="text-foreground-600">{loc.address}</div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary-50 flex items-center justify-center shrink-0">
                    <i className="ri-phone-line text-primary-600"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground-950">Phone</div>
                    <div className="text-foreground-600">{loc.phone}</div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary-50 flex items-center justify-center shrink-0">
                    <i className="ri-mail-line text-primary-600"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground-950">Email</div>
                    <div className="text-foreground-600">{loc.email}</div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-10 h-10 rounded-md bg-accent-100 flex items-center justify-center shrink-0">
                    <i className="ri-whatsapp-line text-accent-900"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground-950">WhatsApp</div>
                    <a
                      href={`https://wa.me/${loc.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground-600 hover:text-primary-600 cursor-pointer"
                    >
                      Chat with us
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-background-100 border border-background-200 rounded-2xl p-6">
              <h3 className="font-heading text-lg font-bold text-foreground-950">Warden</h3>
              <div className="mt-4">
                <WardenCard
                  name={wardenForHostel?.name ?? loc.warden}
                  position={wardenForHostel?.position ?? "Warden"}
                  hostelName={hostel.name}
                  phone={wardenForHostel?.phone ?? null}
                  email={wardenForHostel?.email ?? null}
                  avatarUrl={wardenForHostel?.avatarUrl ?? null}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-background-50 border border-background-200 rounded-2xl p-6 md:p-8">
            <h2 className="font-heading text-xl font-bold text-foreground-950">Send an enquiry</h2>
            <p className="mt-2 text-sm text-foreground-600">
              Fill in the form below and we'll respond as soon as possible.
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
              id={`hostel-contact-${id}`}
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
              <div className="sm:col-span-2">
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
                  placeholder="Ask about rooms, availability, fees or admission..."
                ></textarea>
                <div className="mt-1 text-xs text-foreground-400">Maximum 500 characters.</div>
              </div>

              <input
                type="text"
                name="website_alt"
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
                  {status === "submitting" ? "Sending..." : "Send Enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Map */}
        <div className="mx-auto max-w-7xl mt-12">
          <div className="rounded-2xl overflow-hidden border border-background-200 h-[400px]">
            <iframe
              src={loc.mapEmbed}
              title={`${hostel.name} location map`}
              className="w-full h-full border-0"
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
}