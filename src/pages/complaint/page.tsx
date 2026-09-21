import { useState } from "react";
import { Link } from "react-router-dom";
import SiteNavbar from "@/components/feature/SiteNavbar";
import SiteFooter from "@/components/feature/SiteFooter";
import { createComplaint, COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES, type Complaint } from "@/lib/complaints";
import { useHostels } from "@/hooks/useHostels";
import { useWardens } from "@/hooks/useWardens";

export default function ComplaintPage() {
  const { hostels } = useHostels();
  const { forHostel } = useWardens();
  const [studentCode, setStudentCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [room, setRoom] = useState("");
  const [category, setCategory] = useState<string>(COMPLAINT_CATEGORIES[0]);
  const [priority, setPriority] = useState<string>("Normal");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Complaint | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!studentCode.trim()) {
      setError("Please enter your student CNIC / Student ID so we can route your complaint.");
      return;
    }
    if (!description.trim()) {
      setError("Please describe your complaint.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createComplaint({
        studentCode: studentCode.trim(),
        studentName: studentName.trim() || undefined,
        room: room.trim() || undefined,
        category,
        priority,
        description: description.trim(),
      });
      setResult(created);
    } catch (err) {
      setError((err as Error).message || "Could not submit your complaint. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const wardenFor = (hostelId: number | null) => forHostel(hostelId);

  return (
    <div className="min-h-screen bg-background-50">
      <SiteNavbar />
      <main className="pt-28 pb-20 px-4 md:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-500 flex items-center justify-center">
              <i className="ri-customer-service-2-line text-background-50 text-3xl"></i>
            </div>
            <h1 className="mt-5 font-heading text-2xl md:text-3xl font-bold text-foreground-950">
              Submit a Complaint
            </h1>
            <p className="mt-2 text-sm text-foreground-600 max-w-md mx-auto">
              Tell us what's wrong. Your complaint is automatically routed to the warden of your hostel —
              you don't need to choose anyone.
            </p>
            <Link
              to="/my-complaints"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 cursor-pointer hover:underline"
            >
              <i className="ri-search-line"></i> Track an existing complaint
            </Link>
          </div>

          {result ? (
            <div className="bg-background-50 border border-background-200 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary-100 flex items-center justify-center">
                <i className="ri-check-line text-primary-700 text-2xl"></i>
              </div>
              <h2 className="mt-4 font-heading text-lg font-bold text-foreground-950">
                Complaint submitted
              </h2>
              <p className="mt-2 text-sm text-foreground-600">
                Your reference number is{" "}
                <span className="font-semibold text-foreground-900">{result.code ?? `#${result.id}`}</span>.
              </p>
              <div className="mt-4 inline-flex flex-col gap-1 text-sm text-foreground-700 bg-background-100 rounded-md px-4 py-3">
                <span>
                  Hostel:{" "}
                  <span className="font-medium text-foreground-900">
                    {hostels.find((h) => h.id === result.hostel_id)?.name ?? "—"}
                  </span>
                </span>
                <span>
                  Assigned Warden:{" "}
                  <span className="font-medium text-foreground-900">
                    {wardenFor(result.hostel_id)?.name ?? "To be assigned"}
                  </span>
                </span>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setResult(null);
                    setDescription("");
                    setStudentCode("");
                    setStudentName("");
                    setRoom("");
                  }}
                  className="px-5 py-2.5 rounded-md border border-background-300 text-sm font-semibold text-foreground-700 hover:bg-background-100 whitespace-nowrap cursor-pointer transition"
                >
                  Submit another
                </button>
                <Link
                  to="/"
                  className="px-5 py-2.5 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition"
                >
                  Back to home
                </Link>
                <Link
                  to="/my-complaints"
                  className="px-5 py-2.5 rounded-md border border-primary-300 text-sm font-semibold text-primary-700 hover:bg-primary-50 whitespace-nowrap cursor-pointer transition"
                >
                  <i className="ri-message-2-line mr-1.5"></i>Track my complaint
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-background-50 border border-background-200 rounded-2xl p-6 md:p-8 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-foreground-800 mb-1.5">
                    Student CNIC / Student ID <span className="text-accent-600">*</span>
                  </label>
                  <input
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder="e.g. 37405-1234567-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-800 mb-1.5">
                    Full Name (optional)
                  </label>
                  <input
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-800 mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
                  >
                    {COMPLAINT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-800 mb-1.5">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
                  >
                    {COMPLAINT_PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground-800 mb-1.5">
                    Room (optional)
                  </label>
                  <input
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder="e.g. A1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-800 mb-1.5">
                  Complaint Description <span className="text-accent-600">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  rows={5}
                  maxLength={500}
                  className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                  placeholder="Describe the issue in detail…"
                ></textarea>
                <div className="mt-1 text-xs text-foreground-500 text-right">
                  {description.length}/500
                </div>
              </div>

              {error && (
                <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60"
              >
                {submitting && <i className="ri-loader-4-line animate-spin"></i>}
                Submit Complaint
              </button>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}