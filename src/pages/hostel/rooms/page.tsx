import { useParams, Link } from "react-router-dom";
import { useHostelFull } from "@/hooks/useHostelFull";
import RoomGrid from "@/pages/hostel/components/RoomGrid";

export default function HostelRooms() {
  const { id } = useParams();
  const { hostel, loading } = useHostelFull(id ? Number(id) : null);

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
            {loading || !hostel ? "Back" : `Back to ${hostel.name}`}
          </Link>
          <h1 className="mt-4 font-heading text-3xl md:text-4xl font-bold text-background-50">
            Rooms &amp; Availability
          </h1>
          <p className="mt-3 text-background-200 max-w-2xl">
            {hostel ? (
              <>
                Explore all rooms at {hostel.name}, organised floor-by-floor and block-by-block.
                Rooms with free beds are available to book; full rooms are greyed out.
              </>
            ) : (
              "Rooms are organised floor-by-floor and block-by-block. Rooms with free beds are available to book."
            )}
          </p>
        </div>
      </section>

      {/* Floor / block grid */}
      <section className="py-16 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-foreground-500">
              <i className="ri-loader-4-line animate-spin text-2xl"></i>
              <span className="text-sm">Loading rooms…</span>
            </div>
          ) : (
            <RoomGrid hostelId={Number(id)} />
          )}
        </div>
      </section>
    </div>
  );
}