import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const WHATSAPP_LINK =
  "https://wa.me/923000000000?text=" +
  encodeURIComponent(
    "Hello, I am interested in getting admission at Mubarak Group of Hostels. Please provide me with the available rooms and admission details.",
  );

export default function Hero() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      id="home"
      className="relative h-screen min-h-[560px] w-full overflow-hidden bg-foreground-950"
    >
      {/* Background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="https://readdy.ai/api/search-image?query=Modern%20Pakistani%20boys%20hostel%20building%20with%20warm%20evening%20lighting%20and%20clean%20exterior%2C%20neat%20shared%20bedroom%20with%20bunk%20beds%20and%20study%20desks%2C%20welcoming%20student%20accommodation%2C%20architectural%20photography%20with%20soft%20natural%20tones%2C%20high%20detail%2C%20harmonious%20composition&width=1920&height=1080&seq=hero-poster-1&orientation=landscape"
      >
        <source
          src="https://storage.helloreaddy.io/project_files/9cdb5fa8-b5b4-4047-a387-50ae18ce3247/8a4a10fc-55c3-4428-ba33-8e3ac1c52e79_WhatsApp-Video-2026-09-15-at-10.07.04-PM.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark overlay for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60"></div>

      {/* Centered content */}
      <div
        className={`relative h-full w-full flex items-center justify-center px-4 md:px-8 transition-opacity duration-1000 ease-out ${
          visible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-w-3xl text-center">
          <h1
            className="font-heading text-background-50 text-3xl md:text-5xl lg:text-6xl font-bold leading-tight animate-fade-up"
          >
            Your second home away from your home
          </h1>

          <div
            className="mt-6 md:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2.5 md:gap-3 animate-fade-up"
            style={{ animationDelay: "0.15s" }}
          >
            <Link
              to="/booking"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-sm rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 font-semibold whitespace-nowrap cursor-pointer transition"
            >
              <i className="ri-hotel-bed-line"></i>
              Book Your Room
            </Link>

            <Link
              to="/hostels"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-sm rounded-md bg-background-50/10 hover:bg-background-50/20 border border-background-50/40 text-background-50 font-semibold whitespace-nowrap cursor-pointer transition backdrop-blur-sm"
            >
              <i className="ri-compass-3-line"></i>
              Explore Hostel
            </Link>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-sm rounded-md bg-[#25D366] hover:bg-[#1eb958] text-white font-semibold whitespace-nowrap cursor-pointer transition"
            >
              <i className="ri-whatsapp-line"></i>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}