import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const links = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Hostels", to: "/hostels" },
  { label: "Booking", to: "/booking" },
  { label: "Gallery", to: "/gallery" },
  { label: "Contact", to: "/contact" },
];

export default function SiteNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "bg-background-50/95 backdrop-blur border-b border-background-200"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 cursor-pointer">
          <img
            src="https://static.readdy.ai/image/773d73dcd4bfe3b3ab546a821d990052/7b72bbd942d6c3a71db63e797abcba69.png"
            alt="Mubarak Group of Hostels"
            className="h-12 w-auto"
          />
          <div className="flex flex-col leading-tight">
            <span
              className={`font-heading text-lg font-bold ${
                scrolled || open ? "text-foreground-950" : "text-background-50"
              }`}
            >
              Mubarak Group
            </span>
            <span
              className={`text-[10px] tracking-[0.25em] uppercase ${
                scrolled || open ? "text-foreground-600" : "text-background-200"
              }`}
            >
              of Hostels
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium transition-colors cursor-pointer ${
                scrolled
                  ? "text-foreground-700 hover:text-primary-600"
                  : "text-background-50/90 hover:text-accent-300"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            to="/booking"
            className="px-5 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
          >
            Book a Room
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className={`lg:hidden w-10 h-10 flex items-center justify-center cursor-pointer ${
            scrolled || open ? "text-foreground-900" : "text-background-50"
          }`}
          aria-label="Toggle menu"
        >
          <i className={`${open ? "ri-close-line" : "ri-menu-line"} text-2xl`}></i>
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-background-50 border-t border-background-200 px-4 py-4 space-y-2">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-md text-foreground-800 hover:bg-background-100 cursor-pointer text-sm font-medium"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/booking"
            onClick={() => setOpen(false)}
            className="block text-center px-3 py-2.5 rounded-md bg-primary-500 text-background-50 font-semibold cursor-pointer"
          >
            Book a Room
          </Link>
        </div>
      )}
    </header>
  );
}