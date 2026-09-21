import { hostels } from "@/mocks/hostels";
import { type Applicant } from "@/lib/booking";
import { useHostelRooms } from "@/hooks/useHostelRooms";

type Props = {
  hostelId: number;
  roomLabel: string;
  bedNumber: number;
  form: Applicant;
  error: string;
  submitting: boolean;
  onEdit: () => void;
  onSubmit: () => void;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-3 border-b border-background-100 last:border-0">
      <span className="text-sm text-foreground-500">{label}</span>
      <span className="text-sm font-medium text-foreground-950 text-right break-words">
        {value || "—"}
      </span>
    </div>
  );
}

export default function StepReview({
  hostelId,
  roomLabel,
  bedNumber,
  form,
  error,
  submitting,
  onEdit,
  onSubmit,
}: Props) {
  const hostel = hostels.find((h) => h.id === hostelId);
  const rooms = useHostelRooms(hostelId);
  const room = rooms.find((r) => r.label === roomLabel);

  return (
    <div>
      <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground-950">
        Review your booking
      </h2>
      <p className="mt-2 text-sm text-foreground-600">
        Confirm the details below before submitting. Your booking will be reviewed by the hostel
        team.
      </p>

      <div className="mt-6 grid lg:grid-cols-2 gap-5">
        {/* Selection */}
        <div className="bg-background-50 border border-background-200 rounded-2xl p-6">
          <h3 className="font-heading text-base font-bold text-foreground-950 mb-2">Selection</h3>
          <Row label="Selected Hostel" value={hostel?.name ?? ""} />
          <Row label="Selected Room" value={`${roomLabel} · Floor ${room?.floor} · Block ${room?.block}`} />
          <Row label="Selected Bed" value={`Bed ${bedNumber}`} />
          <Row label="Joining Date" value={form.joiningDate} />
          <Row label="Duration of Stay" value={form.duration} />
        </div>

        {/* Applicant */}
        <div className="bg-background-50 border border-background-200 rounded-2xl p-6">
          <h3 className="font-heading text-base font-bold text-foreground-950 mb-2">Applicant</h3>
          <Row label="Full Name" value={form.fullName} />
          <Row label="Mobile" value={form.mobile} />
          <Row label="WhatsApp" value={form.whatsapp} />
          <Row label="Email" value={form.email} />
          <Row label="CNIC" value={form.cnic} />
          <Row label="District" value={form.district} />
          <Row label="Address" value={form.address} />
        </div>
      </div>

      {error && (
        <div className="mt-5 bg-accent-50 border border-accent-200 text-accent-900 rounded-md px-4 py-3 text-sm">
          <i className="ri-error-warning-line mr-1.5"></i>
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="px-5 py-3 rounded-md border border-background-300 text-foreground-800 text-sm font-semibold whitespace-nowrap cursor-pointer hover:bg-background-100 transition"
        >
          <i className="ri-edit-line mr-1.5"></i>
          Edit Information
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="px-7 py-3 rounded-md bg-accent-500 hover:bg-accent-600 text-foreground-950 text-sm font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <i className="ri-loader-4-line animate-spin mr-1.5"></i>
              Submitting…
            </>
          ) : (
            <>
              <i className="ri-check-double-line mr-1.5"></i>
              Confirm &amp; Submit Booking
            </>
          )}
        </button>
      </div>
    </div>
  );
}