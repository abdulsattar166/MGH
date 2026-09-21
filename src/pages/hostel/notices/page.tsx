import { useParams } from "react-router-dom";
import { hostels } from "@/mocks/hostels";
import NoticesBoard from "@/pages/hostel/components/NoticesBoard";

export default function HostelNotices() {
  const { id } = useParams();
  const hostel = hostels.find((h) => h.id === Number(id));

  if (!hostel) return null;

  return (
    <div>
      <section className="relative h-[300px] md:h-[360px] overflow-hidden">
        <img
          src={hostel.image}
          alt={hostel.name}
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/60 via-foreground-950/40 to-foreground-950/70"></div>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8 text-center">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-background-50">
              Notices Board
            </h1>
            <p className="mt-3 text-background-200 text-sm md:text-base">
              Official announcements from the warden of {hostel.name}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 md:px-8 bg-background-100">
        <div className="mx-auto max-w-4xl">
          <NoticesBoard hostelId={hostel.id} />
        </div>
      </section>
    </div>
  );
}