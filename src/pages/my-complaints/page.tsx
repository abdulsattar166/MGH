import { useState } from "react";
import { Link } from "react-router-dom";
import SiteNavbar from "@/components/feature/SiteNavbar";
import SiteFooter from "@/components/feature/SiteFooter";
import { lookupComplaints, type Complaint } from "@/lib/complaints";
import type { ComplaintResponse } from "@/lib/complaintResponses";
import ComplaintCard from "./components/ComplaintCard";

type LookupResult = {
  complaints: Complaint[];
  responses: ComplaintResponse[];
};

export default function MyComplaints() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) {
      setError("Please enter your CNIC or Student ID.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      setResult(await lookupComplaints(code.trim()));
    } catch (err) {
      setError((err as Error).message || "Could not load your complaints.");
    } finally {
      setLoading(false);
    }
  };

  const responsesByComplaint = (result?.responses ?? []).reduce<
    Record<number, ComplaintResponse[]>
  >((acc, r) => {
    (acc[r.complaint_id] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background-50">
      <SiteNavbar />

      <main className="pt-28 pb-20 px-4 md:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary-500 flex items-center justify-center">
              <i className="ri-message-2-line text-background-50 text-3xl"></i>
            </div>
            <h1 className="mt-5 font-heading text-2xl md:text-3xl font-bold text-foreground-950">
              Track My Complaints
            </h1>
            <p className="mt-2 text-sm text-foreground-600 max-w-md mx-auto">
              Enter your CNIC or Student ID to see your submitted complaints and the warden's
              replies.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-background-50 border border-background-200 rounded-2xl p-5 md:p-6"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <i className="ri-id-card-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. 37405-1234567-1"
                  className="w-full pl-9 pr-4 py-3 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60"
              >
                {loading && <i className="ri-loader-4-line animate-spin"></i>}
                Track
              </button>
            </div>

            {error && (
              <div className="mt-3 text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">
                {error}
              </div>
            )}
          </form>

          {result && (
            <div className="mt-8">
              <h2 className="font-heading text-lg font-bold text-foreground-950 mb-4">
                {result.complaints.length} complaint{result.complaints.length === 1 ? "" : "s"}{" "}
                found
              </h2>

              {result.complaints.length === 0 ? (
                <div className="text-center py-14 text-foreground-500 bg-background-50 border border-background-200 rounded-2xl">
                  <i className="ri-inbox-line text-4xl block mb-3"></i>
                  No complaints found for this CNIC / Student ID yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {result.complaints.map((c) => (
                    <ComplaintCard
                      key={c.id}
                      complaint={c}
                      responses={responsesByComplaint[c.id] ?? []}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {!result && !loading && (
            <p className="mt-6 text-center text-sm text-foreground-500">
              Need to submit a new complaint?{" "}
              <Link
                to="/complaint"
                className="text-primary-600 font-semibold cursor-pointer hover:underline"
              >
                Submit here
              </Link>
            </p>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}