import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SiteNavbar from "@/components/feature/SiteNavbar";
import SiteFooter from "@/components/feature/SiteFooter";
import WhatsAppFab from "@/pages/home/components/WhatsAppFab";
import { hostels } from "@/mocks/hostels";
import {
  type Applicant,
  type Booking,
  type RoomBeds,
  createBookingAsync,
  emptyApplicant,
} from "@/lib/booking";
import StepHostel from "./components/StepHostel";
import StepRoom from "./components/StepRoom";
import StepBed from "./components/StepBed";
import StepDetails from "./components/StepDetails";
import StepDocuments from "./components/StepDocuments";
import StepReview from "./components/StepReview";

const steps = ["Hostel", "Room", "Bed", "Details", "Documents", "Confirm"];

export default function Booking() {
  const [searchParams] = useSearchParams();
  const preHostel = Number(searchParams.get("hostel")) || null;

  const [hostelId, setHostelId] = useState<number | null>(preHostel);
  const [room, setRoom] = useState<RoomBeds | null>(null);
  const [bedNumber, setBedNumber] = useState<number | null>(null);
  const [form, setForm] = useState<Applicant>(emptyApplicant);
  const [step, setStep] = useState<number>(preHostel ? 1 : 0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Booking | null>(null);

  const selectedHostel = hostels.find((h) => h.id === hostelId);

  const setField = (field: keyof Applicant, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const goTo = (s: number) => {
    setError("");
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pickHostel = (id: number) => {
    setHostelId(id);
    setRoom(null);
    setBedNumber(null);
    goTo(1);
  };

  const pickRoom = (r: RoomBeds) => {
    setRoom(r);
    setBedNumber(null);
    goTo(2);
  };

  const pickBed = (b: number) => {
    setBedNumber(b);
    goTo(3);
  };

  const validate = (): string => {
    const missing: string[] = [];
    if (!form.fullName.trim()) missing.push("Full Name");
    if (!form.mobile.trim()) missing.push("Mobile Number");
    if (!form.whatsapp.trim()) missing.push("WhatsApp Number");
    if (!form.email.trim()) missing.push("Email Address");
    if (!form.cnic.trim()) missing.push("CNIC Number");
    if (!form.cnicFront) missing.push("CNIC Front Image");
    if (!form.cnicBack) missing.push("CNIC Back Image");
    if (!form.district.trim()) missing.push("District");
    if (!form.address.trim()) missing.push("Complete Address");
    if (!form.joiningDate) missing.push("Preferred Joining Date");

    if (missing.length === 0) return "";
    return `Please complete the following required fields: ${missing.join(", ")}.`;
  };

  const handleSubmit = async () => {
    if (!hostelId || !room || !bedNumber) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const booking = await createBookingAsync({
        hostelId,
        hostelName: selectedHostel?.name ?? "",
        roomLabel: room.label,
        block: room.block,
        floor: room.floor,
        bedNumber,
        applicant: form,
      });
      setSubmitted(booking);
    } catch (e) {
      setError((e as Error).message || "Could not submit your booking. Please try again.");
    } finally {
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const resetAll = () => {
    setHostelId(null);
    setRoom(null);
    setBedNumber(null);
    setForm(emptyApplicant);
    setSubmitted(null);
    setError("");
    goTo(0);
  };

  return (
    <div className="min-h-screen bg-background-50">
      <SiteNavbar />

      {/* Hero */}
      <section className="relative h-[300px] md:h-[380px] overflow-hidden">
        <img
          src="https://readdy.ai/api/search-image?query=Warm%20cozy%20premium%20hostel%20bedroom%20with%20neatly%20made%20wooden%20beds%2C%20crisp%20white%20linen%2C%20soft%20golden%20natural%20light%20through%20a%20large%20window%2C%20elegant%20cinematic%20interior%20photography%20of%20student%20accommodation&width=1800&height=1000&seq=booking-hero&orientation=landscape"
          alt="Book a room"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground-950/85 via-foreground-950/50 to-foreground-950/30"></div>
        <div className="absolute inset-0 flex items-end">
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pb-12">
            <span className="text-accent-400 text-xs tracking-[0.3em] uppercase font-semibold">
              Room &amp; Bed Reservation
            </span>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-background-50 mt-2">
              Book your hostel, room &amp; bed
            </h1>
            <p className="mt-3 text-background-200 max-w-xl">
              Reserve a specific bed in a few simple steps. Your request will be reviewed by the
              hostel team.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 md:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Success screen */}
          {submitted ? (
            <div className="bg-background-50 border border-background-200 rounded-2xl p-8 md:p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary-500 flex items-center justify-center">
                <i className="ri-check-line text-background-50 text-3xl"></i>
              </div>
              <h2 className="mt-5 font-heading text-2xl md:text-3xl font-bold text-foreground-950">
                Booking Submitted Successfully
              </h2>
              <p className="mt-2 text-foreground-600 max-w-md mx-auto">
                Your booking request has been received and is now awaiting approval.
              </p>

              <div className="mt-8 inline-block bg-background-100 border border-background-200 rounded-2xl px-8 py-5">
                <div className="text-xs uppercase tracking-widest text-foreground-500">
                  Your Booking ID
                </div>
                <div className="mt-1 font-heading text-3xl font-bold text-primary-600 tracking-wide">
                  {submitted.id}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-full bg-primary-100 text-primary-700">
                  {submitted.hostelName}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-secondary-100 text-secondary-900">
                  Room {submitted.roomLabel}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-accent-100 text-accent-900">
                  Bed {submitted.bedNumber}
                </span>
              </div>

              <div className="mt-6">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent-100 text-accent-900 text-sm font-semibold">
                  <i className="ri-time-line"></i>
                  Pending Approval
                </span>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/track-booking"
                  className="px-6 py-3 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
                >
                  <i className="ri-search-eye-line mr-1.5"></i>
                  Track Your Booking
                </Link>
                <button
                  onClick={resetAll}
                  className="px-6 py-3 rounded-md border border-background-300 text-foreground-800 text-sm font-semibold whitespace-nowrap cursor-pointer hover:bg-background-100 transition"
                >
                  <i className="ri-add-line mr-1.5"></i>
                  Make Another Booking
                </button>
                <Link
                  to="/"
                  className="px-6 py-3 rounded-md border border-background-300 text-foreground-800 text-sm font-semibold whitespace-nowrap cursor-pointer hover:bg-background-100 transition"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Stepper */}
              <div className="flex items-center justify-between mb-8 overflow-x-auto">
                {steps.map((label, i) => {
                  const active = i === step;
                  const done = i < step;
                  return (
                    <div key={label} className="flex flex-1 items-center min-w-0">
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition ${
                            done
                              ? "bg-primary-500 text-background-50"
                              : active
                                ? "bg-accent-500 text-foreground-950"
                                : "bg-background-200 text-foreground-500"
                          }`}
                        >
                          {done ? <i className="ri-check-line"></i> : i + 1}
                        </div>
                        <span
                          className={`mt-2 text-[11px] font-medium hidden sm:block whitespace-nowrap ${
                            active
                              ? "text-foreground-950 font-semibold"
                              : done
                                ? "text-primary-600"
                                : "text-foreground-500"
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                      {i < steps.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 ${done ? "bg-primary-500" : "bg-background-200"}`}
                        ></div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selection summary */}
              {step > 0 && step < 5 && (
                <div className="mb-8 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-foreground-500">Your selection:</span>
                  {selectedHostel && (
                    <button
                      onClick={() => goTo(0)}
                      className="px-3 py-1.5 rounded-full bg-primary-100 text-primary-700 font-medium cursor-pointer whitespace-nowrap"
                    >
                      {selectedHostel.name} <i className="ri-close-line ml-1"></i>
                    </button>
                  )}
                  {room && (
                    <button
                      onClick={() => goTo(1)}
                      className="px-3 py-1.5 rounded-full bg-secondary-100 text-secondary-900 font-medium cursor-pointer whitespace-nowrap"
                    >
                      Room {room.label} <i className="ri-close-line ml-1"></i>
                    </button>
                  )}
                  {bedNumber && (
                    <button
                      onClick={() => goTo(2)}
                      className="px-3 py-1.5 rounded-full bg-accent-100 text-accent-900 font-medium cursor-pointer whitespace-nowrap"
                    >
                      Bed {bedNumber} <i className="ri-close-line ml-1"></i>
                    </button>
                  )}
                </div>
              )}

              {/* Steps */}
              {step === 0 && <StepHostel selectedId={hostelId} onSelect={pickHostel} />}

              {step === 1 && hostelId && (
                <StepRoom
                  hostelId={hostelId}
                  selectedRoom={room?.label ?? null}
                  onSelect={pickRoom}
                  onBack={() => goTo(0)}
                />
              )}

              {step === 2 && hostelId && room && (
                <StepBed
                  hostelId={hostelId}
                  roomLabel={room.label}
                  selectedBed={bedNumber}
                  onSelect={pickBed}
                  onBack={() => goTo(1)}
                />
              )}

              {step === 3 && (
                <StepDetails
                  form={form}
                  onChange={setField}
                  onNext={() => goTo(4)}
                  onBack={() => goTo(2)}
                />
              )}

              {step === 4 && (
                <StepDocuments
                  form={form}
                  onChange={setField}
                  onNext={() => goTo(5)}
                  onBack={() => goTo(3)}
                />
              )}

              {step === 5 && hostelId && room && bedNumber && (
                <StepReview
                  hostelId={hostelId}
                  roomLabel={room.label}
                  bedNumber={bedNumber}
                  form={form}
                  error={error}
                  submitting={submitting}
                  onEdit={() => goTo(3)}
                  onSubmit={handleSubmit}
                />
              )}
            </>
          )}
        </div>
      </section>

      <SiteFooter />
      <WhatsAppFab />
    </div>
  );
}