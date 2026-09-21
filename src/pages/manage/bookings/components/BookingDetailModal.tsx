import { type Booking } from "@/lib/booking";
import { BookingStatusBadge, formatDate } from "./bookingMeta";

type Props = {
  booking: Booking;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-foreground-400">{label}</span>
      <span className="text-sm font-medium text-foreground-900 break-words">{value || "—"}</span>
    </div>
  );
}

export default function BookingDetailModal({
  booking,
  onClose,
  onApprove,
  onReject,
}: Props) {
  const a = booking.applicant;
  const actionable = booking.status === "pending";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-foreground-950/50" onClick={onClose}></div>

      <div className="relative w-full max-w-3xl bg-background-50 rounded-lg border border-background-200 my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-background-200 sticky top-0 bg-background-50 rounded-t-lg">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-heading text-lg font-bold text-foreground-950">
                {a.fullName || "Unnamed Applicant"}
              </h3>
              <BookingStatusBadge status={booking.status} />
            </div>
            <div className="mt-1 text-xs text-foreground-500">
              {booking.id} · Submitted {formatDate(booking.createdAt)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-md flex items-center justify-center text-foreground-500 hover:bg-background-100 cursor-pointer"
            aria-label="Close"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Selection */}
          <div>
            <h4 className="font-heading text-sm font-bold text-foreground-950 mb-3">Selection</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-background-100 rounded-md p-4">
              <Field label="Hostel" value={booking.hostelName} />
              <Field label="Room" value={`${booking.roomLabel} (Floor ${booking.floor})`} />
              <Field label="Bed" value={`Bed ${booking.bedNumber}`} />
              <Field label="Joining Date" value={a.joiningDate} />
            </div>
          </div>

          {/* Personal & contact */}
          <div>
            <h4 className="font-heading text-sm font-bold text-foreground-950 mb-3">
              Personal &amp; Contact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Father / Guardian" value={a.fatherName} />
              <Field label="Gender" value={a.gender} />
              <Field label="Date of Birth" value={a.dob} />
              <Field label="Mobile" value={a.mobile} />
              <Field label="WhatsApp" value={a.whatsapp} />
              <Field label="Email" value={a.email} />
              <Field label="CNIC" value={a.cnic} />
              <Field label="Occupation" value={a.occupation} />
              <Field label="Duration of Stay" value={a.duration} />
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 className="font-heading text-sm font-bold text-foreground-950 mb-3">Address</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="District" value={a.district} />
              <Field label="City" value={a.city} />
              <Field label="Tehsil" value={a.tehsil} />
              <Field label="Province / State" value={a.province} />
              <Field label="Country" value={a.country} />
              <Field label="Area" value={a.area} />
            </div>
            <div className="mt-3">
              <Field label="Complete Address" value={a.address} />
            </div>
          </div>

          {/* Emergency */}
          {(a.emergencyName || a.emergencyPhone) && (
            <div>
              <h4 className="font-heading text-sm font-bold text-foreground-950 mb-3">
                Emergency Contact
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Name" value={a.emergencyName} />
                <Field label="Number" value={a.emergencyPhone} />
                <Field label="Relationship" value={a.emergencyRelation} />
              </div>
            </div>
          )}

          {/* CNIC documents */}
          <div>
            <h4 className="font-heading text-sm font-bold text-foreground-950 mb-3">
              CNIC / ID Documents
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Front Side", src: a.cnicFront },
                { label: "Back Side", src: a.cnicBack },
              ].map((doc) => (
                <div key={doc.label} className="border border-background-200 rounded-md overflow-hidden bg-background-100">
                  <div className="px-3 py-2 text-xs font-semibold text-foreground-600 border-b border-background-200">
                    {doc.label}
                  </div>
                  {doc.src ? (
                    <img src={doc.src} alt={doc.label} className="w-full h-48 object-contain bg-background-100" />
                  ) : (
                    <div className="h-48 flex items-center justify-center text-foreground-400 text-sm">
                      No document
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {a.message && (
            <div>
              <h4 className="font-heading text-sm font-bold text-foreground-950 mb-3">Notes</h4>
              <p className="text-sm text-foreground-700 bg-background-100 rounded-md px-4 py-3">
                {a.message}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 px-6 py-4 border-t border-background-200">
          {actionable ? (
            <>
              <button
                onClick={onReject}
                className="px-5 py-2.5 rounded-md border border-secondary-300 text-secondary-900 text-sm font-semibold whitespace-nowrap cursor-pointer hover:bg-secondary-100 transition"
              >
                <i className="ri-close-circle-line mr-1.5"></i>
                Reject
              </button>
              <button
                onClick={onApprove}
                className="px-5 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
              >
                <i className="ri-check-line mr-1.5"></i>
                Approve Booking
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-md border border-background-300 text-foreground-800 text-sm font-semibold whitespace-nowrap cursor-pointer hover:bg-background-100 transition"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}