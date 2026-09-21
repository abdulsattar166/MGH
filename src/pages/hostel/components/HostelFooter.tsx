import { Link } from "react-router-dom";
import { hostelLocations } from "@/mocks/hostels";
import FaqSection from "@/components/feature/FaqSection";

type Props = {
  id: number;
  name: string;
};

export default function HostelFooter({ id, name }: Props) {
  const loc = hostelLocations.find((l) => l.id === id);

  return (
    <>
      <FaqSection />
      <footer className="bg-primary-950 text-background-100 pt-14 pb-6 px-4 md:px-8">
        <div className="mx-auto max-w-7xl grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-accent-500 flex items-center justify-center">
                <i className="ri-home-heart-fill text-foreground-950 text-xl"></i>
              </div>
              <div>
                <div className="font-heading text-lg font-bold text-background-50">{name}</div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-background-300">
                  Mubarak Group of Hostels
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm text-background-200 leading-relaxed">
              A secure, comfortable and study-friendly residence for students in Lahore.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 mt-5 text-sm text-accent-300 hover:text-accent-400 cursor-pointer"
            >
              <i className="ri-arrow-left-line"></i>
              Back to Mubarak Group
            </Link>
          </div>

          <div>
            <h4 className="font-heading text-background-50 font-bold mb-4">Explore This Hostel</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: "Home", to: `/hostel/${id}` },
                { label: "Rooms & Beds", to: `/hostel/${id}/rooms` },
                { label: "Gallery", to: `/hostel/${id}/gallery` },
                { label: "Contact", to: `/hostel/${id}/contact` },
                { label: "Warden Login", to: `/hostel/${id}/warden-login` },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-accent-400 cursor-pointer">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-background-50 font-bold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              {loc && (
                <>
                  <li className="flex gap-2">
                    <i className="ri-map-pin-line text-accent-400 mt-0.5"></i>
                    {loc.address}
                  </li>
                  <li className="flex gap-2">
                    <i className="ri-phone-line text-accent-400 mt-0.5"></i>
                    {loc.phone}
                  </li>
                  <li className="flex gap-2">
                    <i className="ri-mail-line text-accent-400 mt-0.5"></i>
                    {loc.email}
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="mx-auto max-w-7xl mt-12 pt-6 border-t border-background-50/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-background-300">
          <div>© 2026 Mubarak Group of Hostels. All rights reserved.</div>
          <div className="flex gap-5">
            <Link to="/hostels" className="hover:text-accent-400 cursor-pointer">
              All Hostels
            </Link>
            <Link to="/about" className="hover:text-accent-400 cursor-pointer">
              About
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}