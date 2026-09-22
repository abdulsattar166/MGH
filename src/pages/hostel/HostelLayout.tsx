import { useParams, Outlet, Link } from "react-router-dom";
import { useHostelFull } from "@/hooks/useHostelFull";
import HostelNavbar from "./components/HostelNavbar";
import HostelFooter from "./components/HostelFooter";
import WhatsAppFab from "@/pages/home/components/WhatsAppFab";

export default function HostelLayout() {
  const { id } = useParams();
  const { hostel, loading } = useHostelFull(id ? Number(id) : null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-50">
        <div className="flex flex-col items-center gap-3 text-foreground-600">
          <i className="ri-loader-4-line animate-spin text-3xl"></i>
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-50 px-4 text-center">
        <i className="ri-error-warning-line text-5xl text-accent-500"></i>
        <h1 className="font-heading text-2xl font-bold text-foreground-950 mt-4">
          Hostel not found
        </h1>
        <Link
          to="/hostels"
          className="mt-6 px-6 py-3 rounded-md bg-primary-500 text-background-50 font-semibold cursor-pointer"
        >
          View All Hostels
        </Link>
      </div>
    );
  }

  const msg = `Hello, I am interested in ${hostel.name} at ${hostel.location ?? ""}. Please share room availability and admission details.`;

  return (
    <div className="min-h-screen bg-background-50">
      <HostelNavbar id={hostel.id} name={hostel.name} />
      <main>
        <Outlet />
      </main>
      <HostelFooter id={hostel.id} name={hostel.name} />
      <WhatsAppFab message={msg} />
    </div>
  );
}