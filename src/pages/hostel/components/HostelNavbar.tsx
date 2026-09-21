import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

type Props = {
  id: number;
  name: string;
};

export default function HostelNavbar({ id, name }: Props) {
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

  const links = [
    { label: "Home", to: `/hostel/${id}` },
    { label: "Rooms", to: `/hostel/${id}/rooms` },
    { label: "Notices", to: `/hostel/${id}/notices` },
    { label: "Gallery", to: `/hostel/${id}/gallery` },
    { label: "Contact", to: `/hostel/${id}/contact` },
  ];

  const isActive = (to: string) => location.pathname === to;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "bg-background-50/95 backdrop-blur border-b border-background-200"
          : "bg-foreground-950/40 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-medium cursor-pointer shrink-0"
            title="Back to Mubarak Group"
          >
            <i
              className={`ri-arrow-left-line ${
                scrolled || open ? "text-foreground-600" : "text-background-200"
              }`}
            ></i>
          </Link>
          <Link to={`/hostel/${id}`} className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-md bg-primary-500 flex items-center justify-center shrink-0">
              <i className="ri-home-heart-fill text-background-50 text-xl"></i>
            </div>
            <div className="flex flex-col leading-tight">
              <span
                className={`text-[10px] tracking-[0.2em] uppercase ${
                  scrolled || open ? "text-foreground-500" : "text-background-300"
                }`}
              >
                Mubarak Group
              </span>
              <span
                className={`font-heading text-base font-bold leading-tight ${
                  scrolled || open ? "text-foreground-950" : "text-background-50"
                }`}
              >
                {name}
              </span>
            </div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isActive(l.to)
                  ? "text-primary-600 font-semibold"
                  : scrolled
                    ? "text-foreground-700 hover:text-primary-600"
                    : "text-background-50/90 hover:text-accent-300"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2.5">
          <Link
            to={`/hostel/${id}/warden-login`}
            className="px-4 py-2.5 rounded-md border border-background-300 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
          >
            <i className="ri-user-settings-line mr-1.5"></i>
            Warden Login
          </Link>
          <Link
            to={`/booking?hostel=${id}`}
            className="px-5 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
          >
            Book Now
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
        <div className="lg:hidden bg-background-50 border-t border-background-200 px-4 py-4 space-y-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2.5 rounded-md cursor-pointer text-sm font-medium ${
                isActive(l.to)
                  ? "bg-primary-50 text-primary-700"
                  : "text-foreground-800 hover:bg-background-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to={`/hostel/${id}/warden-login`}
            onClick={() => setOpen(false)}
            className="block text-center px-3 py-2.5 rounded-md border border-background-300 text-foreground-800 font-semibold cursor-pointer"
          >
            Warden Login
          </Link>
          <Link
            to={`/booking?hostel=${id}`}
            onClick={() => setOpen(false)}
            className="block text-center px-3 py-2.5 rounded-md bg-primary-500 text-background-50 font-semibold cursor-pointer"
          >
            Book Now
          </Link>
        </div>
      )}
    </header>
  );
}