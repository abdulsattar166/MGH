import { Link } from "react-router-dom";
import FaqSection from "@/components/feature/FaqSection";

export default function Footer() {
  return (
    <>
      <FaqSection />
      <footer className="bg-primary-950 text-background-100 pt-16 pb-6 px-4 md:px-8">
        <div className="mx-auto max-w-7xl grid md:grid-cols-4 gap-10">
          <div>
            <img
              src="https://static.readdy.ai/image/773d73dcd4bfe3b3ab546a821d990052/7b72bbd942d6c3a71db63e797abcba69.png"
              alt="Mubarak Group of Hostels"
              className="h-16 w-auto rounded-md bg-background-50/90 px-3 py-1 mb-4"
            />
            <p className="mt-5 text-sm text-background-200 leading-relaxed">
              Premium student hostels across Rawalpindi. A safe, clean and study-friendly second home for
              every student.
            </p>
            <div className="mt-6 flex gap-3">
              {["facebook", "instagram", "youtube", "whatsapp"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-9 h-9 rounded-md bg-background-50/10 hover:bg-accent-500 hover:text-foreground-950 flex items-center justify-center cursor-pointer transition"
                  aria-label={s}
                >
                  <i className={`ri-${s}-fill`}></i>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading text-background-50 font-bold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm">
              {["Home", "About", "Hostels", "Rooms", "Facilities", "Contact"].map((l) => (
                <li key={l}>
                  <a href={`#${l.toLowerCase()}`} className="hover:text-accent-400 cursor-pointer">
                    {l}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/manage/login" className="hover:text-accent-400 cursor-pointer">
                  Management
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-background-50 font-bold mb-4">Our Hostels</h4>
            <ul className="space-y-2 text-sm">
              {[
                "Jinnah Hostel",
                "Sama Hostel",
                "Abdul Qadeer Hostel",
              ].map((l) => (
                <li key={l}>
                  <a href="#hostels" className="hover:text-accent-400 cursor-pointer">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-background-50 font-bold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2">
                <i className="ri-map-pin-line text-accent-400 mt-0.5"></i>
                6th Road, Rawalpindi
              </li>
              <li className="flex gap-2">
                <i className="ri-phone-line text-accent-400 mt-0.5"></i>
                +92 300 000 0000
              </li>
              <li className="flex gap-2">
                <i className="ri-mail-line text-accent-400 mt-0.5"></i>
                admissions@mubarakhostels.pk
              </li>
            </ul>
          </div>
        </div>

        <div className="mx-auto max-w-7xl mt-12 pt-6 border-t border-background-50/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-background-300">
          <div>© 2026 Mubarak Group of Hostels. All rights reserved.</div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-accent-400 cursor-pointer">Privacy</a>
            <a href="#" className="hover:text-accent-400 cursor-pointer">Terms</a>
            <a href="#" className="hover:text-accent-400 cursor-pointer">Hostel Rules</a>
          </div>
        </div>
      </footer>
    </>
  );
}